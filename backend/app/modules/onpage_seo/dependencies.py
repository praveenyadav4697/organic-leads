from __future__ import annotations

from typing import Annotated, AsyncIterator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.onpage_seo.service import OnPageSEOService


async def get_onpage_seo_service(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AsyncIterator[OnPageSEOService]:
    """Yield an :class:`OnPageSEOService` for one request.

    Follows the same dependency pattern as ``search_console/dependencies.py``.
    """
    service = OnPageSEOService(db)
    try:
        yield service
    finally:
        pass