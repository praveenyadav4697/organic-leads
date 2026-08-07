"""Extraction orchestrator.

Wraps :class:`HTMLParserService` and reshapes a :class:`PageParseResult` into
the structured dictionaries the On-Page SEO repositories persist:

  * page-level fields (title, description, word count, counts)
  * meta tags (``SEMetaTag`` rows)
  * headings (``SEHeading`` rows)
  * images (``SEImage`` rows)
  * internal/external links (``SEInternalLink``/``SEExternalLink`` rows)
  * canonical (``SECanonical`` row)
  * robots (``SERobots`` row)
  * schema (``SESchema`` rows)
  * content analysis inputs (``SEContent`` row)
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List
from urllib.parse import urljoin, urlparse

from app.modules.onpage_seo.crawler.parser import HTMLParserService, PageParseResult

logger = logging.getLogger("app.modules.onpage_seo.crawler.extractor")


class ExtractorService:
    """Turns raw HTML into structured, repository-ready SEO data."""

    def __init__(self, parser: HTMLParserService | None = None) -> None:
        self._parser = parser or HTMLParserService()

    def extract(self, html: str, url: str) -> PageParseResult:
        return self._parser.parse(html, url)

    def build_page_payload(self, parsed: PageParseResult, website_id: str) -> Dict[str, Any]:
        """Fields that update the ``SEOPage`` row."""
        internal = [l for l in parsed.links if not l.is_external]
        external = [l for l in parsed.links if l.is_external]
        images_missing_alt = sum(1 for i in parsed.images if not i.has_alt)
        schema_types = [b.get("@type") for b in parsed.json_ld_blocks if isinstance(b.get("@type"), str)]

        return {
            "website_id": website_id,
            "url": parsed.url,
            "path": urlparse(parsed.url).path or "/",
            "meta_title": parsed.title,
            "meta_description": parsed.description,
            "h1_count": sum(1 for h in parsed.headings if h.level == 1),
            "h2_count": sum(1 for h in parsed.headings if h.level == 2),
            "h3_count": sum(1 for h in parsed.headings if h.level == 3),
            "image_count": len(parsed.images),
            "images_missing_alt": images_missing_alt,
            "internal_links_count": len(internal),
            "external_links_count": len(external),
            "broken_links_count": 0,  # resolved later by link checking
            "word_count": parsed.word_count,
            "has_canonical": bool(parsed.canonical_url),
            "has_schema": bool(parsed.json_ld_blocks),
        }

    def build_meta_tags(self, parsed: PageParseResult, page_id: str) -> List[Dict[str, Any]]:
        """Build ``SEMetaTag`` rows from the parse result."""
        tags: List[Dict[str, Any]] = []

        def _add(tag_type: str, tag_name: str, value: str | None, max_length: int) -> None:
            length = len(value) if value else 0
            tags.append({
                "page_id": page_id,
                "tag_type": tag_type,
                "tag_name": tag_name,
                "tag_value": value,
                "is_present": bool(value),
                "length": length,
                "max_length": max_length,
                "is_valid": bool(value) and length <= max_length,
                "is_duplicate": False,
            })

        _add("title", "title", parsed.title, 60)
        _add("description", "meta_description", parsed.description, 160)
        _add("og_title", "og:title", parsed.og_tags.get("og:title"), 95)
        _add("og_description", "og:description", parsed.og_tags.get("og:description"), 200)
        _add("twitter_title", "twitter:title", parsed.twitter_tags.get("twitter:title"), 70)
        return tags

    def build_headings(self, parsed: PageParseResult, page_id: str) -> List[Dict[str, Any]]:
        seen_texts: set[str] = set()
        rows: List[Dict[str, Any]] = []
        for h in parsed.headings:
            duplicate = h.text.lower() in seen_texts
            seen_texts.add(h.text.lower())
            rows.append({
                "page_id": page_id,
                "level": h.level,
                "text": h.text,
                "is_duplicate": duplicate,
                "is_missing": False,
                "position": h.position,
            })
        return rows

    def build_images(self, parsed: PageParseResult, page_id: str) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for img in parsed.images:
            rows.append({
                "page_id": page_id,
                "src": img.src,
                "alt_text": img.alt_text,
                "has_alt": img.has_alt,
                "uses_lazy_loading": img.uses_lazy_loading,
                "is_responsive": img.is_responsive,
                "width": img.width,
                "height": img.height,
            })
        return rows

    def build_links(self, parsed: PageParseResult, page_id: str) -> Dict[str, List[Dict[str, Any]]]:
        internal = []
        external = []
        for link in parsed.links:
            row = {
                "page_id": page_id,
                "target_url": link.href,
                "anchor_text": link.anchor_text,
                "is_broken": False,
                "is_nofollow": link.is_nofollow,
                "is_sponsored": link.is_sponsored,
                "is_ugc": link.is_ugc,
                "link_count": 1,
            }
            if link.is_external:
                external.append(row)
            else:
                internal.append(row)
        return {"internal": internal, "external": external}

    def build_canonical(self, parsed: PageParseResult, page_id: str, page_url: str) -> Dict[str, Any]:
        canonical = parsed.canonical_url
        return {
            "page_id": page_id,
            "canonical_url": canonical,
            "is_present": bool(canonical),
            "is_valid": bool(canonical) and canonical.rstrip("/") == page_url.rstrip("/"),
            "is_duplicate": False,
        }

    def build_robots(self, parsed: PageParseResult, page_id: str) -> Dict[str, Any]:
        return {
            "page_id": page_id,
            "robots_txt_present": False,  # set by the crawler after robots.txt check
            "robots_meta": parsed.robots_meta,
            "is_noindex": parsed.is_noindex,
            "is_nofollow": parsed.is_nofollow,
            "blocked_resources": None,
        }

    def build_schema(self, parsed: PageParseResult, page_id: str) -> List[Dict[str, Any]]:
        rows: List[Dict[str, Any]] = []
        for block in parsed.json_ld_blocks:
            schema_type = block.get("@type")
            if isinstance(schema_type, list):
                schema_type = schema_type[0]
            if not schema_type:
                continue
            rows.append({
                "page_id": page_id,
                "schema_type": str(schema_type),
                "is_present": True,
                "is_valid": True,
                "error_count": 0,
                "warning_count": 0,
                "errors": None,
                "warnings": None,
            })
        return rows

    def build_content(self, parsed: PageParseResult, page_id: str) -> Dict[str, Any]:
        paragraphs = parsed.text_content.count("\n") + 1 if parsed.text_content else 0
        avg_len = round(parsed.word_count / paragraphs, 1) if paragraphs else 0.0
        return {
            "page_id": page_id,
            "word_count": parsed.word_count,
            "paragraph_count": paragraphs,
            "avg_paragraph_length": avg_len,
            "readability_score": None,  # computed by the NLP engine
            "readability_grade": None,
            "has_duplicate_content": False,
            "has_thin_content": parsed.word_count > 0 and parsed.word_count < 300,
            "content_freshness_days": None,
            "grammar_issues": None,
            "ai_suggestions": None,
        }
