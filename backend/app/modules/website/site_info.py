"""Parse the homepage HTML to surface identity facts.

These are the things every browser tab shows: title, description, favicon,
language, generator.  All public, no auth, no JS execution required.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.modules.website.discovery_schemas import SiteInfoFacts, to_fields_dict


def parse(html: str, final_url: Optional[str] = None) -> SiteInfoFacts:
    """Extract identity facts from the homepage HTML.

    ``final_url`` is the URL after redirects — used to absolutize relative
    favicon and canonical URLs.
    """
    if not html:
        return SiteInfoFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": "no HTML to parse"},
        )

    soup = BeautifulSoup(html, "lxml")

    title = _extract_title(soup)
    description = _extract_meta(soup, "description")
    charset = _extract_charset(soup)
    language = _extract_language(soup)
    generator = _extract_generator(soup)
    favicon = _extract_favicon(soup, final_url)

    fields = to_fields_dict(
        title=title,
        meta_description=description,
        charset=charset,
        language=language,
        generator=generator,
        favicon=favicon,
    )

    return SiteInfoFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=len(fields) == 0,
        fields=fields,
    )


# ---------------------------------------------------------------------------
# Field extractors
# ---------------------------------------------------------------------------


def _extract_title(soup: BeautifulSoup) -> Optional[str]:
    if soup.title and soup.title.string:
        return soup.title.string.strip()
    # Open Graph title is the fallback some sites use.
    og = soup.find("meta", attrs={"property": "og:title"})
    if og and og.get("content"):
        return og["content"].strip()
    return None


def _extract_meta(soup: BeautifulSoup, name: str) -> Optional[str]:
    """Find a <meta name=...> or <meta property=...> with the given key."""
    tag = soup.find("meta", attrs={"name": name})
    if tag and tag.get("content"):
        return tag["content"].strip()
    # Some sites use og:description rather than name="description".
    tag = soup.find("meta", attrs={"property": f"og:{name}"})
    if tag and tag.get("content"):
        return tag["content"].strip()
    return None


def _extract_charset(soup: BeautifulSoup) -> Optional[str]:
    """Charset from <meta charset=...> or Content-Type header-style meta."""
    meta = soup.find("meta", attrs={"charset": True})
    if meta:
        return meta.get("charset")
    meta = soup.find("meta", attrs={"http-equiv": "Content-Type"})
    if meta and meta.get("content"):
        content = meta["content"].lower()
        if "charset=" in content:
            return content.split("charset=", 1)[1].strip()
    return None


def _extract_language(soup: BeautifulSoup) -> Optional[str]:
    html = soup.find("html")
    if html and html.get("lang"):
        return html["lang"].strip()
    # Fallback to <meta http-equiv="content-language">
    meta = soup.find("meta", attrs={"http-equiv": "content-language"})
    if meta and meta.get("content"):
        return meta["content"].strip()
    return None


def _extract_generator(soup: BeautifulSoup) -> Optional[str]:
    """Returns the ``generator`` meta tag content (e.g. "WordPress 6.6.2").

    This is the same signal the existing WordPress detector uses for
    version detection, but we report it here so non-WordPress sites
    (Drupal, Ghost, Jekyll, etc.) also get a meaningful generator.
    """
    meta = soup.find("meta", attrs={"name": "generator"})
    if meta and meta.get("content"):
        return meta["content"].strip()
    return None


def _extract_favicon(soup: BeautifulSoup, base_url: Optional[str]) -> Optional[str]:
    """Absolute URL of the favicon, if discoverable.

    Looks for:
      1. <link rel="icon" href="..."> (modern browsers)
      2. <link rel="shortcut icon" href="..."> (older)
      3. /favicon.ico on the same origin (the universal fallback)
    """
    for rel in ("icon", "shortcut icon", "apple-touch-icon", "apple-touch-icon-precomposed"):
        tag = soup.find("link", attrs={"rel": lambda r: r and rel in r.lower() if isinstance(r, str) else False})
        if tag and tag.get("href"):
            href = tag["href"].strip()
            if base_url:
                return urljoin(base_url, href)
            return href
    if base_url:
        return urljoin(base_url, "/favicon.ico")
    return None
