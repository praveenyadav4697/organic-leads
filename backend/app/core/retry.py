"""Retry engine with exponential backoff.

Used by F04 (Search Console sync jobs) and F06 (On-Page SEO crawl jobs) to:

  * retry transient failures with exponential backoff + jitter;
  * cap retries per job (``max_retries``);
  * surface jobs that exhaust their retries as *dead* so an operator can
    inspect and re-enqueue them (dead-job detection).

The engine is deliberately dependency-free (pure asyncio) so it works both
inside the scheduler and from a plain ``await`` call.
"""
from __future__ import annotations

import asyncio
import logging
import random
from dataclasses import dataclass, field
from typing import Any, Awaitable, Callable, Dict, Optional, TypeVar

logger = logging.getLogger("app.core.retry")

T = TypeVar("T")


class RetryExhaustedError(Exception):
    """Raised when a job exhausts its maximum retry attempts."""

    def __init__(self, attempts: int, last_error: Exception, backoff_history: list[float]):
        self.attempts = attempts
        self.last_error = last_error
        self.backoff_history = backoff_history
        super().__init__(
            f"Job failed after {attempts} attempt(s); last error: {last_error}"
        )


class DeadLetterJobError(Exception):
    """Raised when a job is already past its max retries and must not run again.

    The scheduler treats this as the trigger to mark the job ``dead``.
    """


@dataclass
class RetryPolicy:
    """Configuration for retry behaviour."""

    max_retries: int = 3
    base_delay_seconds: float = 2.0
    max_delay_seconds: float = 60.0
    factor: float = 2.0
    jitter: bool = True
    jitter_ratio: float = 0.25
    retry_on: tuple = (Exception,)  # exception classes that warrant a retry

    def delay_for_attempt(self, attempt: int) -> float:
        """Exponential backoff for the 1-based ``attempt`` number.

        ``attempt=1`` (first retry) sleeps ``base_delay`` seconds.
        """
        delay = self.base_delay_seconds * (self.factor ** (attempt - 1))
        delay = min(delay, self.max_delay_seconds)
        if self.jitter:
            spread = delay * self.jitter_ratio
            delay += random.uniform(-spread, spread)
        return max(0.0, delay)


@dataclass
class RetryResult:
    """Outcome of a retried call."""

    ok: bool
    value: Any = None
    error: Optional[Exception] = None
    attempts: int = 0
    backoff_history: list[float] = field(default_factory=list)
    dead: bool = False

    def as_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "attempts": self.attempts,
            "dead": self.dead,
            "backoff_history": self.backoff_history,
            "error": str(self.error) if self.error else None,
        }


class RetryEngine:
    """Async retry runner around a callable.

    Example
    -------
    .. code-block:: python

        engine = RetryEngine(RetryPolicy(max_retries=3))
        result = await engine.run(service.sync_sitemaps, prop.id)
        if result.dead:
            mark_job_dead(job)
    """

    def __init__(self, policy: Optional[RetryPolicy] = None):
        self.policy = policy or RetryPolicy()

    async def run(self, fn: Callable[..., Awaitable[T]], *args: Any, **kwargs: Any) -> RetryResult:
        """Run ``fn`` with retries per :attr:`policy`."""
        attempts = 0
        backoff_history: list[float] = []
        while True:
            try:
                value = await fn(*args, **kwargs)
                return RetryResult(ok=True, value=value, attempts=attempts, backoff_history=backoff_history)
            except self.policy.retry_on as exc:
                attempts += 1
                if attempts > self.policy.max_retries:
                    retry_exc = RetryExhaustedError(attempts, exc, backoff_history)
                    logger.error(
                        "Retries exhausted for %s: %s", getattr(fn, "__qualname__", fn), exc,
                        extra={"retry_attempts": attempts, "function": getattr(fn, "__qualname__", None)},
                    )
                    return RetryResult(
                        ok=False, error=retry_exc, attempts=attempts,
                        backoff_history=backoff_history, dead=True,
                    )
                delay = self.policy.delay_for_attempt(attempts)
                backoff_history.append(round(delay, 3))
                logger.warning(
                    "Retry %d/%d for %s after %ss: %s",
                    attempts, self.policy.max_retries,
                    getattr(fn, "__qualname__", fn), round(delay, 2), exc,
                    extra={"retry_attempt": attempts, "retry_delay": delay},
                )
                await asyncio.sleep(delay)
            except Exception as exc:  # noqa: BLE001
                # Non-retryable exception — fail immediately.
                return RetryResult(ok=False, error=exc, attempts=attempts, backoff_history=backoff_history)

    @staticmethod
    def compute_next_attempt(policy: RetryPolicy, current_retries: int) -> Optional[float]:
        """Return the seconds until the next retry, or None if the job is dead.

        Used by the scheduler to *schedule* a retry rather than blocking the
        event loop (``run`` above is for inline use).
        """
        if current_retries >= policy.max_retries:
            return None
        return policy.delay_for_attempt(current_retries + 1)


# Shared instance with the project's default policy.
default_engine = RetryEngine()
