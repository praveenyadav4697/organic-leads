"""Website scanner — orchestrates the public discovery engine.

This scanner uses ONLY publicly accessible information (anonymous HTTP,
DNS, WHOIS/RDAP, Playwright). It does NOT require WordPress credentials,
authentication, or database access on the target site.

The legacy scanner that relied on the Organic Leads Connector plugin
and authenticated WordPress API calls has been replaced by the
public discovery engine in :mod:`app.modules.website.discovery_service`.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from app.modules.website.discovery_service import WebsiteDiscoveryService
from app.modules.website.http_inspector import HTTPInspector
from app.modules.website.models import WebsiteScanHistory


class WebsiteScanner:
    """Public-only website scanner.

    Replaces the legacy credential-based scanner with a fully anonymous
    discovery engine that probes websites using only public HTTP requests,
    DNS lookups, WHOIS/RDAP queries, and Playwright screenshots.
    """

    def __init__(self) -> None:
        self._discovery = WebsiteDiscoveryService()

    async def scan_website(
        self,
        website: Any,
        scan_id: uuid.UUID,
        credentials: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Any]:
        """Run a full public discovery scan against the website.

        ``credentials`` are accepted for API compatibility but are
        **ignored** — the discovery engine never uses them.
        """
        http = HTTPInspector()
        try:
            result = await self._discovery.run(website.url, http=http)
        finally:
            await http.aclose()

        return self._to_scan_result(website, scan_id, result)

    @staticmethod
    def _to_scan_result(
        website: Any,
        scan_id: uuid.UUID,
        discovery: Any,
    ) -> Dict[str, Any]:
        """Convert a DiscoveryResult into the scan result dict that
        the service layer persists to the database."""
        wp = discovery.wordpress
        wp_fields = wp.fields if wp and not wp.not_publicly_available else {}

        ssl = discovery.ssl
        ssl_fields = ssl.fields if ssl and not ssl.not_publicly_available else {}

        dns = discovery.dns
        dns_fields = dns.fields if dns and not dns.not_publicly_available else {}

        whois = discovery.whois
        whois_fields = whois.fields if whois and not whois.not_publicly_available else {}

        seo = discovery.seo
        seo_fields = seo.fields if seo and not seo.not_publicly_available else {}

        perf = discovery.performance
        perf_fields = perf.fields if perf and not perf.not_publicly_available else {}

        sec = discovery.security
        sec_fields = sec.fields if sec and not sec.not_publicly_available else {}

        mob = discovery.mobile
        mob_fields = mob.fields if mob and not mob.not_publicly_available else {}

        robots = discovery.robots
        robots_fields = robots.fields if robots and not robots.not_publicly_available else {}

        sitemap = discovery.sitemap
        sitemap_fields = sitemap.fields if sitemap and not sitemap.not_publicly_available else {}

        si = discovery.site_info
        si_fields = si.fields if si and not si.not_publicly_available else {}

        return {
            "scan_id": str(scan_id),
            "website_id": str(website.id),
            "scanned_at": datetime.utcnow().isoformat(),
            "url": discovery.url,
            "final_url": discovery.final_url,
            "protocol": discovery.protocol,
            "domain": discovery.domain,
            "status_code": discovery.status_code,
            "redirect_count": discovery.redirect_count,
            "cms": discovery.cms,
            "version": discovery.version,
            "ip": discovery.ip,
            "registrar": discovery.registrar,
            "health_score": discovery.health_score,
            "performance_score": discovery.performance_score,
            "seo_score": discovery.seo_score,
            "responsive_score": discovery.responsive_score,
            "security_score": discovery.security_score,
            "errors": discovery.errors,
            "site_info": {
                "title": si_fields.get("title"),
                "meta_description": si_fields.get("meta_description"),
                "charset": si_fields.get("charset"),
                "language": si_fields.get("language"),
                "generator": si_fields.get("generator"),
                "favicon": si_fields.get("favicon"),
            },
            "wordpress": {
                "is_wordpress": wp_fields.get("is_wordpress", False),
                "version": wp_fields.get("version"),
                "rest_api_enabled": wp_fields.get("rest_api_enabled", False),
                "xmlrpc_enabled": wp_fields.get("xmlrpc_enabled", False),
                "generator_tag": wp_fields.get("generator_tag"),
                "wp_content_detected": wp_fields.get("wp_content_detected", False),
                "wp_includes_detected": wp_fields.get("wp_includes_detected", False),
            },
            "ssl": {
                "https_enabled": ssl_fields.get("https_enabled", False),
                "valid": not ssl_fields.get("is_expired", False),
                "issuer": ssl_fields.get("issuer"),
                "subject": ssl_fields.get("subject"),
                "expires_at": ssl_fields.get("not_after"),
                "tls_version": ssl_fields.get("tls_version"),
                "days_until_expiry": ssl_fields.get("days_until_expiry"),
                "hsts_enabled": ssl_fields.get("hsts_enabled", False),
                "mixed_content_count": ssl_fields.get("mixed_content_count", 0),
                "security_rating": ssl_fields.get("security_rating", "F"),
                "is_expired": ssl_fields.get("is_expired", False),
                "is_self_signed": ssl_fields.get("is_self_signed", False),
                "certificate_chain": ssl_fields.get("certificate_chain"),
                "error_message": ssl_fields.get("error"),
            },
            "dns": {
                "a_records": dns_fields.get("a_records"),
                "aaaa_records": dns_fields.get("aaaa_records"),
                "mx_records": dns_fields.get("mx_records"),
                "txt_records": dns_fields.get("txt_records"),
                "nameservers": dns_fields.get("nameservers"),
                "spf_record": dns_fields.get("spf_record"),
                "dmarc_record": dns_fields.get("dmarc_record"),
                "dnssec_enabled": dns_fields.get("dnssec_enabled", False),
                "propagation_status": dns_fields.get("propagation_status"),
            },
            "whois": {
                "registrar": whois_fields.get("registrar"),
                "registration_date": whois_fields.get("registration_date"),
                "expiry_date": whois_fields.get("expiry_date"),
                "updated_date": whois_fields.get("updated_date"),
                "name_servers": whois_fields.get("name_servers"),
            },
            "seo": {
                "title": seo_fields.get("title"),
                "meta_description": seo_fields.get("meta_description"),
                "canonical_url": seo_fields.get("canonical_url"),
                "robots_meta": seo_fields.get("robots_meta"),
                "og_title": seo_fields.get("og_title"),
                "og_description": seo_fields.get("og_description"),
                "og_image": seo_fields.get("og_image"),
                "og_type": seo_fields.get("og_type"),
                "twitter_card": seo_fields.get("twitter_card"),
                "twitter_title": seo_fields.get("twitter_title"),
                "twitter_description": seo_fields.get("twitter_description"),
                "twitter_image": seo_fields.get("twitter_image"),
                "json_ld_blocks": seo_fields.get("json_ld_blocks"),
                "has_schema_org": seo_fields.get("has_schema_org", False),
                "h1_count": seo_fields.get("h1_count", 0),
                "h2_count": seo_fields.get("h2_count", 0),
                "images_total": seo_fields.get("images_total", 0),
                "images_missing_alt": seo_fields.get("images_missing_alt", 0),
            },
            "security": {
                "https_enabled": sec_fields.get("https_enabled", False),
                "mixed_content_count": sec_fields.get("mixed_content_count", 0),
                "directory_listing_enabled": sec_fields.get("directory_listing_enabled", False),
                "hsts_enabled": sec_fields.get("hsts_enabled", False),
                "hsts_max_age": sec_fields.get("hsts_max_age"),
                "content_security_policy": sec_fields.get("content_security_policy"),
                "x_frame_options": sec_fields.get("x_frame_options"),
                "x_content_type_options": sec_fields.get("x_content_type_options"),
                "referrer_policy": sec_fields.get("referrer_policy"),
                "permissions_policy": sec_fields.get("permissions_policy"),
                "xss_protection": sec_fields.get("xss_protection", False),
                "cookies_total": sec_fields.get("cookies_total", 0),
                "cookies_secure": sec_fields.get("cookies_secure", 0),
                "cookies_httponly": sec_fields.get("cookies_httponly", 0),
                "cookies_samesite": sec_fields.get("cookies_samesite", 0),
                "security_header_coverage_pct": sec_fields.get("security_header_coverage_pct", 0),
                "security_score": sec_fields.get("security_score", 0),
            },
            "performance": {
                "response_time_ms": perf_fields.get("response_time_ms"),
                "ttfb_ms": perf_fields.get("ttfb_ms") or perf_fields.get("ttfb_ms"),
                "dns_ms": perf_fields.get("dns_ms"),
                "tcp_ms": perf_fields.get("tcp_ms"),
                "tls_ms": perf_fields.get("tls_ms"),
                "request_ms": perf_fields.get("request_ms"),
                "response_ms": perf_fields.get("response_ms"),
                "dom_processing_ms": perf_fields.get("dom_processing_ms"),
                "load_event_ms": perf_fields.get("load_event_ms"),
                "redirect_count": perf_fields.get("redirect_count", 0),
                "http_version": perf_fields.get("http_version"),
                "content_encoding": perf_fields.get("content_encoding"),
                "compression_enabled": perf_fields.get("compression_enabled", False),
                "final_url": perf_fields.get("final_url"),
                "status_code": perf_fields.get("status_code"),
                "lcp_ms": perf_fields.get("lcp"),
                "cls": perf_fields.get("cls"),
                "inp_ms": perf_fields.get("inp"),
                "fid_ms": perf_fields.get("fid"),
                "fcp_ms": perf_fields.get("fcp"),
                "speed_index_ms": perf_fields.get("speed_index"),
                "page_size_bytes": perf_fields.get("page_size"),
                "page_encoded_bytes": perf_fields.get("page_encoded_bytes"),
                "page_decoded_bytes": perf_fields.get("page_decoded_bytes"),
                "requests": perf_fields.get("requests"),
                "dom_size": perf_fields.get("dom_size"),
                "js_bytes": perf_fields.get("js_bytes"),
                "css_bytes": perf_fields.get("css_bytes"),
                "image_bytes": perf_fields.get("image_bytes"),
                "font_bytes": perf_fields.get("font_bytes"),
                "video_bytes": perf_fields.get("video_bytes"),
                "xhr_fetch_bytes": perf_fields.get("xhr_fetch_bytes"),
                "other_bytes": perf_fields.get("other_bytes"),
                "third_party_bytes": perf_fields.get("third_party_bytes"),
                "third_party_requests": perf_fields.get("third_party_requests"),
                "js_requests": perf_fields.get("js_requests"),
                "css_requests": perf_fields.get("css_requests"),
                "image_requests": perf_fields.get("image_requests"),
                "font_requests": perf_fields.get("font_requests"),
                "video_requests": perf_fields.get("video_requests"),
                "xhr_fetch_requests": perf_fields.get("xhr_fetch_requests"),
                "other_requests": perf_fields.get("other_requests"),
                "largest_resource": perf_fields.get("largest_resource"),
            },
            "mobile": {
                "viewport_meta": mob_fields.get("viewport_meta"),
                "has_responsive_tag": mob_fields.get("has_responsive_tag", False),
            },
            "robots": {
                "exists": robots_fields.get("exists", False),
                "status_code": robots_fields.get("status_code"),
                "body": robots_fields.get("body"),
            },
            "sitemap": {
                "exists": sitemap_fields.get("exists", False),
                "status_code": sitemap_fields.get("status_code"),
                "url_count": sitemap_fields.get("url_count", 0),
                "sitemap_kind": sitemap_fields.get("sitemap_kind"),
            },
        }
