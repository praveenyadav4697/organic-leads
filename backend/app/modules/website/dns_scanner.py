"""DNS-only discovery: A/AAAA/MX/NS/TXT (with SPF/DMARC extraction).

Pure resolver, no WHOIS, no HTTP. Failures are non-fatal.

Why dnspython: the stdlib ``socket.gethostbyname`` only returns the first
A record, doesn't catch transient errors, and doesn't surface DNSSEC.
``dns.resolver.Resolver`` is the standard tool for this.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

import dns.exception
import dns.rdatatype
import dns.resolver

from app.modules.website.discovery_schemas import DNSFacts, to_fields_dict


_DEFAULT_TIMEOUT = 5.0


def _resolver() -> dns.resolver.Resolver:
    r = dns.resolver.Resolver()
    r.lifetime = _DEFAULT_TIMEOUT
    r.timeout = _DEFAULT_TIMEOUT
    return r


def _resolve(resolver: dns.resolver.Resolver, name: str, rdtype: int) -> List[str]:
    """Resolve, returning a list of strings. Empty list on failure."""
    try:
        ans = resolver.resolve(name, rdtype)
        return [rdata.to_text().strip() for rdata in ans]
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN, dns.resolver.NoNameservers):
        return []
    except dns.exception.Timeout:
        return []
    except Exception:  # noqa: BLE001 — fail-safe; DNS errors shouldn't crash the scan
        return []


def scan(domain: str) -> DNSFacts:
    """Discover all DNS records for ``domain`` and return a DNSFacts envelope."""
    if not domain:
        return DNSFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": "no domain"},
        )

    resolver = _resolver()

    a_records = _resolve(resolver, domain, dns.rdatatype.A)
    aaaa_records = _resolve(resolver, domain, dns.rdatatype.AAAA)
    mx_records = _resolve(resolver, domain, dns.rdatatype.MX)
    ns_records = _resolve(resolver, domain, dns.rdatatype.NS)
    txt_records = _resolve(resolver, domain, dns.rdatatype.TXT)

    # Strip surrounding quotes from TXT records (dnspython returns
    # "v=spf1 ..." with the literal quotes).
    txt_records = [t.strip('"') for t in txt_records]

    # SPF (and DMARC, queried at _dmarc.domain) live in TXT records.
    spf_record = next(
        (t for t in txt_records if t.lower().startswith("v=spf1")),
        None,
    )
    dmarc_record = ""
    if a_records or aaaa_records or ns_records:
        # Only query DMARC if the base domain resolves — DMARC lookups
        # against an unresolvable domain are wasted work.
        dmarc_list = _resolve(resolver, f"_dmarc.{domain}", dns.rdatatype.TXT)
        dmarc_record = next(
            (t.strip('"') for t in dmarc_list if t.lower().startswith("v=dmarc1")),
            None,
        )

    # DNSSEC: query for a DNSKEY at the zone apex. If present, signed.
    dnssec_enabled = bool(_resolve(resolver, domain, dns.rdatatype.DNSKEY))

    # Propagation status: "resolved" if any A or AAAA came back.
    propagation = "resolved" if (a_records or aaaa_records) else "unresolved"

    # If we got nothing useful at all, flag as not publicly available.
    unavailable = not any([a_records, aaaa_records, mx_records, ns_records, txt_records])

    fields = to_fields_dict(
        a_records=a_records or None,
        aaaa_records=aaaa_records or None,
        mx_records=mx_records or None,
        nameservers=ns_records or None,
        txt_records=txt_records or None,
        spf_record=spf_record,
        dmarc_record=dmarc_record or None,
        dnssec_enabled=dnssec_enabled,
        propagation_status=propagation,
    )

    return DNSFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=unavailable,
        fields=fields,
    )
