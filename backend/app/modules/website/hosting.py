from typing import Dict, Any, Optional
import httpx
from datetime import datetime
import socket
import re
from urllib.parse import urlparse

from app.modules.website.discovery_schemas import SecurityFacts, to_fields_dict


# ---------------------------------------------------------------------------
# Public-only security signals extracted from an HTML response + headers.
# ---------------------------------------------------------------------------

# Mixed content: HTTPS pages that reference HTTP assets. The browser
# blocks these; we surface the count so the dashboard can show it.
_MIXED_CONTENT_RE = re.compile(
    r"""(?:src|href|action)\s*=\s*["'](http://[^"']+)["']""",
    re.IGNORECASE,
)

# Apache "Index of /" — directory listing enabled.
_DIR_LISTING_RE = re.compile(r"<title>\s*Index of /", re.IGNORECASE)


def parse_security(
    html: Optional[str],
    final_url: Optional[str],
    headers: Optional[Dict[str, str]],
) -> SecurityFacts:
    """Public-only security signals. Builds on the headers already inspected
    by :func:`detect_security` and adds mixed-content / dir-listing / cookie
    flags from the HTML body.

    Returns a :class:`SecurityFacts` envelope so the frontend can render
    "Not Publicly Available" when the inspector has nothing to report.
    """
    headers = dict(headers or {})
    is_https = (final_url or "").startswith("https://")

    # --- Mixed content ---
    mixed_content_count = 0
    if html and is_https:
        mixed_content_count = len(_MIXED_CONTENT_RE.findall(html))

    # --- Directory listing ---
    directory_listing = bool(html and _DIR_LISTING_RE.search(html))

    # --- Security headers (already exposed by the legacy inspect) ---
    hsts_header = headers.get("strict-transport-security") or headers.get("Strict-Transport-Security")
    hsts_enabled = bool(hsts_header)
    hsts_max_age = None
    if hsts_header:
        m = re.search(r"max-age\s*=\s*(\d+)", hsts_header, re.IGNORECASE)
        if m:
            try:
                hsts_max_age = int(m.group(1))
            except ValueError:
                hsts_max_age = None

    csp = headers.get("content-security-policy") or headers.get("Content-Security-Policy")
    xfo = headers.get("x-frame-options") or headers.get("X-Frame-Options")
    xcto = headers.get("x-content-type-options") or headers.get("X-Content-Type-Options")
    referrer = headers.get("referrer-policy") or headers.get("Referrer-Policy")
    permissions = headers.get("permissions-policy") or headers.get("Permissions-Policy")
    xss_protection = bool(
        headers.get("x-xss-protection") or headers.get("X-XSS-Protection")
    )

    # --- Cookie flags ---
    cookie_headers = [
        v for k, v in headers.items()
        if k.lower() == "set-cookie"
    ]
    cookies_total = len(cookie_headers)
    cookies_secure = 0
    cookies_httponly = 0
    cookies_samesite = 0
    for raw in cookie_headers:
        low = raw.lower()
        if "secure" in low:
            cookies_secure += 1
        if "httponly" in low:
            cookies_httponly += 1
        if "samesite" in low:
            cookies_samesite += 1

    # --- Security header coverage % (just the ones we care about) ---
    coverage_count = sum(bool(v) for v in (csp, xfo, xcto, referrer, permissions, hsts_header))
    coverage_total = 6
    coverage_pct = round(coverage_count / coverage_total * 100, 1)

    # --- Naive score: starts at 100, deductions ---
    score = 100.0
    if not is_https:
        score -= 30
    if not hsts_enabled:
        score -= 10
    if not csp:
        score -= 10
    if not xfo:
        score -= 5
    if not xcto:
        score -= 5
    if mixed_content_count > 0:
        score -= min(20, mixed_content_count * 2)
    if directory_listing:
        score -= 10
    score = max(0.0, min(100.0, score))

    fields = to_fields_dict(
        https_enabled=is_https,
        mixed_content_count=mixed_content_count,
        directory_listing_enabled=directory_listing,
        hsts_enabled=hsts_enabled,
        hsts_max_age=hsts_max_age,
        content_security_policy=csp,
        x_frame_options=xfo,
        x_content_type_options=xcto,
        referrer_policy=referrer,
        permissions_policy=permissions,
        xss_protection=xss_protection,
        cookies_total=cookies_total,
        cookies_secure=cookies_secure,
        cookies_httponly=cookies_httponly,
        cookies_samesite=cookies_samesite,
        security_header_coverage_pct=coverage_pct,
        security_score=round(score, 1),
    )

    return SecurityFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=len(fields) == 0,
        fields=fields,
    )


