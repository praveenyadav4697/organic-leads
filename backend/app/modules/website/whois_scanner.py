"""Domain registration data: RDAP first, WHOIS fallback.

RDAP (Registration Data Access Protocol, RFC 7483) gives structured JSON
over HTTPS, which is much nicer to parse than WHOIS plaintext. For TLDs
that publish RDAP endpoints we use that; otherwise we fall back to
python-whois.

Neither source is fully reliable:
  * Many ccTLDs don't publish RDAP at all.
  * GDPR has led many registrars to redact registrant fields.
  * WHOIS connections are slow and rate-limited.

So the inspector treats the surface as "best effort" and never raises.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.modules.website.discovery_schemas import WhoisFacts, to_fields_dict
from app.modules.website.http_inspector import HTTPInspector, FetchResult


# IANA RDAP bootstrap: https://data.iana.org/rdap/dns.json
# We hardcode a small fallback table for the most common TLDs rather than
# maintaining a full bootstrap list. RDAP servers listed by IANA.
_RDAP_BOOTSTRAP: Dict[str, str] = {
    "com": "https://rdap.verisign.com/com/v1/domain/",
    "net": "https://rdap.verisign.com/net/v1/domain/",
    "org": "https://rdap.publicinterestregistry.org/rdap/org/domain/",
    "io": "https://rdap.nic.io/domain/",
    "dev": "https://rdap.nic.google/domain/",
    "app": "https://rdap.nic.google/domain/",
    "co": "https://rdap.nic.co/domain/",
    "ai": "https://rdap.nic.ai/domain/",
    "info": "https://rdap.afilias.net/rdap/info/domain/",
    "biz": "https://rdap.afilias.net/rdap/biz/domain/",
    "us": "https://rdap.nic.us/domain/",
    "uk": "https://rdap.nominet.uk/domain/",
    "tv": "https://rdap.nic.tv/domain/",
    "me": "https://rdap.nic.me/domain/",
    "cloud": "https://rdap.nic.cloud/domain/",
}


def _tld(domain: str) -> str:
    if not domain:
        return ""
    parts = domain.lower().split(".")
    return parts[-1] if parts else ""


async def lookup(domain: str, http: Optional[HTTPInspector] = None) -> WhoisFacts:
    """Look up registration data for ``domain``.

    Returns an envelope. If both RDAP and WHOIS fail, the envelope is
    flagged ``not_publicly_available=True`` so the frontend renders
    "Not Publicly Available" instead of empty fields.
    """
    if not domain:
        return WhoisFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": "no domain"},
        )

    # 1. RDAP first (clean, structured, future-proof).
    rdap = await _try_rdap(domain, http)
    if rdap is not None:
        return _to_facts(rdap, source="rdap")

    # 2. WHOIS fallback (slower, text-only, less reliable).
    text = _try_whois(domain)
    if text is not None:
        parsed = _parse_whois_text(text)
        return _to_facts(parsed, source="whois")

    # 3. Both failed.
    return WhoisFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=True,
        fields={"domain": domain, "error": "RDAP and WHOIS both failed"},
    )


# ---------------------------------------------------------------------------
# RDAP
# ---------------------------------------------------------------------------


async def _try_rdap(domain: str, http: Optional[HTTPInspector]) -> Optional[Dict[str, Any]]:
    """Attempt RDAP. Returns the parsed JSON dict on success, else None."""
    tld = _tld(domain)
    base = _RDAP_BOOTSTRAP.get(tld)
    if not base or http is None:
        return None

    url = base + domain
    try:
        result = await http.fetch(url, transport="rdap")
    except Exception:
        return None

    if not result.ok or result.status_code != 200 or not result.text:
        return None
    try:
        import json
        return json.loads(result.text)
    except Exception:
        return None


def _to_facts(payload: Dict[str, Any], source: str) -> WhoisFacts:
    """Convert an RDAP JSON dict or a parsed WHOIS dict into WhoisFacts."""
    events = {e.get("eventAction"): e.get("eventDate") for e in payload.get("events", []) if isinstance(e, dict)}
    entities = payload.get("entities", []) or []
    registrar = _extract_registrar(entities)
    registrant_name = _extract_entity(entities, "registrant")
    registrant_email = _extract_email(entities, "registrant")
    nameservers = [n.get("ldhName") for n in payload.get("nameservers", []) if isinstance(n, dict) and n.get("ldhName")]
    status = payload.get("status", []) or []
    if isinstance(status, str):
        status = [status]

    fields = to_fields_dict(
        registrar=registrar,
        registrant_name=registrant_name,
        registrant_email=registrant_email,
        registration_date=_parse_iso_datetime(events.get("registration")),
        expiry_date=_parse_iso_datetime(events.get("expiration")),
        updated_date=_parse_iso_datetime(events.get("last changed") or events.get("last update")),
        name_servers=nameservers or None,
        status=status or None,
        source=source,
    )

    return WhoisFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=len(fields) == 0,
        fields=fields,
    )


def _parse_iso_datetime(value: Any) -> Optional[datetime]:
    """Parse an RDAP/WHOIS date value into a timezone-aware datetime.

    RDAP ``eventDate`` values are ISO 8601 strings such as
    ``1995-08-14T04:00:00Z``.  SQLAlchemy needs a ``datetime`` instance for
    ``DateTime(timezone=True)`` columns, so we convert here.  If the value is
    already a ``datetime`` it is returned as-is; otherwise ``None`` is
    returned so the field is omitted.
    """
    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=datetime.timezone.utc)
        return value
    if not isinstance(value, str):
        return None
    text = value.strip()
    if not text:
        return None
    text = text.replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except (TypeError, ValueError):
        pass
    # Fallback for formats like "14-Aug-1995".
    for fmt in ("%d-%b-%Y", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            return datetime.strptime(text, fmt).replace(tzinfo=datetime.timezone.utc)
        except (TypeError, ValueError):
            pass
    return None


def _extract_registrar(entities: List[Dict[str, Any]]) -> Optional[str]:
    for ent in entities:
        roles = ent.get("roles", []) or []
        if "registrar" in roles:
            for vcard in ent.get("vcardArray", [None, None])[1] or []:
                if isinstance(vcard, list) and vcard and vcard[0] == "fn":
                    return vcard[3]
            return ent.get("handle")
    return None


def _extract_entity(entities: List[Dict[str, Any]], role: str) -> Optional[str]:
    for ent in entities:
        if role in (ent.get("roles") or []):
            for vcard in ent.get("vcardArray", [None, None])[1] or []:
                if isinstance(vcard, list) and vcard and vcard[0] == "fn":
                    return vcard[3]
            return ent.get("handle")
    return None


def _extract_email(entities: List[Dict[str, Any]], role: str) -> Optional[str]:
    for ent in entities:
        if role in (ent.get("roles") or []):
            for vcard in ent.get("vcardArray", [None, None])[1] or []:
                if isinstance(vcard, list) and vcard and vcard[0] == "email":
                    return vcard[3]
    return None


# ---------------------------------------------------------------------------
# WHOIS (python-whois fallback)
# ---------------------------------------------------------------------------


def _try_whois(domain: str) -> Optional[str]:
    """Run python-whois; return the raw text or None on failure."""
    try:
        import whois  # python-whois
        w = whois.whois(domain)
        # python-whois returns an object; empty domains raise.
        if not w:
            return None
        # Convert to a dict for the existing parser path.
        if isinstance(w, dict):
            return w
        # Object: stuff the textual representation into a key for the parser.
        return {"__raw__": str(w), "domain_name": w.domain, "registrar": w.registrar}
    except Exception:
        return None


def _parse_whois_text(blob: Any) -> Dict[str, Any]:
    """Best-effort extraction of registrar / dates / nameservers from a
    python-whois result (which may be a dict or a Whois object)."""
    if isinstance(blob, dict):
        return blob
    # python-whois returns a WhoisEntry where each attribute is a list-or-string.
    out: Dict[str, Any] = {}
    for attr in ("registrar", "creation_date", "expiration_date", "updated_date", "name_servers", "emails", "status", "name"):
        try:
            value = getattr(blob, attr, None)
        except Exception:
            value = None
        if value is None:
            continue
        if isinstance(value, list):
            value = value[0] if value else None
        out[attr] = value
    if "creation_date" in out:
        out["registration"] = out.pop("creation_date")
    if "expiration_date" in out:
        out["expiration"] = out.pop("expiration_date")
    ns = out.get("name_servers")
    if isinstance(ns, str):
        out["name_servers"] = [ns]
    return out
