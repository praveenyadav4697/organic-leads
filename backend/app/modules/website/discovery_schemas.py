"""Pydantic schemas for the public discovery engine.

The shape of every facts payload is:

    {
      "checked_at":   <iso 8601>,
      "not_publicly_available": <bool>,
      "fields": { ... the actual values ... }
    }

The top-level ``not_publicly_available`` flag lets the frontend render
"Not Publicly Available" with a single check — it doesn't have to inspect
each field. The ``fields`` dict carries whatever the inspector actually
managed to discover; missing values inside ``fields`` should also be
treated as unavailable by the frontend.

Every schema is built around the same three pillars:
  * a `checked_at` timestamp
  * a `not_publicly_available` boolean (default False; flipped to True if the
    inspector could not reach the public source at all)
  * a `fields` dict holding the public values
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Base — every fact payload inherits this shape.
# ---------------------------------------------------------------------------


class FactsBase(BaseModel):
    """Common envelope: checked_at, not_publicly_available, fields."""

    model_config = ConfigDict(from_attributes=True)

    checked_at: Optional[datetime] = None
    not_publicly_available: bool = False
    fields: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Site information
# ---------------------------------------------------------------------------


class SiteInfoFacts(FactsBase):
    """Title, meta description, charset, language, generator, favicon."""

    pass  # everything lives in `fields` — schema stays open


# ---------------------------------------------------------------------------
# WordPress — public-only detection
# ---------------------------------------------------------------------------


class WordPressPublicFacts(FactsBase):
    """Public-only WordPress detection. NO credentials, NO inventory."""

    pass


# ---------------------------------------------------------------------------
# SSL — certificate details
# ---------------------------------------------------------------------------


class SSLFacts(FactsBase):
    """HTTPS certificate and TLS connection details."""

    pass


# ---------------------------------------------------------------------------
# DNS — A/AAAA/MX/NS/TXT
# ---------------------------------------------------------------------------


class DNSFacts(FactsBase):
    """DNS records discovered via the resolver."""

    pass


# ---------------------------------------------------------------------------
# WHOIS — registrar, dates, nameservers
# ---------------------------------------------------------------------------


class WhoisFacts(FactsBase):
    """Domain registration details from RDAP/WHOIS."""

    pass


# ---------------------------------------------------------------------------
# SEO — title, meta, OG, Twitter, JSON-LD, headers
# ---------------------------------------------------------------------------


class SEOFacts(FactsBase):
    """Search-engine optimization signals parsed from the homepage."""

    pass


# ---------------------------------------------------------------------------
# Security — headers, mixed content, dir listing, cookies
# ---------------------------------------------------------------------------


class SecurityFacts(FactsBase):
    """Public security posture surfaces."""

    pass


# ---------------------------------------------------------------------------
# Performance — TTFB, redirects, compression
# ---------------------------------------------------------------------------


class PerformanceFacts(FactsBase):
    """Public performance timings and compression."""

    pass


# ---------------------------------------------------------------------------
# Mobile — viewport
# ---------------------------------------------------------------------------


class MobileFacts(FactsBase):
    """Viewport meta tag for responsive rendering."""

    pass


# ---------------------------------------------------------------------------
# Robots / Sitemap
# ---------------------------------------------------------------------------


class RobotsFacts(FactsBase):
    """Contents of /robots.txt."""

    pass


class SitemapFacts(FactsBase):
    """Contents of /sitemap.xml (or its WP variant)."""

    pass


# ---------------------------------------------------------------------------
# Aggregate DiscoveryResult — what the orchestrator returns to the service.
# ---------------------------------------------------------------------------


class DiscoveryResult(BaseModel):
    """The full shape consumed by the service layer / persisted to DB.

    Every `*facts` field is the raw envelope from the corresponding inspector.
    Summary fields (``ip``, ``registrar``, etc.) are convolved from these by
    the service layer for fast dashboard rendering.
    """

    model_config = ConfigDict(from_attributes=True)

    url: str
    final_url: Optional[str] = None
    protocol: Optional[str] = None
    domain: Optional[str] = None
    status_code: Optional[int] = None
    redirect_count: int = 0
    checked_at: datetime = Field(default_factory=datetime.utcnow)

    site_info: SiteInfoFacts = Field(default_factory=SiteInfoFacts)
    wordpress: WordPressPublicFacts = Field(default_factory=WordPressPublicFacts)
    ssl: SSLFacts = Field(default_factory=SSLFacts)
    dns: DNSFacts = Field(default_factory=DNSFacts)
    whois: WhoisFacts = Field(default_factory=WhoisFacts)
    seo: SEOFacts = Field(default_factory=SEOFacts)
    security: SecurityFacts = Field(default_factory=SecurityFacts)
    performance: PerformanceFacts = Field(default_factory=PerformanceFacts)
    mobile: MobileFacts = Field(default_factory=MobileFacts)
    robots: RobotsFacts = Field(default_factory=RobotsFacts)
    sitemap: SitemapFacts = Field(default_factory=SitemapFacts)

    # Summary fields — filled in by the service for the dashboard.
    cms: Optional[str] = None
    version: Optional[str] = None
    ip: Optional[str] = None
    registrar: Optional[str] = None
    health_score: Optional[int] = None
    performance_score: Optional[int] = None
    seo_score: Optional[int] = None
    responsive_score: Optional[int] = None
    security_score: Optional[int] = None

    # Errors observed by individual inspectors (do not break the scan).
    errors: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Convenience helpers
# ---------------------------------------------------------------------------


def mark_unavailable(facts: FactsBase, error: Optional[str] = None) -> FactsBase:
    """Return a copy of ``facts`` with the unavailability flag flipped on.

    Keeps the timestamp (so the UI can still show "last checked at").
    """
    return facts.model_copy(
        update={
            "not_publicly_available": True,
            "fields": {**facts.fields, "error": error} if error else facts.fields,
        }
    )


def public_or_none(value: Any) -> Optional[Any]:
    """Return ``value`` if it is a non-empty, non-None thing; otherwise None.

    Centralizes the "is this publicly knowable?" check so all inspectors
    use the same rule: empty string, None, and empty list are all None.
    """
    if value is None:
        return None
    if isinstance(value, str) and not value.strip():
        return None
    if isinstance(value, (list, dict, set, tuple)) and len(value) == 0:
        return None
    return value


def to_fields_dict(**kwargs: Any) -> Dict[str, Any]:
    """Build a ``fields`` dict, dropping None-valued keys.

    Inspectors return their discovered values as kwargs and use this helper
    to build the ``fields`` block. None = "the public source didn't reveal
    this", which the frontend renders as "Not Publicly Available".
    """
    return {k: v for k, v in kwargs.items() if public_or_none(v) is not None}
