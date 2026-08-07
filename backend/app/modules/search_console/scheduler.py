"""APScheduler jobs for the Search Console module.

Two periodic jobs are registered:

  * ``search-console-periodic-sync`` — every ``SEARCH_CONSOLE_SYNC_INTERVAL_MINUTES``,
    syncs every *connected* property (in parallel, with a bounded semaphore).
  * ``search-console-retry-cycle`` — every 5 minutes, re-runs failed jobs
    whose ``next_retry_at`` has passed (exponential backoff governed by
    ``app/modules/search_console/retry.py``).

Each background run opens its own database session — it is not running
inside an HTTP request, so it cannot reuse the request-scoped dependency.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.metrics import registry
from app.core.scheduler import schedule_interval_job, scheduler_running
from app.modules.search_console.models import (
    SearchConsoleProperty,
    SearchConsoleSyncJob,
    ConnectionStatusEnum,
    SyncStatusEnum,
)
from app.modules.search_console.retry import should_retry_job, job_summary
from app.modules.search_console.service import SearchConsoleService

logger = logging.getLogger("app.modules.search_console.scheduler")

_RETRY_INTERVAL_MINUTES = 5
_SYNC_CONCURRENCY = 5


async def _sync_one_property(property_id: str, sync_type: str = "full") -> dict:
    """Run a sync for a single property inside a dedicated session."""
    async with AsyncSessionLocal() as session:
        service = SearchConsoleService(session)
        try:
            result = await service.sync_property(property_id, sync_type, force=False)
            registry.increment("search_console_sync_total", labels={"status": "ok"})
            return result
        except Exception as exc:  # noqa: BLE001
            registry.increment("search_console_sync_total", labels={"status": "failed"})
            logger.exception("Background sync failed for property %s: %s", property_id, exc)
            return {"property_id": property_id, "status": "failed", "error": str(exc)}
        finally:
            await service.aclose_clients()


async def sync_all_connected_properties() -> dict:
    """Periodic job: sync every connected property in parallel."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(SearchConsoleProperty).where(
                SearchConsoleProperty.connection_status == ConnectionStatusEnum.connected
            )
        )
        properties = result.scalars().all()

    if not properties:
        return {"synced": 0, "properties": []}

    semaphore = asyncio.Semaphore(_SYNC_CONCURRENCY)

    async def _guarded(prop) -> dict:
        async with semaphore:
            return await _sync_one_property(str(prop.id))

    results = await asyncio.gather(*(_guarded(p) for p in properties))
    summary = {
        "synced": sum(1 for r in results if r.get("status") == "completed"),
        "failed": sum(1 for r in results if r.get("status") == "failed"),
        "properties": results,
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    logger.info("Periodic sync finished: %s", summary)
    return summary


async def sync_properties_parallel(property_ids: list[str], sync_type: str = "full") -> dict:
    """Parallel synchronization for an explicit list of property IDs.

    Exposed via ``POST /search-console/sync-all`` so operators can trigger a
    parallel sync outside the periodic scheduler. Each property runs in its
    own session; concurrency is bounded by ``_SYNC_CONCURRENCY``.
    """
    if not property_ids:
        return {"synced": 0, "failed": 0, "properties": []}

    semaphore = asyncio.Semaphore(_SYNC_CONCURRENCY)

    async def _guarded(pid: str) -> dict:
        async with semaphore:
            return await _sync_one_property(pid, sync_type)

    results = await asyncio.gather(*(_guarded(pid) for pid in property_ids))
    return {
        "synced": sum(1 for r in results if r.get("status") == "completed"),
        "failed": sum(1 for r in results if r.get("status") == "failed"),
        "properties": results,
    }


async def retry_failed_jobs() -> dict:
    """Periodic job: re-run failed sync jobs that are due for a retry."""
    now = datetime.now(timezone.utc)
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(SearchConsoleSyncJob).where(
                SearchConsoleSyncJob.status.in_([SyncStatusEnum.failed, SyncStatusEnum.queued])
            )
        )
        candidates = result.scalars().all()

    due = [j for j in candidates if await should_retry_job(j, now)]
    if not due:
        return {"retried": 0, "dead": 0}

    outcomes = []
    for job in due:
        try:
            outcome = await _sync_one_property(str(job.property_id), job.sync_type or "full")
            outcomes.append({"job_id": str(job.id), **outcome})
        except Exception as exc:  # noqa: BLE001
            outcomes.append({"job_id": str(job.id), "status": "failed", "error": str(exc)})

    # Re-query the affected jobs to reflect new state for the summary.
    dead = 0
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(SearchConsoleSyncJob).where(
                SearchConsoleSyncJob.id.in_([j.id for j in due])
            )
        )
        for refreshed in result.scalars().all():
            if refreshed.is_dead:
                dead += 1

    summary = {"retried": len(due), "dead": dead, "outcomes": outcomes}
    logger.info("Retry cycle finished: %s", summary)
    return summary


async def run_alert_sweep_job() -> dict:
    """Periodic job: evaluate credentials expiry and data staleness alerts."""
    async with AsyncSessionLocal() as session:
        service = SearchConsoleService(session)
        try:
            return await service.run_alert_sweep()
        except Exception as exc:  # noqa: BLE001
            logger.exception("Alert sweep failed: %s", exc)
            return {"alert_count": 0, "alerts": [], "error": str(exc)}
        finally:
            await service.aclose_clients()


def register_search_console_jobs() -> None:
    """Register the module's periodic jobs on the shared scheduler.

    Called from ``app/main.py`` lifespan. No-op when the scheduler is
    disabled.
    """
    if not scheduler_running():
        logger.info("Scheduler not running; skipping Search Console job registration")
        return

    from app.core.config import settings

    schedule_interval_job(
        sync_all_connected_properties,
        interval_minutes=settings.SEARCH_CONSOLE_SYNC_INTERVAL_MINUTES,
        job_id="search-console-periodic-sync",
    )
    schedule_interval_job(
        retry_failed_jobs,
        interval_minutes=_RETRY_INTERVAL_MINUTES,
        job_id="search-console-retry-cycle",
    )
    schedule_interval_job(
        run_alert_sweep_job,
        interval_minutes=settings.SEARCH_CONSOLE_ALERT_SWEEP_INTERVAL_MINUTES,
        job_id="search-console-alert-sweep",
    )
    logger.info("Registered Search Console scheduler jobs")
