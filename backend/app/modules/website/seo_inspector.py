"""Parse the homepage HTML for SEO signals.

All facts here are public, no JS execution required:

  * ``<title>`` (already captured by site_info, but we re-report for completeness)
  * meta description
  * canonical link
  * robots meta
  * Open Graph tags (og:title, og:description, og:image, og:type)
  * Twitter Card tags (twitter:card, twitter:title, twitter:description, twitter:image)
  * JSON-LD blocks (parsed to a list of decoded objects)
  * H1 count, H2 count
  * image alt coverage (total images, missing alt count)
"""
from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup

from app.modules.website.discovery_schemas import SEOFacts, to_fields_dict


def parse(html: str, final_url: Optional[str] = None) -> SEOFacts:
    if not html:
        return SEOFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": "no HTML to parse"},
        )

    soup = BeautifulSoup(html, "lxml")

    title = _get_title(soup)
    description = _get_meta(soup, "description")
    canonical = _get_canonical(soup, final_url)
    robots_meta = _get_robots_meta(soup)

    og = _get_og(soup)
    twitter = _get_twitter(soup)
    json_ld = _get_json_ld(soup)
    h1_count = len(soup.find_all("h1"))
    h2_count = len(soup.find_all("h2"))
    images = _count_images(soup)

    fields = to_fields_dict(
        title=title,
        meta_description=description,
        canonical_url=canonical,
        robots_meta=robots_meta,
        h1_count=h1_count,
        h2_count=h2_count,
        images_total=images["total"],
        images_missing_alt=images["missing_alt"],
        og_title=og.get("title"),
        og_description=og.get("description"),
        og_image=og.get("image"),
        og_type=og.get("type"),
        twitter_card=twitter.get("card"),
        twitter_title=twitter.get("title"),
        twitter_description=twitter.get("description"),
        twitter_image=twitter.get("image"),
        json_ld_blocks=json_ld if json_ld else None,
        has_schema_org=bool(json_ld),
    )

    return SEOFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=len(fields) == 0,
        fields=fields,
    )


# ---------------------------------------------------------------------------
# Field extractors
# ---------------------------------------------------------------------------


def _get_title(soup: BeautifulSoup) -> Optional[str]:
    if soup.title and soup.title.string:
        return soup.title.string.strip()
    return None


def _get_meta(soup: BeautifulSoup, name: str) -> Optional[str]:
    tag = soup.find("meta", attrs={"name": name})
    if tag and tag.get("content"):
        return tag["content"].strip()
    return None


def _get_canonical(soup: BeautifulSoup, base_url: Optional[str]) -> Optional[str]:
    tag = soup.find("link", attrs={"rel": "canonical"})
    if not tag:
        return None
    href = tag.get("href")
    if not href:
        return None
    href = href.strip()
    if base_url and not href.startswith(("http://", "https://")):
        from urllib.parse import urljoin
        return urljoin(base_url, href)
    return href


def _get_robots_meta(soup: BeautifulSoup) -> Optional[str]:
    tag = soup.find("meta", attrs={"name": "robots"})
    if tag and tag.get("content"):
        return tag["content"].strip()
    return None


def _get_og(soup: BeautifulSoup) -> Dict[str, Optional[str]]:
    out: Dict[str, Optional[str]] = {k: None for k in ("title", "description", "image", "type")}
    for key in out:
        tag = soup.find("meta", attrs={"property": f"og:{key}"})
        if tag and tag.get("content"):
            out[key] = tag["content"].strip()
    return out


def _get_twitter(soup: BeautifulSoup) -> Dict[str, Optional[str]]:
    out: Dict[str, Optional[str]] = {k: None for k in ("card", "title", "description", "image")}
    for key in out:
        tag = soup.find("meta", attrs={"name": f"twitter:{key}"})
        if tag and tag.get("content"):
            out[key] = tag["content"].strip()
    return out


def _get_json_ld(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Decode every <script type="application/ld+json"> block.

    Returns an empty list if there are none, or if any block is malformed
    (we swallow the exception per block so one bad publisher doesn't break
    the whole scan).
    """
    blocks: List[Dict[str, Any]] = []
    for tag in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw = tag.string or tag.get_text() or ""
        raw = raw.strip()
        if not raw:
            continue
        try:
            data = json.loads(raw)
        except Exception:  # noqa: BLE001
            continue
        if isinstance(data, dict):
            blocks.append(data)
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    blocks.append(item)
    return blocks


def _count_images(soup: BeautifulSoup) -> Dict[str, int]:
    """Total images vs. images without alt attribute."""
    imgs = soup.find_all("img")
    total = len(imgs)
    missing_alt = sum(1 for img in imgs if not (img.get("alt") or "").strip())
    return {"total": total, "missing_alt": missing_alt}
