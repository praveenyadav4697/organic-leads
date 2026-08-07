"""Redis-backed cache with graceful degradation.

Used by both F04 (Search Console) and F06 (On-Page SEO) services to cache
expensive external lookups (performance reports, URL inspections,
enhancements, crawl data, parsed pages).

Design:
  * ``redis.asyncio`` client (sync-safe: a lazy, memoized async client).
  * Values are JSON-encoded; ``None`` values are never cached.
  * Keys are namespaced under ``settings.REDIS_PREFIX``.
  * Any Redis failure is swallowed and logged — the cache is an
    optimisation, never a correctness dependency.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any, Awaitable, Callable, Optional, TypeVar

from app.core.config import settings

logger = logging.getLogger("app.core.cache")

T = TypeVar("T")

_PREFIX = settings.REDIS_PREFIX


def _redis_url() -> str:
    return settings.REDIS_URL


class RedisCache:
    """Async facade over the Redis client shared by all modules."""

    def __init__(self) -> None:
        self._client = None
        self._available: Optional[bool] = None

    async def _get_client(self):
        if self._client is None:
            from redis.asyncio import Redis, ConnectionPool

            pool = ConnectionPool.from_url(
                _redis_url(),
                decode_responses=True,
                max_connections=10,
                socket_connect_timeout=1,
                socket_timeout=1,
            )
            self._client = Redis(connection_pool=pool)
        return self._client

    @staticmethod
    def _key(namespace: str, key: str) -> str:
        return f"{_PREFIX}:{namespace}:{key}"

    @staticmethod
    def _encode(value: Any) -> Optional[str]:
        if value is None:
            return None
        try:
            return json.dumps(value, default=str)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _decode(raw: Optional[str]) -> Any:
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except (TypeError, ValueError, json.JSONDecodeError):
            return None

    async def get(self, namespace: str, key: str) -> Any:
        if not settings.REDIS_CACHE_ENABLED:
            return None
        try:
            client = await self._get_client()
            raw = await client.get(self._key(namespace, key))
            return self._decode(raw)
        except Exception as exc:  # noqa: BLE001
            self._mark_unavailable(exc)
            return None

    async def set(self, namespace: str, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        if not settings.REDIS_CACHE_ENABLED:
            return False
        encoded = self._encode(value)
        if encoded is None:
            return False
        try:
            client = await self._get_client()
            await client.set(
                self._key(namespace, key),
                encoded,
                ex=ttl if ttl is not None else settings.REDIS_CACHE_TTL_SECONDS,
            )
            return True
        except Exception as exc:  # noqa: BLE001
            self._mark_unavailable(exc)
            return False

    async def delete(self, namespace: str, key: str) -> bool:
        if not settings.REDIS_CACHE_ENABLED:
            return False
        try:
            client = await self._get_client()
            return bool(await client.delete(self._key(namespace, key)))
        except Exception as exc:  # noqa: BLE001
            self._mark_unavailable(exc)
            return False

    async def delete_pattern(self, namespace: str, pattern: str) -> int:
        """Delete every key matching ``namespace:pattern`` (e.g. ``page:*``).

        Used to invalidate a whole family of keys after a write.
        """
        if not settings.REDIS_CACHE_ENABLED:
            return 0
        try:
            client = await self._get_client()
            scan = client.scan_iter(match=f"{_PREFIX}:{namespace}:{pattern}", count=500)
            keys = [k async for k in scan]
            if keys:
                return int(await client.delete(*keys))
            return 0
        except Exception as exc:  # noqa: BLE001
            self._mark_unavailable(exc)
            return 0

    async def get_or_set(
        self,
        namespace: str,
        key: str,
        loader: Callable[[], Awaitable[T]],
        ttl: Optional[int] = None,
    ) -> T:
        """Return a cached value or compute it with ``loader`` and cache it.

        ``loader`` failures propagate (the cache never hides the source
        error); only the cache itself degrades silently.
        """
        cached = await self.get(namespace, key)
        if cached is not None:
            return cached
        value = await loader()
        await self.set(namespace, key, value, ttl)
        return value

    async def ping(self) -> bool:
        """Used by health checks; returns False when Redis is unreachable."""
        try:
            client = await self._get_client()
            return bool(await client.ping())
        except Exception:  # noqa: BLE001
            return False

    async def close(self) -> None:
        if self._client is not None:
            try:
                await self._client.aclose()
            except Exception:  # noqa: BLE001
                pass
            self._client = None

    def _mark_unavailable(self, exc: Exception) -> None:
        """Log the first failure; subsequent failures are quiet."""
        if self._available is not False:
            self._available = False
            logger.warning("Redis cache unavailable; degrading gracefully: %s", exc)


# Shared singleton. Services import this instead of constructing their own
# client so connection count stays bounded.
cache = RedisCache()
