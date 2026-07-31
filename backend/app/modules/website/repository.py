from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from app.shared.repositories.base_repository import BaseRepository
from app.modules.website.models import (
    Website,
    WebsiteScanHistory,
    WordPressPlugin,
    WordPressTheme,
    WebsiteSSL,
    HostingInformation,
    WebsiteHealth,
    WebsiteDNS,
    WebsiteSecurity,
    WebsiteScreenshot,
    WordPressSync,
    PluginScanLog,
    ThemeScanLog,
    WhoisInformation,
    RobotsInformation,
    SitemapInformation,
    PerformanceInformation,
    MobileInformation,
    SEOInformation,
)
from app.modules.website.schemas import (
    WebsiteCreate,
    WebsiteUpdate,
    WebsiteScanHistoryCreate,
    WordPressPluginCreate,
    WordPressThemeCreate,
)


class WebsiteRepository(BaseRepository[Website]):
    def __init__(self, db: AsyncSession):
        super().__init__(Website, db)

    async def get_by_domain(self, domain: str) -> Optional[Website]:
        result = await self.db.execute(
            select(Website).where(Website.domain == domain)
        )
        return result.scalar_one_or_none()

    async def list_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[Website]:
        result = await self.db.execute(
            select(Website)
            .where(Website.status == status)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_website(self, obj_in: WebsiteCreate) -> Website:
        return await self.create(obj_in.model_dump())

    async def update_website(self, website_id: Any, obj_in: WebsiteUpdate) -> Optional[Website]:
        update_data = obj_in.model_dump(exclude_unset=True)
        if not update_data:
            return await self.get(website_id)
        return await self.update(website_id, update_data)

    async def delete_website(self, website_id: Any) -> bool:
        return await self.delete(website_id)


class WebsiteScanHistoryRepository(BaseRepository[WebsiteScanHistory]):
    def __init__(self, db: AsyncSession):
        super().__init__(WebsiteScanHistory, db)

    async def get_by_website(self, website_id: Any, skip: int = 0, limit: int = 100) -> List[WebsiteScanHistory]:
        result = await self.db.execute(
            select(WebsiteScanHistory)
            .where(WebsiteScanHistory.website_id == website_id)
            .order_by(WebsiteScanHistory.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_scan(self, obj_in: Dict[str, Any]) -> WebsiteScanHistory:
        if hasattr(obj_in, "model_dump"):
            obj_in = obj_in.model_dump()
        return await self.create(obj_in)

    async def get_latest_by_website(self, website_id: Any) -> Optional[WebsiteScanHistory]:
        result = await self.db.execute(
            select(WebsiteScanHistory)
            .where(WebsiteScanHistory.website_id == website_id)
            .order_by(WebsiteScanHistory.created_at.desc())
            .limit(1)
        )
        return result.scalars().first()


class WordPressPluginRepository(BaseRepository[WordPressPlugin]):
    def __init__(self, db: AsyncSession):
        super().__init__(WordPressPlugin, db)

    async def get_by_website(self, website_id: Any) -> List[WordPressPlugin]:
        result = await self.db.execute(
            select(WordPressPlugin).where(WordPressPlugin.website_id == website_id)
        )
        return result.scalars().all()

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(delete(WordPressPlugin).where(WordPressPlugin.website_id == website_id))

    async def create_plugin(self, obj_in: WordPressPluginCreate) -> WordPressPlugin:
        return await self.create(obj_in.model_dump())

    async def bulk_create(self, plugins: List[Dict[str, Any]]) -> List[WordPressPlugin]:
        db_objs = [WordPressPlugin(**p) for p in plugins]
        self.db.add_all(db_objs)
        await self.db.flush()
        for obj in db_objs:
            await self.db.refresh(obj)
        return db_objs


class WordPressThemeRepository(BaseRepository[WordPressTheme]):
    def __init__(self, db: AsyncSession):
        super().__init__(WordPressTheme, db)

    async def get_by_website(self, website_id: Any) -> List[WordPressTheme]:
        result = await self.db.execute(
            select(WordPressTheme).where(WordPressTheme.website_id == website_id)
        )
        return result.scalars().all()

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(delete(WordPressTheme).where(WordPressTheme.website_id == website_id))

    async def create_theme(self, obj_in: WordPressThemeCreate) -> WordPressTheme:
        return await self.create(obj_in.model_dump())

    async def bulk_create(self, themes: List[Dict[str, Any]]) -> List[WordPressTheme]:
        db_objs = [WordPressTheme(**t) for t in themes]
        self.db.add_all(db_objs)
        await self.db.flush()
        for obj in db_objs:
            await self.db.refresh(obj)
        return db_objs


class WebsiteSSLRepository(BaseRepository[WebsiteSSL]):
    def __init__(self, db: AsyncSession):
        super().__init__(WebsiteSSL, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[WebsiteSSL]:
        result = await self.db.execute(
            select(WebsiteSSL)
            .where(WebsiteSSL.website_id == website_id)
            .order_by(WebsiteSSL.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()


class HostingInformationRepository(BaseRepository[HostingInformation]):
    def __init__(self, db: AsyncSession):
        super().__init__(HostingInformation, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[HostingInformation]:
        result = await self.db.execute(
            select(HostingInformation)
            .where(HostingInformation.website_id == website_id)
            .order_by(HostingInformation.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()


class WebsiteHealthRepository(BaseRepository[WebsiteHealth]):
    def __init__(self, db: AsyncSession):
        super().__init__(WebsiteHealth, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[WebsiteHealth]:
        result = await self.db.execute(
            select(WebsiteHealth)
            .where(WebsiteHealth.website_id == website_id)
            .order_by(WebsiteHealth.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()


class WebsiteDNSRepository(BaseRepository[WebsiteDNS]):
    def __init__(self, db: AsyncSession):
        super().__init__(WebsiteDNS, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[WebsiteDNS]:
        result = await self.db.execute(
            select(WebsiteDNS)
            .where(WebsiteDNS.website_id == website_id)
            .order_by(WebsiteDNS.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()


class WebsiteSecurityRepository(BaseRepository[WebsiteSecurity]):
    def __init__(self, db: AsyncSession):
        super().__init__(WebsiteSecurity, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[WebsiteSecurity]:
        result = await self.db.execute(
            select(WebsiteSecurity)
            .where(WebsiteSecurity.website_id == website_id)
            .order_by(WebsiteSecurity.last_scanned_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()


class WebsiteScreenshotRepository(BaseRepository[WebsiteScreenshot]):
    def __init__(self, db: AsyncSession):
        super().__init__(WebsiteScreenshot, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[WebsiteScreenshot]:
        result = await self.db.execute(
            select(WebsiteScreenshot)
            .where(WebsiteScreenshot.website_id == website_id)
            .order_by(WebsiteScreenshot.captured_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_screenshot(self, obj_in: Dict[str, Any]) -> WebsiteScreenshot:
        return await self.create(obj_in)


class WordPressSyncRepository(BaseRepository[WordPressSync]):
    def __init__(self, db: AsyncSession):
        super().__init__(WordPressSync, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[WordPressSync]:
        result = await self.db.execute(
            select(WordPressSync)
            .where(WordPressSync.website_id == website_id)
            .order_by(WordPressSync.synced_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_sync(self, obj_in: Dict[str, Any]) -> WordPressSync:
        return await self.create(obj_in)

    async def get_sync_history(self, website_id: Any, limit: int = 50) -> List[WordPressSync]:
        result = await self.db.execute(
            select(WordPressSync)
            .where(WordPressSync.website_id == website_id)
            .order_by(WordPressSync.synced_at.desc())
            .limit(limit)
        )
        return result.scalars().all()


class PluginScanLogRepository(BaseRepository[PluginScanLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(PluginScanLog, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[PluginScanLog]:
        result = await self.db.execute(
            select(PluginScanLog)
            .where(PluginScanLog.website_id == website_id)
            .order_by(PluginScanLog.started_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_website(self, website_id: Any, limit: int = 20) -> List[PluginScanLog]:
        result = await self.db.execute(
            select(PluginScanLog)
            .where(PluginScanLog.website_id == website_id)
            .order_by(PluginScanLog.started_at.desc())
            .limit(limit)
        )
        return result.scalars().all()


class ThemeScanLogRepository(BaseRepository[ThemeScanLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(ThemeScanLog, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[ThemeScanLog]:
        result = await self.db.execute(
            select(ThemeScanLog)
            .where(ThemeScanLog.website_id == website_id)
            .order_by(ThemeScanLog.started_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_by_website(self, website_id: Any, limit: int = 20) -> List[ThemeScanLog]:
        result = await self.db.execute(
            select(ThemeScanLog)
            .where(ThemeScanLog.website_id == website_id)
            .order_by(ThemeScanLog.started_at.desc())
            .limit(limit)
        )
        return result.scalars().all()


class WhoisInformationRepository(BaseRepository[WhoisInformation]):
    def __init__(self, db: AsyncSession):
        super().__init__(WhoisInformation, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[WhoisInformation]:
        result = await self.db.execute(
            select(WhoisInformation)
            .where(WhoisInformation.website_id == website_id)
            .order_by(WhoisInformation.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_whois(self, obj_in: Dict[str, Any]) -> WhoisInformation:
        return await self.create(obj_in)


class RobotsInformationRepository(BaseRepository[RobotsInformation]):
    def __init__(self, db: AsyncSession):
        super().__init__(RobotsInformation, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[RobotsInformation]:
        result = await self.db.execute(
            select(RobotsInformation)
            .where(RobotsInformation.website_id == website_id)
            .order_by(RobotsInformation.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_robots(self, obj_in: Dict[str, Any]) -> RobotsInformation:
        return await self.create(obj_in)


class SitemapInformationRepository(BaseRepository[SitemapInformation]):
    def __init__(self, db: AsyncSession):
        super().__init__(SitemapInformation, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[SitemapInformation]:
        result = await self.db.execute(
            select(SitemapInformation)
            .where(SitemapInformation.website_id == website_id)
            .order_by(SitemapInformation.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_sitemap(self, obj_in: Dict[str, Any]) -> SitemapInformation:
        return await self.create(obj_in)


class PerformanceInformationRepository(BaseRepository[PerformanceInformation]):
    def __init__(self, db: AsyncSession):
        super().__init__(PerformanceInformation, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[PerformanceInformation]:
        result = await self.db.execute(
            select(PerformanceInformation)
            .where(PerformanceInformation.website_id == website_id)
            .order_by(PerformanceInformation.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_performance(self, obj_in: Dict[str, Any]) -> PerformanceInformation:
        return await self.create(obj_in)


class MobileInformationRepository(BaseRepository[MobileInformation]):
    def __init__(self, db: AsyncSession):
        super().__init__(MobileInformation, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[MobileInformation]:
        result = await self.db.execute(
            select(MobileInformation)
            .where(MobileInformation.website_id == website_id)
            .order_by(MobileInformation.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_mobile(self, obj_in: Dict[str, Any]) -> MobileInformation:
        return await self.create(obj_in)


class SEOInformationRepository(BaseRepository[SEOInformation]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEOInformation, db)

    async def get_latest_by_website(self, website_id: Any) -> Optional[SEOInformation]:
        result = await self.db.execute(
            select(SEOInformation)
            .where(SEOInformation.website_id == website_id)
            .order_by(SEOInformation.checked_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_seo(self, obj_in: Dict[str, Any]) -> SEOInformation:
        return await self.create(obj_in)
