from __future__ import annotations

from typing import Annotated, AsyncIterator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.search_console.service import SearchConsoleService


async def get_search_console_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AsyncIterator[SearchConsoleService]:
    """Yield a :class:`SearchConsoleService` for one request and close its
    shared httpx clients on teardown.

    The previous implementation used ``asyncio.get_event_loop().create_task``
    from a sync ``finally`` block — which silently dropped the cleanup
    coroutine on every request and leaked open keepalive sockets. Run the
    cleanup directly inside the dependency's async exit instead.
    """
    service = SearchConsoleService(db)
    try:
        yield service
    finally:
        try:
            await service.aclose_clients()
        except Exception:
            # Cleanup is best-effort; never break the response cycle.
            pass
