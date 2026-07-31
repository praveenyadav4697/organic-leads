"""SSL/TLS inspection — full certificate parsing via the cryptography lib.

We connect to the host on port 443 with stdlib ``ssl`` and pull the peer
certificate as DER. ``cryptography`` parses it into an
``x509.Certificate`` so we can read issuer / subject / SANs / expiry /
signature algorithm / public key info. We also report the negotiated
TLS version, which is a real public signal of server config.

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

from cryptography import x509
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import hashes
from cryptography.x509.oid import NameOID

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
                der = tls_sock.getpeercert(binary_form=True)
                info["tls_version"] = tls_sock.version()
                info["cipher"] = tls_sock.cipher()
                info["cert_der"] = der
                info["ok"] = True
    except Exception as e:  # noqa: BLE001 — network/SSL errors are the norm here
        info["error"] = f"{type(e).__name__}: {e}"

    return info


def _parse_cert(der: bytes) -> Dict[str, Any]:
    """Parse a DER cert into the public facts we surface."""
    cert = x509.load_der_x509_certificate(der, default_backend())

    issuer = _format_name(cert.issuer)
    subject = _format_name(cert.subject)
    sans = _extract_sans(cert)
    sig_algo = cert.signature_hash_algorithm.name if cert.signature_hash_algorithm else None

    # Key info
    pubkey = cert.public_key()
    key_type = type(pubkey).__name__
    key_size = getattr(pubkey, "key_size", None)

    # Validity
    now = datetime.now(timezone.utc)
    not_before = cert.not_valid_before_utc if hasattr(cert, "not_valid_before_utc") else cert.not_valid_before.replace(tzinfo=timezone.utc)
    not_after = cert.not_valid_after_utc if hasattr(cert, "not_valid_after_utc") else cert.not_valid_after.replace(tzinfo=timezone.utc)
    days_left = (not_after - now).days
    is_expired = now > not_after
    is_self_signed = cert.issuer == cert.subject

    # Serial number (hex, no colons)
    serial = format(cert.serial_number, "x")

    return {
        "issuer": issuer,
        "subject": subject,
        "serial_number": serial,
        "not_before": not_before,
        "not_after": not_after,
        "days_until_expiry": days_left,
        "is_expired": is_expired,
        "is_self_signed": is_self_signed,
        "signature_algorithm": sig_algo,
        "public_key_type": key_type,
        "public_key_bits": key_size,
        "subject_alt_names": sans,
        "version": cert.version.name,
    }


def _format_name(name: x509.Name) -> str:
    parts = []
    try:
        cn = name.get_attributes_for_oid(NameOID.COMMON_NAME)
        if cn:
            parts.append(f"CN={cn[0].value}")
        o = name.get_attributes_for_oid(NameOID.ORGANIZATION_NAME)
        if o:
            parts.append(f"O={o[0].value}")
        ou = name.get_attributes_for_oid(NameOID.ORGANIZATIONAL_UNIT_NAME)
        if ou:
            parts.append(f"OU={ou[0].value}")
    except Exception:  # noqa: BLE001
        return str(name)
    return ", ".join(parts) if parts else str(name)


def _extract_sans(cert: x509.Certificate) -> Optional[list]:
    try:
        ext = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName)
        sans = ext.value.get_values_for_type(x509.DNSName)
        return sans or None
    except x509.ExtensionNotFound:
        return None
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

    parsed_cert = await asyncio.to_thread(_parse_cert, raw["cert_der"])

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
