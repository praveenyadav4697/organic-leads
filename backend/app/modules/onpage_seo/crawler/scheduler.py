"""APScheduler jobs for the On-Page SEO crawler.

Registers a periodic crawl job (every
``ONPAGE_CRAWLER_SCHEDULE_INTERVAL_MINUTES``) that re-crawls every website
that already has pages in ``onpage_seo_pages``. Each crawl runs in its own
database session and persists results through ``OnPageSEOService``.
"""
from __future__ import annotations

import logging
from sqlalchemy import select, func

from app.core.database import AsyncSessionLocal
from app.core.metrics import registry
from app.core.scheduler import schedule_interval_job, scheduler_running
from app.modules.onpage_seo.models import SEOPage
from app.modules.onpage_seo.service import OnPageSEOService

logger = logging.getLogger("app.modules.onpage_seo.crawler.scheduler")


async def run_scheduled_crawl() -> dict:
    """Periodic job: crawl every website that already has pages."""
    async with AsyncSessionLocal() as session:
        rows = await session.execute(
            select(SEOPage.website_id).distinct()
        )
        website_ids = [r[0] for r in rows.all()]

    if not website_ids:
        return {"crawled": 0, "websites": []}

    outcomes = []
    for website_id in website_ids:
        try:
            outcome = await crawl_website(website_id)
            outcomes.append({"website_id": website_id, **outcome})
        except Exception as exc:  # noqa: BLE001
            logger.exception("Scheduled crawl failed for website %s: %s", website_id, exc)
            outcomes.append({"website_id": website_id, "status": "failed", "error": str(exc)})

    summary = {"crawled": sum(1 for o in outcomes if o.get("status") == "completed"), "websites": outcomes}
    logger.info("Scheduled crawl finished: %s", summary)
    return summary


async def crawl_website(website_id: str, start_url: str | None = None) -> dict:
    """Crawl a single website and persist results.

    Used by the scheduler and exposed via ``POST /onpage/crawl``.
    """
    async with AsyncSessionLocal() as session:
        service = OnPageSEOService(session)
        try:
            result = await service.run_crawl(website_id, start_url=start_url)
            registry.increment("onpage_crawl_total", labels={"status": "ok"})
            return {"status": "completed", "crawl_job_id": result.get("crawl_job_id"), "urls_crawled": result.get("urls_crawled")}
        except Exception as exc:  # noqa: BLE001
            registry.increment("onpage_crawl_total", labels={"status": "failed"})
            logger.exception("Crawl failed for website %s: %s", website_id, exc)
            return {"status": "failed", "error": str(exc)}


def register_onpage_crawl_jobs() -> None:
    """Register the module's periodic crawl job on the shared scheduler."""
    if not scheduler_running():
        logger.info("Scheduler not running; skipping On-Page SEO job registration")
        return

    from app.core.config import settings

    schedule_interval_job(
        run_scheduled_crawl,
        interval_minutes=settings.ONPAGE_CRAWLER_SCHEDULE_INTERVAL_MINUTES,
        job_id="onpage-periodic-crawl",
    )
    logger.info("Registered On-Page SEO crawler job")
