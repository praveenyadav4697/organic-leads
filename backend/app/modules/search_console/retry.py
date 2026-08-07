"""Retry scheduling for Search Console sync jobs.

Wraps the shared retry engine (``app/core/retry.py``) with the Search
Console sync-job lifecycle:

  * a job that fails records ``retry_count + 1`` and a ``next_retry_at``
    computed from exponential backoff;
  * when ``retry_count >= max_retries`` the job is flagged ``is_dead`` and
    is never auto-retried again (dead-job detection);
  * the scheduler's ``retry_failed_jobs`` pass re-runs jobs whose
    ``next_retry_at`` has passed.
"""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.retry import RetryPolicy, RetryEngine, RetryResult
from app.modules.search_console.models import (
    SearchConsoleSyncJob,
    SyncStatusEnum,
)

logger = logging.getLogger("app.modules.search_console.retry")


def sync_retry_policy() -> RetryPolicy:
    """Default retry policy for Search Console sync jobs.

    Base delay of 60s grows 2x per attempt up to a 30-minute cap — Google
    API throttling is the usual cause, so retries are spaced out.
    """
    return RetryPolicy(
        max_retries=settings.SEARCH_CONSOLE_MAX_RETRIES,
        base_delay_seconds=60.0,
        max_delay_seconds=1800.0,
        factor=2.0,
        jitter=True,
    )


async def schedule_job_retry(
    db: AsyncSession,
    job: SearchConsoleSyncJob,
    error: str,
) -> None:
    """Record a failed attempt and either schedule the next retry or mark the
    job dead.

    ``retry_count`` is incremented here; when it reaches ``max_retries`` the
    job is flagged ``is_dead`` (dead-job detection) and never auto-retried.
    A monitoring alert is raised on every failure (deduplicated while open);
    once the job goes dead a ``sync_dead_job`` alert is raised instead.
    """
    from app.modules.search_console.repository import SearchConsoleAlertRepository
    from app.modules.search_console.models import (
        SearchConsoleProperty,
        AlertTypeEnum,
        AlertSeverityEnum,
    )
    from sqlalchemy import select

    alert_repo = SearchConsoleAlertRepository(db)

    property_name = None
    result = await db.execute(
        select(SearchConsoleProperty).where(SearchConsoleProperty.id == job.property_id)
    )
    prop = result.scalar_one_or_none()
    if prop is not None:
        property_name = prop.property_name

    job.error_message = error
    job.retry_count += 1
    if job.retry_count >= job.max_retries:
        job.is_dead = True
        job.next_retry_at = None
        logger.error(
            "Sync job %s marked dead after %d/%d retries: %s",
            job.id, job.retry_count, job.max_retries, error,
        )
        await alert_repo.create_alert(
            alert_type=AlertTypeEnum.sync_dead_job,
            severity=AlertSeverityEnum.critical,
            title=f"Sync permanently failed for {property_name or job.property_id}",
            message=(
                f"Sync job {job.id} exhausted {job.max_retries} retries and was "
                f"marked dead. Last error: {error}"
            ),
            property_id=job.property_id,
            details={
                "job_id": str(job.id),
                "retry_count": job.retry_count,
                "max_retries": job.max_retries,
                "error": error,
            },
        )
    else:
        policy = sync_retry_policy()
        delay = RetryEngine.compute_next_attempt(policy, job.retry_count)
        wait = delay if delay is not None else policy.base_delay_seconds
        job.next_retry_at = datetime.now(timezone.utc) + timedelta(seconds=wait)
        job.status = SyncStatusEnum.failed
        logger.warning(
            "Sync job %s retry %d/%d scheduled for %s",
            job.id, job.retry_count, job.max_retries, job.next_retry_at,
        )
        await alert_repo.create_alert(
            alert_type=AlertTypeEnum.sync_failed,
            severity=AlertSeverityEnum.warning,
            title=f"Search Console sync failed for {property_name or job.property_id}",
            message=f"Sync failed (attempt {job.retry_count}/{job.max_retries}): {error}",
            property_id=job.property_id,
            details={
                "job_id": str(job.id),
                "sync_type": job.sync_type,
                "retry_count": job.retry_count,
                "max_retries": job.max_retries,
                "error": error,
            },
        )
    await db.commit()


async def should_retry_job(job: SearchConsoleSyncJob, now: Optional[datetime] = None) -> bool:
    """Return True when a failed job is due for another attempt."""
    if job.is_dead or job.retry_count >= job.max_retries:
        return False
    if job.next_retry_at is None:
        return False
    now = now or datetime.now(timezone.utc)
    if job.next_retry_at.tzinfo is None:
        job.next_retry_at = job.next_retry_at.replace(tzinfo=timezone.utc)
    return now >= job.next_retry_at


def job_summary(job: SearchConsoleSyncJob) -> Dict[str, Any]:
    """Serialisable snapshot of a sync job for monitoring endpoints."""
    return {
        "id": str(job.id),
        "property_id": str(job.property_id),
        "sync_type": job.sync_type,
        "status": job.status.value if hasattr(job.status, "value") else str(job.status),
        "retry_count": job.retry_count,
        "max_retries": job.max_retries,
        "next_retry_at": job.next_retry_at.isoformat() if job.next_retry_at else None,
        "is_dead": job.is_dead,
        "error_message": job.error_message,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "duration_seconds": job.duration_seconds,
    }


# Shared engine instance for the module.
retry_engine = RetryEngine(sync_retry_policy())
