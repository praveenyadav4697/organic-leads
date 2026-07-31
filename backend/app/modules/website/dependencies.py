from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.website.service import WebsiteService


async def get_website_service(db: AsyncSession = Depends(get_db)) -> WebsiteService:
    return WebsiteService(db)
