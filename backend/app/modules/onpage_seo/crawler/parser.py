"""HTML/DOM parser for the On-Page SEO crawler.

Uses BeautifulSoup with the ``lxml`` tree builder for fast, resilient DOM
parsing. Extracts every element the audit engine consumes:

  * ``<title>`` and ``<meta name="description">``
  * canonical ``<link rel="canonical">``
  * robots meta directives (``noindex`` / ``nofollow`` / ``none``)
  * JSON-LD / Microdata / RDFa structured data
  * Open Graph and Twitter Card tags
  * headings (H1–H6)
  * images (with alt/lazy-load/responsive analysis)
  * internal / external links (with rel attributes)
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin, urlparse, urldefrag

from bs4 import BeautifulSoup

logger = logging.getLogger("app.modules.onpage_seo.crawler.parser")


@dataclass
class ParsedHeading:
    level: int
    text: str
    position: int


@dataclass
class ParsedImage:
    src: str
    alt_text: str
    has_alt: bool
    uses_lazy_loading: bool
    is_responsive: bool
    width: Optional[int] = None
    height: Optional[int] = None


@dataclass
class ParsedLink:
    href: str
    anchor_text: str
    is_external: bool
    is_nofollow: bool
    is_sponsored: bool
    is_ugc: bool


@dataclass
class PageParseResult:
    url: str
    title: Optional[str] = None
    description: Optional[str] = None
    canonical_url: Optional[str] = None
    robots_meta: Optional[str] = None
    is_noindex: bool = False
    is_nofollow: bool = False
    headings: List[ParsedHeading] = field(default_factory=list)
    images: List[ParsedImage] = field(default_factory=list)
    links: List[ParsedLink] = field(default_factory=list)
    json_ld_blocks: List[Dict[str, Any]] = field(default_factory=list)
    og_tags: Dict[str, str] = field(default_factory=dict)
    twitter_tags: Dict[str, str] = field(default_factory=dict)
    has_microdata: bool = False
    has_rdfa: bool = False
    word_count: int = 0
    text_content: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "title": self.title,
            "description": self.description,
            "canonical_url": self.canonical_url,
            "robots_meta": self.robots_meta,
            "is_noindex": self.is_noindex,
            "is_nofollow": self.is_nofollow,
            "headings": [{"level": h.level, "text": h.text, "position": h.position} for h in self.headings],
            "images": [
                {
                    "src": i.src,
                    "alt_text": i.alt_text,
                    "has_alt": i.has_alt,
                    "uses_lazy_loading": i.uses_lazy_loading,
                    "is_responsive": i.is_responsive,
                    "width": i.width,
                    "height": i.height,
                }
                for i in self.images
            ],
            "links": [
                {
                    "href": l.href,
                    "anchor_text": l.anchor_text,
                    "is_external": l.is_external,
                    "is_nofollow": l.is_nofollow,
                    "is_sponsored": l.is_sponsored,
                    "is_ugc": l.is_ugc,
                }
                for l in self.links
            ],
            "json_ld_blocks": self.json_ld_blocks,
            "og_tags": self.og_tags,
            "twitter_tags": self.twitter_tags,
            "has_microdata": self.has_microdata,
            "has_rdfa": self.has_rdfa,
            "word_count": self.word_count,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PageParseResult":
        """Rebuild a parse result from :meth:`to_dict` output."""
        headings = [
            ParsedHeading(level=h["level"], text=h["text"], position=h["position"])
            for h in data.get("headings", [])
        ]
        images = [
            ParsedImage(
                src=i["src"],
                alt_text=i.get("alt_text") or "",
                has_alt=i["has_alt"],
                uses_lazy_loading=i["uses_lazy_loading"],
                is_responsive=i["is_responsive"],
                width=i.get("width"),
                height=i.get("height"),
            )
            for i in data.get("images", [])
        ]
        links = [
            ParsedLink(
                href=l["href"],
                anchor_text=l.get("anchor_text") or "",
                is_external=l["is_external"],
                is_nofollow=l["is_nofollow"],
                is_sponsored=l["is_sponsored"],
                is_ugc=l["is_ugc"],
            )
            for l in data.get("links", [])
        ]
        return cls(
            url=data["url"],
            title=data.get("title"),
            description=data.get("description"),
            canonical_url=data.get("canonical_url"),
            robots_meta=data.get("robots_meta"),
            is_noindex=data.get("is_noindex", False),
            is_nofollow=data.get("is_nofollow", False),
            headings=headings,
            images=images,
            links=links,
            json_ld_blocks=data.get("json_ld_blocks", []),
            og_tags=data.get("og_tags", {}),
            twitter_tags=data.get("twitter_tags", {}),
            has_microdata=data.get("has_microdata", False),
            has_rdfa=data.get("has_rdfa", False),
            word_count=data.get("word_count", 0),
            text_content=data.get("text_content", ""),
        )


class HTMLParserService:
    """Stateless parser — safe to construct per call or reuse."""

    def __init__(self) -> None:
        self._domain_cache: Dict[str, str] = {}

    def parse(self, html: str, url: str) -> PageParseResult:
        """Parse ``html`` for the page at ``url``."""
        soup = BeautifulSoup(html, "lxml")
        base_url = self._base_href(soup) or url
        result = PageParseResult(url=url)

        result.title = self._extract_title(soup)
        result.description = self._extract_description(soup)
        result.canonical_url = self._extract_canonical(soup, base_url)
        result.robots_meta, result.is_noindex, result.is_nofollow = self._extract_robots_meta(soup)
        result.headings = self._extract_headings(soup)
        result.images = self._extract_images(soup, base_url)
        result.links = self._extract_links(soup, url, base_url)
        result.json_ld_blocks = self._extract_json_ld(soup)
        result.og_tags = self._extract_property_meta(soup, "og:")
        result.twitter_tags = self._extract_property_meta(soup, "twitter:")
        result.has_microdata = bool(soup.find(attrs={"itemscope": True}))
        result.has_rdfa = bool(soup.find(attrs={"typeof": True}))
        result.text_content, result.word_count = self._extract_text(soup)

        return result

    # --- individual extractors -------------------------------------------

    @staticmethod
    def _base_href(soup: BeautifulSoup) -> Optional[str]:
        tag = soup.find("base", href=True)
        return tag["href"] if tag else None

    @staticmethod
    def _extract_title(soup: BeautifulSoup) -> Optional[str]:
        tag = soup.find("title")
        if not tag:
            return None
        text = tag.get_text(strip=True)
        return text or None

    @staticmethod
    def _extract_description(soup: BeautifulSoup) -> Optional[str]:
        tag = soup.find("meta", attrs={"name": "description"})
        if tag and tag.get("content"):
            return str(tag["content"]).strip()
        return None

    @staticmethod
    def _extract_canonical(soup: BeautifulSoup, base_url: str) -> Optional[str]:
        tag = soup.find("link", rel=lambda r: r and "canonical" in r)
        if not tag or not tag.get("href"):
            return None
        return urljoin(base_url, str(tag["href"]))

    @staticmethod
    def _extract_robots_meta(soup: BeautifulSoup) -> tuple[Optional[str], bool, bool]:
        robots_meta = None
        is_noindex = False
        is_nofollow = False
        tag = soup.find("meta", attrs={"name": lambda n: n and n.lower() == "robots"})
        if tag and tag.get("content"):
            robots_meta = str(tag["content"]).strip()
            directives = [d.strip().lower() for d in robots_meta.split(",")]
            if "noindex" in directives or "none" in directives:
                is_noindex = True
            if "nofollow" in directives or "none" in directives:
                is_nofollow = True
        return robots_meta, is_noindex, is_nofollow

    @staticmethod
    def _extract_headings(soup: BeautifulSoup) -> List[ParsedHeading]:
        headings: List[ParsedHeading] = []
        position = 0
        for tag in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
            position += 1
            text = tag.get_text(" ", strip=True)
            if text:
                headings.append(ParsedHeading(level=int(tag.name[1]), text=text, position=position))
        return headings

    @staticmethod
    def _extract_images(soup: BeautifulSoup, base_url: str) -> List[ParsedImage]:
        images: List[ParsedImage] = []
        for img in soup.find_all("img"):
            src = img.get("src") or img.get("data-src")
            if not src:
                continue
            alt_text = img.get("alt") or ""
            has_alt = bool(alt_text.strip())
            lazy = bool(
                img.get("loading", "").lower() == "lazy"
                or "lazy" in (img.get("class") or [])
                or img.get("data-src") is not None
            )
            srcset = img.get("srcset")
            responsive = bool(srcset) or img.get("sizes") is not None

            width = None
            height = None
            try:
                if img.get("width"):
                    width = int(img["width"])
                if img.get("height"):
                    height = int(img["height"])
            except (TypeError, ValueError):
                pass

            images.append(ParsedImage(
                src=urljoin(base_url, src),
                alt_text=alt_text,
                has_alt=has_alt,
                uses_lazy_loading=lazy,
                is_responsive=responsive,
                width=width,
                height=height,
            ))
        return images

    def _extract_links(self, soup: BeautifulSoup, page_url: str, base_url: str) -> List[ParsedLink]:
        links: List[ParsedLink] = []
        page_domain = urlparse(page_url).netloc

        for anchor in soup.find_all("a", href=True):
            href = urljoin(base_url, str(anchor["href"]))
            href, _fragment = urldefrag(href)
            anchor_text = anchor.get_text(" ", strip=True)
            rel = set((anchor.get("rel") or "").split()) if isinstance(anchor.get("rel"), str) else set(anchor.get("rel") or [])
            domain = urlparse(href).netloc

            links.append(ParsedLink(
                href=href,
                anchor_text=anchor_text,
                is_external=bool(domain) and domain != page_domain,
                is_nofollow="nofollow" in rel,
                is_sponsored="sponsored" in rel,
                is_ugc="ugc" in rel,
            ))
        return links

    @staticmethod
    def _extract_json_ld(soup: BeautifulSoup) -> List[Dict[str, Any]]:
        blocks: List[Dict[str, Any]] = []
        for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
            try:
                data = json.loads(script.string or script.get_text())
            except (json.JSONDecodeError, TypeError):
                continue
            if isinstance(data, list):
                blocks.extend(item for item in data if isinstance(item, dict))
            elif isinstance(data, dict):
                blocks.append(data)
        return blocks

    @staticmethod
    def _extract_property_meta(soup: BeautifulSoup, prefix: str) -> Dict[str, str]:
        tags: Dict[str, str] = {}
        for meta in soup.find_all("meta"):
            prop = meta.get("property") or meta.get("name")
            content = meta.get("content")
            if prop and isinstance(prop, str) and prop.startswith(prefix) and content:
                tags[prop] = str(content)
        return tags

    @staticmethod
    def _extract_text(soup: BeautifulSoup) -> tuple[str, int]:
        for script in soup(["script", "style", "noscript"]):
            script.decompose()
        text = soup.get_text(" ", strip=True)
        words = len(text.split())
        return text, words
