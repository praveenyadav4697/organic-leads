"""Public-only WordPress detection — no credentials, no plugin, no auth.

The previous version of this module tried to authenticate against the
Organic Leads Connector plugin at ``/wp-json/organic-leads/v1/*`` using
an application password. That's a separate phase (the connector plugin
itself). For the public-discovery engine we cannot, and must not, ask
the user for credentials — WordPress detection has to work from
anonymous HTTP only.

These are the only signals we can use:

  * ``<meta name="generator" content="WordPress X.Y">``            (version)
  * ``<link rel="https://api.w.org/" ...>``                          (REST API hint)
  * Presence of ``/wp-content/`` or ``/wp-includes/`` in the HTML
  * Probe of ``/wp-json/`` (a 200 means the REST API is enabled)
  * Probe of ``/xmlrpc.php`` (a 200 / 405 means it is enabled)

Everything else (plugin list, theme list, memory limit, cron, DB version,
PHP version, debug mode, automatic updates) is site-private and comes
later when the connector plugin is available.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, Optional

from bs4 import BeautifulSoup

from app.modules.website.discovery_schemas import WordPressPublicFacts, to_fields_dict
from app.modules.website.http_inspector import HTTPInspector, FetchResult


_VERSION_RE = re.compile(r"WordPress\s*([0-9.]+)", re.IGNORECASE)


async def detect(
    html: str,
    final_url: Optional[str],
    http: HTTPInspector,
) -> WordPressPublicFacts:
    """Public-only WP detection. Combines HTML signals with a couple of
    unauthenticated probes (``/wp-json/`` and ``/xmlrpc.php``)."""
    if not html:
        return WordPressPublicFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": "no HTML to parse"},
        )

    soup = BeautifulSoup(html, "lxml")

    # --- Signal 1: generator meta tag ---
    meta = soup.find("meta", attrs={"name": "generator"})
    generator_tag = (meta.get("content") or "").strip() if meta else None
    is_wp_from_generator = bool(generator_tag and "wordpress" in generator_tag.lower())

    # --- Signal 2: presence of /wp-content/ or /wp-includes/ in the HTML ---
    html_lower = html.lower()
    has_wp_content = "/wp-content/" in html_lower
    has_wp_includes = "/wp-includes/" in html_lower
    has_wp_paths = has_wp_content or has_wp_includes

    # --- Signal 3: REST API hint from <link rel="https://api.w.org/" ...> ---
    api_link = soup.find("link", attrs={"rel": "https://api.w.org/"})
    rel_api_w_org = api_link is not None

    # --- Signal 4: version extraction from generator tag ---
    version: Optional[str] = None
    if generator_tag:
        m = _VERSION_RE.search(generator_tag)
        if m:
            version = m.group(1)

    # --- Signal 5: probe /wp-json/ (HEAD) ---
    rest_api_enabled = False
    if final_url:
        from urllib.parse import urlparse
        parsed = urlparse(final_url)
        wp_json_url = f"{parsed.scheme}://{parsed.netloc}/wp-json/"
        wp_json_result = await http.fetch(wp_json_url, method="HEAD", transport="wp-json")
        rest_api_enabled = bool(wp_json_result.ok and wp_json_result.status_code == 200)

    # --- Signal 6: probe /xmlrpc.php (HEAD) ---
    xmlrpc_enabled = False
    if final_url:
        from urllib.parse import urlparse
        parsed = urlparse(final_url)
        xmlrpc_url = f"{parsed.scheme}://{parsed.netloc}/xmlrpc.php"
        xmlrpc_result = await http.fetch(xmlrpc_url, method="HEAD", transport="xmlrpc")
        # WP returns 405 (Method Not Allowed) for HEAD but the route exists;
        # some proxies return 200. Anything in the 2xx-4xx band counts as
        # "the file is there".
        xmlrpc_enabled = bool(xmlrpc_result.status_code in (200, 405))

    # --- Decide: is this site WordPress? ---
    is_wordpress = (
        is_wp_from_generator
        or has_wp_paths
        or rel_api_w_org
        or rest_api_enabled  # /wp-json/ returning 200 is conclusive
    )

    fields = to_fields_dict(
        is_wordpress=is_wordpress,
        cms="wordpress" if is_wordpress else None,
        version=version,
        generator_tag=generator_tag,
        rest_api_enabled=rest_api_enabled,
        xmlrpc_enabled=xmlrpc_enabled,
        wp_content_detected=has_wp_content,
        wp_includes_detected=has_wp_includes,
    )

    return WordPressPublicFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=not is_wordpress,
        fields=fields,
    )
