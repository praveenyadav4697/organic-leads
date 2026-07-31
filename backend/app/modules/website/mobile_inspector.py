"""Parse the homepage HTML for mobile / responsive signals.

Just one fact for now: the viewport meta tag. ``<meta name="viewport"
content="width=device-width, initial-scale=1.0">`` is the canonical
indicator that the site is responsive.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from bs4 import BeautifulSoup

from app.modules.website.discovery_schemas import MobileFacts, to_fields_dict


def parse(html: str) -> MobileFacts:
    if not html:
        return MobileFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": "no HTML to parse"},
        )

    soup = BeautifulSoup(html, "lxml")
    tag = soup.find("meta", attrs={"name": "viewport"})
    content = tag.get("content").strip() if tag and tag.get("content") else None

    has_responsive = bool(content and "width=device-width" in content.lower())

    fields = to_fields_dict(
        viewport_meta=content,
        has_responsive_tag=has_responsive if content else None,
    )

    return MobileFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=len(fields) == 0,
        fields=fields,
    )
