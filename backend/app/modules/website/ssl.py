"""SSL/TLS inspection using the Python standard library.

We connect to the host on port 443 with stdlib ``ssl`` and pull the peer
certificate. We read issuer / subject / SANs / expiry from the verified
certificate dict and report the negotiated TLS version, which is a real
public signal of server config.

This module never logs or stores the cert chain or private key (there is
no private key on the wire). It only reads the leaf certificate.
"""
from __future__ import annotations

import asyncio
import socket
import ssl
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from urllib.parse import urlparse

from app.modules.website.discovery_schemas import SSLFacts, to_fields_dict


# ---------------------------------------------------------------------------
# Sync helpers — they live on a thread so the event loop is never blocked.
# ---------------------------------------------------------------------------


def _fetch_cert(host: str, port: int = 443, timeout: float = 10.0) -> Dict[str, Any]:
    """Open a TLS connection to ``host:port`` and pull the leaf certificate.

    Returns a dict with raw cert, negotiated TLS version, and cipher. Any
    exception is captured under the ``error`` key — the caller turns that
    into ``not_publicly_available=True``.
    """
    ctx = ssl.create_default_context()
    # We DO want to verify; a cert we can't verify is not a public fact.
    ctx.check_hostname = True
    ctx.verify_mode = ssl.CERT_REQUIRED

    info: Dict[str, Any] = {"ok": False, "error": None}

    try:
        with socket.create_connection((host, port), timeout=timeout) as raw_sock:
            with ctx.wrap_socket(raw_sock, server_hostname=host) as tls_sock:
                cert = tls_sock.getpeercert()
                info["tls_version"] = tls_sock.version()
                info["cipher"] = tls_sock.cipher()
                info["cert"] = cert
                info["ok"] = True
    except Exception as e:  # noqa: BLE001 — network/SSL errors are the norm here
        info["error"] = f"{type(e).__name__}: {e}"

    return info


def _parse_cert(cert: Dict[str, Any]) -> Dict[str, Any]:
    """Parse stdlib cert info into the public facts we surface."""
    issuer = _format_name(cert.get("issuer"))
    subject = _format_name(cert.get("subject"))
    sans = _extract_sans(cert)

    # Validity
    now = datetime.now(timezone.utc)
    not_before = _parse_cert_time(cert.get("notBefore"))
    not_after = _parse_cert_time(cert.get("notAfter"))
    days_left = (not_after - now).days if not_after else None
    is_expired = now > not_after if not_after else None
    is_self_signed = issuer == subject if issuer and subject else None

    # Serial number (hex, no colons)
    serial = cert.get("serialNumber")
    version = cert.get("version")

    return {
        "issuer": issuer,
        "subject": subject,
        "serial_number": serial,
        "not_before": not_before,
        "not_after": not_after,
        "days_until_expiry": days_left,
        "is_expired": is_expired,
        "is_self_signed": is_self_signed,
        "signature_algorithm": None,
        "public_key_type": None,
        "public_key_bits": None,
        "subject_alt_names": sans,
        "version": f"v{version}" if version else None,
    }


def _format_name(name: Any) -> Optional[str]:
    if not name:
        return None

    labels = {
        "commonName": "CN",
        "organizationName": "O",
        "organizationalUnitName": "OU",
        "countryName": "C",
        "stateOrProvinceName": "ST",
        "localityName": "L",
    }
    parts = []
    try:
        for rdn in name:
            for key, value in rdn:
                label = labels.get(key)
                if label and value:
                    parts.append(f"{label}={value}")
    except Exception:  # noqa: BLE001
        return str(name)
    return ", ".join(parts) if parts else None


def _parse_cert_time(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    return datetime.fromtimestamp(ssl.cert_time_to_seconds(value), timezone.utc)


def _extract_sans(cert: Dict[str, Any]) -> Optional[list]:
    try:
        sans = [
            value
            for kind, value in cert.get("subjectAltName", ())
            if kind == "DNS" and value
        ]
        return sans or None
    except Exception:  # noqa: BLE001
        return None


# ---------------------------------------------------------------------------
# Public coroutine
# ---------------------------------------------------------------------------


async def inspect(url: str) -> SSLFacts:
    """Public SSL inspection.

    For HTTP URLs we return ``not_publicly_available=True`` (no cert to
    inspect). For HTTPS URLs we open a TLS connection and parse the
    certificate.
    """
    if not url:
        return SSLFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": "no URL provided"},
        )

    parsed = urlparse(url)
    host = parsed.hostname
    scheme = (parsed.scheme or "").lower()

    if scheme != "https" or not host:
        return SSLFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={
                "https_enabled": False,
                "scheme": scheme or None,
                "reason": "Site is not served over HTTPS; no certificate to inspect.",
            },
        )

    # Run blocking socket/SSL work on a thread so we don't stall the loop.
    raw = await asyncio.to_thread(_fetch_cert, host, 443, 10.0)

    if not raw.get("ok"):
        return SSLFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"host": host, "error": raw.get("error") or "TLS handshake failed"},
        )

    parsed_cert = await asyncio.to_thread(_parse_cert, raw["cert"])

    fields = to_fields_dict(
        https_enabled=True,
        host=host,
        issuer=parsed_cert["issuer"],
        subject=parsed_cert["subject"],
        serial_number=parsed_cert["serial_number"],
        tls_version=raw.get("tls_version"),
        cipher=raw.get("cipher"),
        not_before=parsed_cert["not_before"],
        not_after=parsed_cert["not_after"],
        days_until_expiry=parsed_cert["days_until_expiry"],
        is_expired=parsed_cert["is_expired"],
        is_self_signed=parsed_cert["is_self_signed"],
        signature_algorithm=parsed_cert["signature_algorithm"],
        public_key_type=parsed_cert["public_key_type"],
        public_key_bits=parsed_cert["public_key_bits"],
        subject_alt_names=parsed_cert["subject_alt_names"],
        certificate_version=parsed_cert["version"],
    )

    return SSLFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=False,
        fields=fields,
    )
