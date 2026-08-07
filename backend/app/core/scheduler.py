"""APScheduler singleton and lifecycle helpers.

Provides a single :class:`AsyncIOScheduler` used by the F04 Search Console
scheduler and the F06 On-Page SEO crawler scheduler.

Job persistence:
  * Prefers :class:`RedisJobStore` (durable across process restarts) since
    Redis is already a project dependency.
  * Falls back to :class:`MemoryJobStore` when Redis is unreachable so the
    scheduler still works (jobs are lost on restart — acceptable fallback).

Lifecycle is wired into ``app/main.py`` lifespan:
  * ``start_scheduler()`` on startup
  * ``shutdown_scheduler()`` on shutdown
"""
from __future__ import annotations

import logging
from typing import Any, Callable, Optional

from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.base import BaseJobStore

from app.core.config import settings

logger = logging.getLogger("app.core.scheduler")

_scheduler: Optional[AsyncIOScheduler] = None


def _default_jobstores() -> dict[str, BaseJobStore]:
    """Build job stores: Redis when possible, Memory as fallback."""
    stores: dict[str, BaseJobStore] = {}
    try:
        from apscheduler.jobstores.redis import RedisJobStore

        stores["default"] = RedisJobStore(
            jobs_key="organic-leads:scheduler:jobs",
            run_times_key="organic-leads:scheduler:run_times",
            host="localhost",
            port=6379,
            db=0,
)
        logger.info("Scheduler using RedisJobStore (persistent)")
    except Exception as exc:  # noqa: BLE001
        from apscheduler.jobstores.memory import MemoryJobStore

        logger.warning("RedisJobStore unavailable (%s); using MemoryJobStore", exc)
        stores["default"] = MemoryJobStore()
    return stores


def _default_executors() -> dict[str, Any]:
    return {
        "default": AsyncIOExecutor(),
        "io": AsyncIOExecutor(),
    }


def get_scheduler() -> AsyncIOScheduler:
    """Return the process-wide scheduler singleton, creating it on first use."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(
            jobstores=_default_jobstores(),
            executors=_default_executors(),
            job_defaults={
                "coalesce": settings.SCHEDULER_JOB_COALESCE,
                "max_instances": settings.SCHEDULER_JOB_MAX_INSTANCES,
                "misfire_grace_time": settings.SCHEDULER_MISSED_FIRE_GRACE_SECONDS,
            },
            timezone="UTC",
        )
    return _scheduler


def start_scheduler() -> None:
    """Start the scheduler (idempotent). No-op when disabled by settings."""
    if not settings.SCHEDULER_ENABLED:
        logger.info("Scheduler disabled via SCHEDULER_ENABLED=false")
        return
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler started")
        for job in scheduler.get_jobs():
            logger.info("  scheduled job: %s (next=%s)", job.id, job.next_run_time)


def shutdown_scheduler() -> None:
    """Gracefully stop the scheduler if it is running."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
    _scheduler = None


def schedule_interval_job(
    func: Callable,
    interval_minutes: int,
    job_id: str,
    *,
    max_instances: Optional[int] = None,
    replace_existing: bool = True,
    kwargs: Optional[dict] = None,
) -> Any:
    """Register (or update) an interval job on the shared scheduler.

    ``replace_existing=True`` makes registration idempotent so app reloads
    don't create duplicate jobs.
    """
    scheduler = get_scheduler()
    job = scheduler.add_job(
        func,
        trigger="interval",
        minutes=interval_minutes,
        id=job_id,
        replace_existing=replace_existing,
        max_instances=max_instances or settings.SCHEDULER_JOB_MAX_INSTANCES,
        kwargs=kwargs or {},
        executor="io",
    )
    logger.info("Scheduled interval job %s every %d min", job_id, interval_minutes)
    return job


def schedule_cron_job(
    func: Callable,
    job_id: str,
    *,
    hour: Optional[str] = None,
    minute: Optional[str] = None,
    day: Optional[str] = None,
    day_of_week: Optional[str] = None,
    replace_existing: bool = True,
    kwargs: Optional[dict] = None,
) -> Any:
    """Register (or update) a cron job on the shared scheduler."""
    scheduler = get_scheduler()
    job = scheduler.add_job(
        func,
        trigger="cron",
        hour=hour,
        minute=minute,
        day=day,
        day_of_week=day_of_week,
        id=job_id,
        replace_existing=replace_existing,
        max_instances=settings.SCHEDULER_JOB_MAX_INSTANCES,
        kwargs=kwargs or {},
        executor="io",
    )
    logger.info("Scheduled cron job %s", job_id)
    return job


def scheduler_running() -> bool:
    """Return True when the scheduler is running (used by health checks)."""
    return _scheduler is not None and _scheduler.running


def get_scheduled_jobs() -> list[dict]:
    """Return a serialisable snapshot of registered jobs (for monitoring)."""
    scheduler = get_scheduler()
    jobs = []
    for job in scheduler.get_jobs():
        jobs.append({
            "id": job.id,
            "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
            "trigger": str(job.trigger),
        })
    return jobs