class HostingDetector:
    async def detect(self, url: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(url)
                headers = dict(resp.headers)

                server = headers.get("server", "unknown")
                x_powered_by = headers.get("x-powered-by", "unknown")

                hosting_provider = self._detect_provider(server, headers)

                return {
                    "hosting_provider": hosting_provider,
                    "cloud_provider": None,
                    "server_software": f"{server} {x_powered_by}".strip(),
                    "operating_system": None,
                    "php_version": None,
                    "database_version": None,
                    "memory_limit": None,
                    "upload_limit": None,
                    "execution_time": None,
                    "cpu": None,
                    "disk_usage": None,
                    "storage": None,
                    "region": None,
                    "timezone": None,
                    "server_health": "healthy",
                    "response_headers": headers,
                    "checked_at": datetime.utcnow(),
                }
        except Exception as e:
            return {
                "hosting_provider": "unknown",
                "cloud_provider": None,
                "server_software": "unknown",
                "operating_system": None,
                "php_version": None,
                "database_version": None,
                "memory_limit": None,
                "upload_limit": None,
                "execution_time": None,
                "cpu": None,
                "disk_usage": None,
                "storage": None,
                "region": None,
                "timezone": None,
                "server_health": "unknown",
                "response_headers": {},
                "checked_at": datetime.utcnow(),
            }

    def _detect_provider(self, server: str, headers: Dict[str, str]) -> Optional[str]:
        server_lower = server.lower()
        if "cloudflare" in server_lower:
            return "Cloudflare"
        if "nginx" in server_lower:
            return "Nginx"
        if "apache" in server_lower:
            return "Apache"
        if "iis" in server_lower:
            return "IIS"
        return server if server != "unknown" else None

    async def detect_dns(self, domain: str) -> Dict[str, Any]:
        try:
            ip = socket.gethostbyname(domain)
            return {
                "nameservers": [],
                "a_records": [ip],
                "aaaa_records": [],
                "mx_records": [],
                "txt_records": [],
                "spf_record": None,
                "dmarc_record": None,
                "dnssec_enabled": False,
                "propagation_status": "resolved",
                "checked_at": datetime.utcnow(),
            }
        except Exception as e:
            return {
                "nameservers": [],
                "a_records": [],
                "aaaa_records": [],
                "mx_records": [],
                "txt_records": [],
                "spf_record": None,
                "dmarc_record": None,
                "dnssec_enabled": False,
                "propagation_status": f"failed: {str(e)}",
                "checked_at": datetime.utcnow(),
            }

    async def detect_security(self, url: str) -> Dict[str, Any]:
        """Public security signals.

        Returns the existing WebsiteSecurity shape for back-compat, plus a
        set of public-discovery-only fields stored under the JSONB
        ``security_headers`` column so the frontend can read them via the
        existing ``GET /security`` endpoint without a DB migration.
        """
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                resp = await client.get(url)
                headers = dict(resp.headers)
                html = resp.text
                final_url = str(resp.url)

            facts = parse_security(html, final_url, headers)

            x_headers = {
                k: v for k, v in headers.items() if k.lower().startswith("x-") or "security" in k.lower()
            }
            # Merge the new public-discovery fields into the JSONB blob so
            # any existing consumer of ``security_headers`` sees them too.
            x_headers.update({k: v for k, v in facts.fields.items() if v is not None})

            return {
                "security_headers": x_headers,
                "xss_protection": "x-xss-protection" in headers,
                "content_security_policy": headers.get("content-security-policy"),
                "hsts_enabled": "strict-transport-security" in headers,
                "hsts_max_age": facts.fields.get("hsts_max_age"),
                "x_frame_options": headers.get("x-frame-options"),
                "x_content_type_options": headers.get("x-content-type-options"),
                "referrer_policy": headers.get("referrer-policy"),
                "permissions_policy": headers.get("permissions-policy"),
                "vulnerability_count": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "security_score": facts.fields.get("security_score", 100.0),
                "last_scanned_at": datetime.utcnow(),
            }
        except Exception as e:
            return {
                "security_headers": {"error": str(e)},
                "xss_protection": False,
                "content_security_policy": None,
                "hsts_enabled": False,
                "hsts_max_age": None,
                "x_frame_options": None,
                "x_content_type_options": None,
                "referrer_policy": None,
                "permissions_policy": None,
                "vulnerability_count": 0,
                "critical_count": 0,
                "high_count": 0,
                "medium_count": 0,
                "low_count": 0,
                "security_score": 0.0,
                "last_scanned_at": datetime.utcnow(),
            }


async def detect_security(url: str) -> Dict[str, Any]:
    """Public security signals from an HTTP fetch.

    Returns the same shape as ``HostingDetector.detect_security`` but
    as a standalone async function for use by the discovery engine.
    """
    try:
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            resp = await client.get(url)
            headers = dict(resp.headers)
            html = resp.text
            final_url = str(resp.url)

        facts = parse_security(html, final_url, headers)

        x_headers = {
            k: v for k, v in headers.items() if k.lower().startswith("x-") or "security" in k.lower()
        }
        x_headers.update({k: v for k, v in facts.fields.items() if v is not None})

        return {
            "security_headers": x_headers,
            "xss_protection": "x-xss-protection" in headers,
            "content_security_policy": headers.get("content-security-policy"),
            "hsts_enabled": "strict-transport-security" in headers,
            "hsts_max_age": facts.fields.get("hsts_max_age"),
            "x_frame_options": headers.get("x-frame-options"),
            "x_content_type_options": headers.get("x-content-type-options"),
            "referrer_policy": headers.get("referrer-policy"),
            "permissions_policy": headers.get("permissions-policy"),
            "vulnerability_count": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "security_score": facts.fields.get("security_score", 100.0),
            "last_scanned_at": datetime.utcnow(),
        }
    except Exception as e:
        return {
            "security_headers": {"error": str(e)},
            "xss_protection": False,
            "content_security_policy": None,
            "hsts_enabled": False,
            "hsts_max_age": None,
            "x_frame_options": None,
            "x_content_type_options": None,
            "referrer_policy": None,
            "permissions_policy": None,
            "vulnerability_count": 0,
            "critical_count": 0,
            "high_count": 0,
            "medium_count": 0,
            "low_count": 0,
            "security_score": 0.0,
            "last_scanned_at": datetime.utcnow(),
        }
