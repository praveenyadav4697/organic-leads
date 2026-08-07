"""Sitemap processing for the On-Page SEO crawler.

Handles:
  * ``sitemap.xml`` parsing (``<urlset>``) — page URLs + optional metadata;
  * sitemap *index* files (``<sitemapindex>``) — child sitemap URLs;
  * recursive discovery — a sitemap index is followed to its leaf sitemaps,
    bounded by a max depth and max discovered URLs.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("app.modules.onpage_seo.crawler.sitemap")


@dataclass
class SitemapParseResult:
    urls: List[str] = field(default_factory=list)
    child_sitemaps: List[str] = field(default_factory=list)
    is_index: bool = False
    error: Optional[str] = None


class SitemapService:
    """Stateless sitemap parser + async discovery."""

    MAX_SITEMAP_URLS = 50000
    MAX_DEPTH = 3

    @staticmethod
    def parse(xml: str, base_url: str = "") -> SitemapParseResult:
        """Parse a sitemap XML document (urlset or sitemapindex)."""
        result = SitemapParseResult()
        if not xml or not xml.strip():
            result.error = "empty sitemap body"
            return result

        soup = BeautifulSoup(xml, "lxml")

        # Sitemap index: <sitemap><loc>...</loc></sitemap>
        index_locs = soup.find_all("loc")
        first_loc = index_locs[0].get_text(strip=True) if index_locs else None
        # Heuristic: a <sitemap> wrapper means it is an index file.
        if soup.find("sitemap") is not None or (soup.find("urlset") is None and index_locs):
            result.is_index = True
            for loc in soup.find_all("loc"):
                text = loc.get_text(strip=True)
                if text:
                    result.child_sitemaps.append(urljoin(base_url, text))
            return result

        # URL set: <url><loc>...</loc></url>
        for url_tag in soup.find_all("url"):
            loc = url_tag.find("loc")
            if loc and loc.get_text(strip=True):
                result.urls.append(urljoin(base_url, loc.get_text(strip=True)))
            if len(result.urls) >= SitemapService.MAX_SITEMAP_URLS:
                break
        return result

    async def discover(
        self,
        client: httpx.AsyncClient,
        sitemap_url: str,
        max_depth: int = MAX_DEPTH,
        max_urls: int = 5000,
    ) -> List[str]:
        """Recursively discover page URLs from a sitemap (or sitemap index)."""
        discovered: List[str] = []
        visited_sitemaps: set[str] = set()

        async def _walk(url: str, depth: int) -> None:
            if depth > max_depth or url in visited_sitemaps or len(discovered) >= max_urls:
                return
            visited_sitemaps.add(url)
            try:
                resp = await client.get(url)
                if resp.status_code != 200:
                    logger.warning("Sitemap fetch %s -> %s", url, resp.status_code)
                    return
                parsed = self.parse(resp.text, url)
                if parsed.is_index:
                    for child in parsed.child_sitemaps:
                        await _walk(child, depth + 1)
                else:
                    for page_url in parsed.urls:
                        if len(discovered) >= max_urls:
                            return
                        discovered.append(page_url)
            except httpx.HTTPError as exc:
                logger.warning("Sitemap fetch error %s: %s", url, exc)
            except Exception as exc:  # noqa: BLE001
                logger.warning("Sitemap parse error %s: %s", url, exc)

        await _walk(sitemap_url, 0)
        return discovered

    @staticmethod
    def guess_sitemap_url(site_url: str) -> str:
        """Return the conventional robots/sitemap location for a site."""
        return urljoin(site_url.rstrip("/") + "/", "sitemap.xml")
