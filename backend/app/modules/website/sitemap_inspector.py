"""Inspect /sitemap.xml and its WP-specific variants.

Tries the canonical paths in order until one succeeds:

  1. ``/sitemap.xml``                              (most common)
  2. ``/sitemap_index.xml``                        (Yoast SEO)
  3. ``/wp-sitemap.xml``                           (stock WordPress 5.5+)

For each successful hit, we count the number of ``<url>`` entries (or
``<sitemap>`` entries for an index). The body is *not* stored — sitemaps
can be tens of megabytes and we don't want to bloat the DB just for a
count.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from bs4 import BeautifulSoup

from app.modules.website.discovery_schemas import SitemapFacts
from app.modules.website.http_inspector import HTTPInspector, FetchResult


# Ordered list of (path, kind-label) candidates.
CANDIDATES: List[tuple] = [
    ("/sitemap.xml", "sitemap.xml"),
    ("/sitemap_index.xml", "sitemap_index.xml"),
    ("/wp-sitemap.xml", "wp-sitemap.xml"),
    ("/sitemap/sitemap.xml", "sitemap.xml"),
    ("/sitemap-index.xml", "sitemap_index.xml"),
]


async def fetch(http: HTTPInspector, base_url: str) -> SitemapFacts:
    """Try the candidate paths in order; the first 200 wins."""
    base = base_url.rstrip("/")
    last_error: Optional[str] = None

    for path, kind in CANDIDATES:
        url = base + path
        result = await http.fetch(url, transport="sitemap")

        if result.not_publicly_available:
            # Network-level failure — record it and stop trying (the same
            # outage will hit every other candidate).
            return SitemapFacts(
                checked_at=datetime.utcnow(),
                not_publicly_available=True,
                fields={"url": url, "error": result.error},
            )

        if result.status_code == 404:
            # Soft-fail: try the next candidate.
            last_error = "404"
            continue

        if result.ok and result.text is not None:
            url_count = _count_urls(result.text)
            return SitemapFacts(
                checked_at=datetime.utcnow(),
                not_publicly_available=False,
                fields={
                    "exists": True,
                    "status_code": result.status_code,
                    "url": url,
                    "sitemap_kind": kind,
                    "url_count": url_count,
                },
            )

        # 5xx or other — record and try the next.
        last_error = f"status {result.status_code}"
        continue

    # No candidate succeeded.
    return SitemapFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=False,
        fields={
            "exists": False,
            "url": base + "/sitemap.xml",
            "error": last_error or "no candidate returned 2xx",
        },
    )


def _count_urls(body: str) -> int:
    """Count ``<url>`` entries (or ``<sitemap>`` for an index)."""
    if not body:
        return 0
    # lxml is faster than html.parser for large XML.
    try:
        soup = BeautifulSoup(body, "lxml")
    except Exception:
        return 0
    return len(soup.find_all(["url", "sitemap"]))
