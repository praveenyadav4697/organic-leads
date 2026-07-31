from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.website.repository import WebsiteRepository


async def get_website_repository(db: AsyncSession = Depends(get_db)) -> WebsiteRepository:
    return WebsiteRepository(db)
