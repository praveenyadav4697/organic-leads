"""Inspect /robots.txt.

Robots is technically optional — many sites have none. The inspector
classifies the outcome as one of:

  * exists=True, status=200, body="..."
  * exists=False, status=404, body=None  (the most common case)
  * not_publicly_available=True (DNS/connect failure)

The first two are entirely public information; the third is the "we
couldn't tell" case.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from app.modules.website.discovery_schemas import RobotsFacts
from app.modules.website.http_inspector import HTTPInspector, FetchResult


async def fetch(http: HTTPInspector, base_url: str) -> RobotsFacts:
    """Fetch /robots.txt and return the discovery facts."""
    url = base_url.rstrip("/") + "/robots.txt"
    result: FetchResult = await http.fetch(url, transport="robots")

    if result.not_publicly_available:
        return RobotsFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": result.error, "url": url},
        )

    # 404 is a perfectly valid answer — we want to record that public fact.
    if result.status_code == 404:
        return RobotsFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=False,
            fields={"exists": False, "status_code": 404, "url": url},
        )

    # 2xx: actually read the body.
    if result.ok and result.text is not None:
        return RobotsFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=False,
            fields={
                "exists": True,
                "status_code": result.status_code,
                "url": url,
                "body": result.text[:8192],  # cap so a malicious robots.txt can't bloat our DB
            },
        )

    # 5xx or other unexpected status — treat as "couldn't tell".
    return RobotsFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=True,
        fields={
            "status_code": result.status_code,
            "url": url,
            "error": result.error or f"unexpected status {result.status_code}",
        },
    )
