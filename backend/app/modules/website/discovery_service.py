"""Public Website Discovery Engine — orchestrator.

Calls each inspector in parallel (asyncio.gather). All inputs and outputs
are anonymous HTTP / DNS / WHOIS / RDAP / Playwright. No credentials,
no plugin, no database access on the target site.

A failed inspector does NOT abort the scan — it returns an envelope flagged
``not_publicly_available=True`` so the frontend can render the unavailable
state instead of an empty cell.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, Optional
from urllib.parse import urlparse

from app.modules.website.discovery_schemas import (
    DiscoveryResult,
    DNSFacts,
    MobileFacts,
    PerformanceFacts,
    RobotsFacts,
    SEOFacts,
    SecurityFacts,
    SitemapFacts,
    SiteInfoFacts,
    SSLFacts,
    WhoisFacts,
    WordPressPublicFacts,
    FactsBase,
    mark_unavailable,
)
from app.modules.website.http_inspector import HTTPInspector
from app.modules.website.site_info import parse as parse_site_info
from app.modules.website.wordpress import detect as detect_wordpress
from app.modules.website.seo_inspector import parse as parse_seo
from app.modules.website.mobile_inspector import parse as parse_mobile
from app.modules.website.robots_inspector import fetch as fetch_robots
from app.modules.website.sitemap_inspector import fetch as fetch_sitemap
from app.modules.website.performance_inspector import from_fetch as performance_from_fetch, from_playwright as performance_from_playwright
from app.modules.website.dns_scanner import scan as scan_dns
from app.modules.website.whois_scanner import lookup as lookup_whois
from app.modules.website.ssl import inspect as inspect_ssl
from app.modules.website.hosting import detect_security, parse_security


logger = logging.getLogger(__name__)


async def _safe(coro, default: FactsBase, label: str, errors: list) -> FactsBase:
    """Run an inspector coroutine and capture exceptions.

    ``label`` is the inspector name (e.g. ``"dns"``); failures are appended
    to ``errors`` so the orchestrator record can surface them.
    """
    try:
        return await coro
    except Exception as e:  # noqa: BLE001 — inspectors must NEVER abort the scan
        logger.warning("discovery inspector %s failed: %s", label, e)
        errors.append(f"{label}: {type(e).__name__}: {e}")
        return mark_unavailable(default, error=str(e))


class WebsiteDiscoveryService:
    """Run a full public discovery scan against ``url``.

    Public surface:
        await WebsiteDiscoveryService().run(url, http=http) -> DiscoveryResult

    The orchestrator creates a single ``HTTPInspector`` so that every
    artifact (homepage HTML, robots.txt, sitemap.xml, /wp-json/, /xmlrpc.php,
    RDAP) shares one TCP/TLS connection pool and identical defaults.
    """

    async def run(self, url: str, http: Optional[HTTPInspector] = None) -> DiscoveryResult:
        url = self._normalize(url)
        parsed = urlparse(url)
        domain = parsed.hostname or ""

        owns_http = http is None
        http = http or HTTPInspector()

        errors: list[str] = []
        result = DiscoveryResult(url=url, domain=domain, checked_at=datetime.utcnow())

        # Fetch the homepage once. Everything else branches off the result.
        homepage = await http.fetch(url, transport="homepage")

        if not homepage.ok and homepage.not_publicly_available:
            # Even the homepage is unreachable — return early with a
            # fully-empty result so the dashboard shows "Not Publicly Available".
            for label in ("site_info", "seo", "mobile", "wordpress", "performance"):
                setattr(result, label, mark_unavailable(getattr(result, label), error=homepage.error))
            errors.append(f"homepage: {homepage.error}")
            return result

        result.final_url = homepage.final_url
        result.protocol = (homepage.final_url or url).split("://", 1)[0]
        result.status_code = homepage.status_code
        result.redirect_count = homepage.redirect_count

        html = homepage.text or ""
        final_url = homepage.final_url

        # Parse site info, SEO, mobile, security, performance from the homepage
        # in parallel. Each one is isolated; a failure in one doesn't drag
        # the others down.
        (
            result.site_info,
            result.seo,
            result.mobile,
            result.security,
            result.performance,
            result.wordpress,
        ) = await asyncio.gather(
            _safe(parse_site_info(html, final_url), SiteInfoFacts(), "site_info", errors),
            _safe(parse_seo(html, final_url), SEOFacts(), "seo", errors),
            _safe(parse_mobile(html), MobileFacts(), "mobile", errors),
            _safe(self._security_async(html, final_url, homepage.headers), SecurityFacts(), "security", errors),
            _safe(self._performance_async(homepage, final_url), PerformanceFacts(), "performance", errors),
            _safe(detect_wordpress(html, final_url, http), WordPressPublicFacts(), "wordpress", errors),
        )

        # Browser-level performance metrics (Core Web Vitals, page weight) via
        # Playwright / CDP.  This is fire-and-forget: if Playwright is missing
        # or the page crashes, we keep the HTTP-level metrics above.
        _browser_perf_facts, browser_metrics = await _safe(
            performance_from_playwright(url),
            PerformanceFacts(),
            "performance_playwright",
            errors,
        )

        # Merge browser metrics into the HTTP performance facts so downstream
        # consumers (service layer / API) see a single unified payload.
        if browser_metrics and not _browser_perf_facts.not_publicly_available:
            result.performance.fields.update(_browser_perf_facts.fields)
            result.performance.checked_at = _browser_perf_facts.checked_at

        # Network-bound inspectors — DNS, WHOIS, robots, sitemap, SSL — all
        # touch the wire and run independently.
        (
            result.dns,
            result.whois,
            result.robots,
            result.sitemap,
            result.ssl,
        ) = await asyncio.gather(
            _safe(self._dns_async(domain), DNSFacts(), "dns", errors),
            _safe(self._whois_async(domain, http), WhoisFacts(), "whois", errors),
            _safe(fetch_robots(http, final_url or url), RobotsFacts(), "robots", errors),
            _safe(fetch_sitemap(http, final_url or url), SitemapFacts(), "sitemap", errors),
            _safe(self._ssl_async(final_url or url), SSLFacts(), "ssl", errors),
        )

        # Roll up summary fields the dashboard expects in a single response.
        result.cms = "wordpress" if (result.wordpress.fields.get("is_wordpress")) else None
        result.version = result.wordpress.fields.get("version")
        result.ip = (result.dns.fields.get("a_records") or [None])[0]
        result.registrar = result.whois.fields.get("registrar")
        result.security_score = int(round(result.security.fields.get("security_score", 0)))

        # SEO score: title/desc/canonical/og/json-ld weighted.
        result.seo_score = self._seo_score(result.seo)

        # Performance score: TTFB + compression + low redirect count.
        result.performance_score = self._perf_score(result.performance)

        # Responsive: simple viewport-meta check.
        result.responsive_score = 100 if result.mobile.fields.get("has_responsive_tag") else 60

        # Health: roll-up of available scores (None if we got nothing).
        scores = [s for s in (result.security_score, result.seo_score,
                              result.performance_score, result.responsive_score) if s is not None]
        result.health_score = int(round(sum(scores) / len(scores))) if scores else None

        if owns_http:
            await http.close()

        result.errors = errors
        return result

    # --- Inspector wrappers -------------------------------------------------

    async def _security_async(self, html: str, final_url: Optional[str], headers: Optional[Dict[str, str]]):
        return parse_security(html, final_url, headers or {})

    async def _performance_async(self, result, final_url: Optional[str]):
        return performance_from_fetch(result, final_url)

    async def _dns_async(self, domain: str) -> DNSFacts:
        # ``scan_dns`` is sync; run it on a thread to keep the loop free.
        return await asyncio.to_thread(scan_dns, domain)

    async def _whois_async(self, domain: str, http: HTTPInspector) -> WhoisFacts:
        return await lookup_whois(domain, http)

    async def _ssl_async(self, url: str) -> SSLFacts:
        return await inspect_ssl(url)

    # --- Helpers -----------------------------------------------------------

    @staticmethod
    def _normalize(url: str) -> str:
        if not url:
            return ""
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            return "https://" + url
        return url

    @staticmethod
    def _seo_score(facts: SEOFacts) -> int:
        if facts.not_publicly_available or not facts.fields:
            return 0
        score = 0
        f = facts.fields
        if f.get("title"):
            score += 20
        if f.get("meta_description"):
            score += 15
        if f.get("canonical_url"):
            score += 10
        if f.get("og_title"):
            score += 10
        if f.get("og_description"):
            score += 10
        if f.get("og_image"):
            score += 10
        if f.get("twitter_card"):
            score += 5
        if f.get("has_schema_org"):
            score += 10
        if f.get("images_missing_alt", 1) == 0:
            score += 10
        return min(100, score)

    @staticmethod
    def _perf_score(facts: PerformanceFacts) -> int:
        if facts.not_publicly_available or not facts.fields:
            return 0
        score = 100
        ttfb = facts.fields.get("ttfb_ms") or 0
        if ttfb > 800:
            score -= 30
        elif ttfb > 400:
            score -= 15
        elif ttfb > 200:
            score -= 5
        redirects = facts.fields.get("redirect_count") or 0
        if redirects > 3:
            score -= 20
        elif redirects > 1:
            score -= 5
        if not facts.fields.get("compression_enabled"):
            score -= 10
        return max(0, min(100, score))


# Re-exports for backwards compatibility with code that imported ``detect_security``
# from the hosting module (used by the legacy hosting detector).
__all__ = [
    "WebsiteDiscoveryService",
    "detect_security",
]
