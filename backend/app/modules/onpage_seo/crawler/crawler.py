"""Website crawler (F06).

Implements breadth-first and depth-first traversal with:

  * a bounded work queue (``deque``) + visited set (queue management);
  * recursion control via explicit ``max_depth`` per URL (never recursive
    Python calls, so no stack growth);
  * crawl limits via ``max_pages``;
  * optional robots.txt compliance (``robots.txt`` + per-URL checks);
  * optional sitemap seeding;
  * bounded concurrency with ``asyncio.Semaphore``.

Each visited page is parsed by :class:`HTMLParserService` and reshaped by
:class:`ExtractorService`; the caller receives a :class:`CrawlResult`
containing every page's structured data for persistence.
"""
from __future__ import annotations

import asyncio
import logging
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.modules.onpage_seo.crawler.extractor import ExtractorService
from app.modules.onpage_seo.crawler.parser import PageParseResult
from app.modules.onpage_seo.crawler.robots import RobotsService, RobotsTxt
from app.modules.onpage_seo.crawler.sitemap import SitemapService

logger = logging.getLogger("app.modules.onpage_seo.crawler")


@dataclass
class CrawlOptions:
    start_url: str
    strategy: str = "bfs"
    max_depth: int = 3
    max_pages: int = 500
    max_concurrency: int = 8
    respect_robots_txt: bool = True
    use_sitemap: bool = False
    allowed_domains: Optional[List[str]] = None
    timeout: float = 15.0
    user_agent: str = settings.ONPAGE_CRAWLER_USER_AGENT

    def normalize(self) -> "CrawlOptions":
        """Validate and normalise options (strategy, limits)."""
        if self.strategy not in ("bfs", "dfs"):
            raise ValueError(f"strategy must be 'bfs' or 'dfs', got {self.strategy!r}")
        if self.max_depth < 0:
            raise ValueError("max_depth must be >= 0")
        if self.max_pages < 1:
            raise ValueError("max_pages must be >= 1")
        return self


@dataclass
class CrawlResult:
    start_url: str
    strategy: str
    urls_discovered: int = 0
    urls_crawled: int = 0
    urls_failed: int = 0
    status: str = "completed"
    error: Optional[str] = None
    pages: List[Dict[str, Any]] = field(default_factory=list)


class CrawlerService:
    """Async crawler engine."""

    def __init__(
        self,
        extractor: Optional[ExtractorService] = None,
        robots_service: Optional[RobotsService] = None,
        sitemap_service: Optional[SitemapService] = None,
    ) -> None:
        self._extractor = extractor or ExtractorService()
        self._robots = robots_service or RobotsService()
        self._sitemaps = sitemap_service or SitemapService()

    async def crawl(self, options: CrawlOptions) -> CrawlResult:
        options.normalize()
        result = CrawlResult(start_url=options.start_url, strategy=options.strategy)
        start_domain = urlparse(options.start_url).netloc
        allowed = set(options.allowed_domains or []) or {start_domain}

        headers = {
            "User-Agent": options.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

        timeout = httpx.Timeout(options.timeout)
        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            headers=headers,
            max_redirects=5,
        ) as client:
            robots: RobotsTxt = RobotsTxt()
            if options.respect_robots_txt:
                robots = await self._robots.fetch(client, self._site_origin(options.start_url))

            queue: deque[tuple[str, int]] = deque()
            visited: Set[str] = set()
            depth_by_url: Dict[str, int] = {}

            seeds = self._collect_seeds(client, options, allowed)
            for seed in seeds:
                if urlparse(seed).netloc in allowed:
                    queue.append((seed, 0))
                    depth_by_url[seed] = 0
                    result.urls_discovered += 1

            if options.strategy == "dfs":
                # DFS: newest first. Seeds are reversed so the first seed is
                # still processed first; deeper links are then LIFO.
                stack_items = list(queue)
                queue = deque(reversed(stack_items))

            semaphore = asyncio.Semaphore(options.max_concurrency)
            parsed_by_url: Dict[str, PageParseResult] = {}

            async def _process(url: str, depth: int) -> None:
                if url in visited:
                    return
                if result.urls_crawled + result.urls_failed >= options.max_pages:
                    return
                if options.respect_robots_txt and not robots.is_allowed(url, options.user_agent):
                    return

                async with semaphore:
                    if url in visited:
                        return
                    visited.add(url)
                    try:
                        parsed = await self._fetch_and_parse(client, url)
                    except Exception as exc:  # noqa: BLE001
                        result.urls_failed += 1
                        logger.warning("Crawl failed %s: %s", url, exc)
                        return

                    result.urls_crawled += 1
                    parsed_by_url[url] = parsed
                    result.pages.append({
                        "url": url,
                        "parsed": parsed.to_dict(),
                        "page_fields": self._extractor.build_page_payload(parsed, ""),
                    })

                    if depth < options.max_depth and result.urls_discovered < options.max_pages:
                        frontier = self._internal_links(parsed)
                        for link in frontier:
                            if urlparse(link).netloc not in allowed or link in visited:
                                continue
                            if link in depth_by_url:
                                continue
                            depth_by_url[link] = depth + 1
                            queue.append((link, depth + 1))
                            result.urls_discovered += 1
                            if result.urls_discovered >= options.max_pages:
                                return

            while queue and result.urls_crawled + result.urls_failed < options.max_pages:
                batch_size = min(len(queue), options.max_concurrency)
                batch = [queue.popleft() for _ in range(batch_size)]
                await asyncio.gather(*(_process(url, depth) for url, depth in batch))

        result.urls_discovered = max(result.urls_discovered, result.urls_crawled)
        logger.info(
            "Crawl %s finished: discovered=%d crawled=%d failed=%d",
            options.start_url, result.urls_discovered, result.urls_crawled, result.urls_failed,
        )
        return result

    # --- internal helpers -------------------------------------------------

    async def _collect_seeds(self, client: httpx.AsyncClient, options: CrawlOptions, allowed: Set[str]) -> List[str]:
        if not options.use_sitemap:
            return [options.start_url]
        sitemap_url = self._sitemaps.guess_sitemap_url(options.start_url)
        try:
            discovered = await self._sitemaps.discover(client, sitemap_url, max_urls=options.max_pages)
            seeds = [u for u in discovered if urlparse(u).netloc in allowed]
            return seeds[: options.max_pages] if seeds else [options.start_url]
        except Exception as exc:  # noqa: BLE001
            logger.warning("Sitemap discovery failed, using seed URL: %s", exc)
            return [options.start_url]

    @staticmethod
    def _site_origin(url: str) -> str:
        parsed = urlparse(url)
        return f"{parsed.scheme}://{parsed.netloc}"

    async def _fetch_and_parse(self, client: httpx.AsyncClient, url: str) -> PageParseResult:
        resp = await client.get(url)
        resp.raise_for_status()
        return self._extractor.extract(resp.text, str(resp.url))

    @staticmethod
    def _internal_links(parsed: PageParseResult) -> List[str]:
        """Deduped hrefs of internal links (used to grow the frontier)."""
        seen: Set[str] = set()
        links: List[str] = []
        for link in parsed.links:
            if link.is_external or not link.href:
                continue
            if link.href in seen:
                continue
            seen.add(link.href)
            links.append(link.href)
        return links
