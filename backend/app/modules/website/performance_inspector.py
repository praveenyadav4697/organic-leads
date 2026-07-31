"""Public performance signals — TTFB, redirect count, compression.

These facts come straight from the homepage HTTP response (no extra
network call) plus the HTML-vs-encrypted-context check for "compression".
The inspector is therefore a pure function over a ``FetchResult`` plus
the final URL.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.modules.website.discovery_schemas import PerformanceFacts, to_fields_dict
from app.modules.website.http_inspector import FetchResult


def from_fetch(result: FetchResult, final_url: Optional[str] = None) -> PerformanceFacts:
    """Build the performance facts from a single HTTP fetch."""
    if not result.ok and result.not_publicly_available:
        return PerformanceFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": result.error or "no response"},
        )

    headers = result.headers or {}
    content_encoding = headers.get("content-encoding") or headers.get("Content-Encoding")
    if content_encoding:
        content_encoding = content_encoding.lower().strip()
    if content_encoding not in ("gzip", "br", "deflate", "identity", "zstd"):
        content_encoding = None

    # The Content-Encoding header IS the public signal of compression; we
    # don't need to inspect the bytes themselves.
    compression_enabled = bool(content_encoding) and content_encoding in ("gzip", "br", "deflate", "zstd")

    # HTTP/HTTPS version: httpx exposes it via ``response.http_version``
    # on the original response, but we only have the headers here. We
    # can infer HTTP/2+ from the presence of the ``:status`` pseudo-header
    # in some servers, but more reliably: if the URL was upgraded to HTTPS
    # via redirect, that IS a measured fact.  HTTP version is reported as
    # "unknown" because we don't have a reliable public signal.
    http_version = None

    fields = to_fields_dict(
        response_time_ms=result.response_time_ms,
        ttfb_ms=result.ttfb_ms,
        redirect_count=result.redirect_count,
        final_url=result.final_url or final_url,
        status_code=result.status_code,
        http_version=http_version,
        content_encoding=content_encoding,
        compression_enabled=compression_enabled,
        content_type=headers.get("content-type") or headers.get("Content-Type"),
    )

    return PerformanceFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=len(fields) == 0,
        fields=fields,
    )
