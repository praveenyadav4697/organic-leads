"""Correlation ID propagation.

Every inbound HTTP request gets a ``correlation_id`` (taken from the
``X-Request-ID`` header when present, otherwise a fresh UUID4). The ID is:

  * stored in a :class:`contextvars.ContextVar` so it flows through
    ``asyncio`` tasks started from the request;
  * exposed on the response as ``X-Request-ID``;
  * made available to logging via a :class:`logging.Filter` (see
    ``app/core/logging.py``) and to services via :func:`get_correlation_id`.

Background jobs (APScheduler) set their own correlation ID when they start
so job log lines can be correlated end-to-end.
"""
from __future__ import annotations

import uuid
from contextvars import ContextVar
from typing import Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

_correlation_id: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)


def get_correlation_id() -> Optional[str]:
    """Return the current request's correlation ID (or None outside a request)."""
    return _correlation_id.get()


def set_correlation_id(value: str) -> None:
    """Set the correlation ID for the current task context."""
    _correlation_id.set(value)


def new_correlation_id() -> str:
    """Generate a fresh correlation ID."""
    return uuid.uuid4().hex


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Starlette middleware that assigns/propagates ``X-Request-ID``."""

    async def dispatch(self, request: Request, call_next):
        incoming = request.headers.get("X-Request-ID") or request.headers.get("x-correlation-id")
        correlation_id = incoming or new_correlation_id()
        set_correlation_id(correlation_id)
        response = await call_next(request)
        response.headers["X-Request-ID"] = correlation_id
        return response
