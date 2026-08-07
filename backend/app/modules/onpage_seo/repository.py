from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, desc, asc
import uuid

from app.shared.repositories.base_repository import BaseRepository
from app.modules.onpage_seo.models import (
    SEOPage,
    SEOAuditFinding,
    SEOKeyword,
    SEMetaTag,
    SEHeading,
    SEContent,
    SEImage,
    SEInternalLink,
    SEExternalLink,
    SECanonical,
    SERobots,
    SESitemap,
    SESchema,
    SEAnswerReadiness,
    SERecommendation,
    SEOHistoryEntry,
    SEOLogsEntry,
    SEOCrawlJob,
)


class SEOPageRepository(BaseRepository[SEOPage]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEOPage, db)

    async def get_by_website(self, website_id: str, skip: int = 0, limit: int = 100,
                             status: Optional[str] = None, sort_by: str = "seo_score",
                             sort_order: str = "desc") -> Tuple[List[SEOPage], int]:
        query = select(SEOPage).where(SEOPage.website_id == website_id)
        count_query = select(func.count()).select_from(SEOPage).where(SEOPage.website_id == website_id)

        if status:
            query = query.where(SEOPage.status == status)
            count_query = count_query.where(SEOPage.status == status)

        order_col = getattr(SEOPage, sort_by, SEOPage.seo_score)
        if sort_order == "asc":
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))

        query = query.offset(skip).limit(limit)

        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        items = result.scalars().all()
        total = total_result.scalar_one()
        return items, total

    async def get_by_url(self, website_id: str, url: str) -> Optional[SEOPage]:
        result = await self.db.execute(
            select(SEOPage).where(SEOPage.website_id == website_id, SEOPage.url == url)
        )
        return result.scalar_one_or_none()

    async def get_by_path(self, website_id: str, path: str) -> Optional[SEOPage]:
        result = await self.db.execute(
            select(SEOPage).where(SEOPage.website_id == website_id, SEOPage.path == path)
        )
        return result.scalar_one_or_none()


class SEOAuditFindingRepository(BaseRepository[SEOAuditFinding]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEOAuditFinding, db)

    async def get_by_page(self, page_id: uuid.UUID, skip: int = 0, limit: int = 100,
                          severity: Optional[str] = None, status: Optional[str] = None,
                          category: Optional[str] = None) -> Tuple[List[SEOAuditFinding], int]:
        query = select(SEOAuditFinding).where(SEOAuditFinding.page_id == page_id)
        count_query = select(func.count()).select_from(SEOAuditFinding).where(SEOAuditFinding.page_id == page_id)

        if severity:
            query = query.where(SEOAuditFinding.severity == severity)
            count_query = count_query.where(SEOAuditFinding.severity == severity)
        if status:
            query = query.where(SEOAuditFinding.status == status)
            count_query = count_query.where(SEOAuditFinding.status == status)
        if category:
            query = query.where(SEOAuditFinding.category == category)
            count_query = count_query.where(SEOAuditFinding.category == category)

        query = query.order_by(desc(SEOAuditFinding.created_at)).offset(skip).limit(limit)

        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        items = result.scalars().all()
        total = total_result.scalar_one()
        return items, total

    async def get_by_page_and_category(self, page_id: uuid.UUID, category: str) -> List[SEOAuditFinding]:
        result = await self.db.execute(
            select(SEOAuditFinding)
            .where(SEOAuditFinding.page_id == page_id, SEOAuditFinding.category == category)
            .order_by(desc(SEOAuditFinding.created_at))
        )
        return result.scalars().all()


class SEOKeywordRepository(BaseRepository[SEOKeyword]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEOKeyword, db)

    async def get_by_page(self, page_id: uuid.UUID) -> List[SEOKeyword]:
        result = await self.db.execute(
            select(SEOKeyword).where(SEOKeyword.page_id == page_id).order_by(desc(SEOKeyword.created_at))
        )
        return result.scalars().all()


class SEMetaTagRepository(BaseRepository[SEMetaTag]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEMetaTag, db)

    async def get_by_page(self, page_id: uuid.UUID) -> List[SEMetaTag]:
        result = await self.db.execute(
            select(SEMetaTag).where(SEMetaTag.page_id == page_id).order_by(desc(SEMetaTag.created_at))
        )
        return result.scalars().all()


class SEHeadingRepository(BaseRepository[SEHeading]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEHeading, db)

    async def get_by_page(self, page_id: uuid.UUID) -> List[SEHeading]:
        result = await self.db.execute(
            select(SEHeading).where(SEHeading.page_id == page_id).order_by(SEHeading.position)
        )
        return result.scalars().all()


class SEContentRepository(BaseRepository[SEContent]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEContent, db)

    async def get_by_page(self, page_id: uuid.UUID) -> Optional[SEContent]:
        result = await self.db.execute(
            select(SEContent).where(SEContent.page_id == page_id)
        )
        return result.scalar_one_or_none()


class SEImageRepository(BaseRepository[SEImage]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEImage, db)

    async def get_by_page(self, page_id: uuid.UUID) -> List[SEImage]:
        result = await self.db.execute(
            select(SEImage).where(SEImage.page_id == page_id).order_by(desc(SEImage.created_at))
        )
        return result.scalars().all()


class SEInternalLinkRepository(BaseRepository[SEInternalLink]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEInternalLink, db)

    async def get_by_page(self, page_id: uuid.UUID) -> List[SEInternalLink]:
        result = await self.db.execute(
            select(SEInternalLink).where(SEInternalLink.page_id == page_id).order_by(desc(SEInternalLink.created_at))
        )
        return result.scalars().all()


class SEExternalLinkRepository(BaseRepository[SEExternalLink]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEExternalLink, db)

    async def get_by_page(self, page_id: uuid.UUID) -> List[SEExternalLink]:
        result = await self.db.execute(
            select(SEExternalLink).where(SEExternalLink.page_id == page_id).order_by(desc(SEExternalLink.created_at))
        )
        return result.scalars().all()


class SECanonicalRepository(BaseRepository[SECanonical]):
    def __init__(self, db: AsyncSession):
        super().__init__(SECanonical, db)

    async def get_by_page(self, page_id: uuid.UUID) -> Optional[SECanonical]:
        result = await self.db.execute(
            select(SECanonical).where(SECanonical.page_id == page_id)
        )
        return result.scalar_one_or_none()


class SERobotsRepository(BaseRepository[SERobots]):
    def __init__(self, db: AsyncSession):
        super().__init__(SERobots, db)

    async def get_by_page(self, page_id: uuid.UUID) -> Optional[SERobots]:
        result = await self.db.execute(
            select(SERobots).where(SERobots.page_id == page_id)
        )
        return result.scalar_one_or_none()


class SESitemapRepository(BaseRepository[SESitemap]):
    def __init__(self, db: AsyncSession):
        super().__init__(SESitemap, db)

    async def get_by_page(self, page_id: uuid.UUID) -> Optional[SESitemap]:
        result = await self.db.execute(
            select(SESitemap).where(SESitemap.page_id == page_id)
        )
        return result.scalar_one_or_none()


class SESchemaRepository(BaseRepository[SESchema]):
    def __init__(self, db: AsyncSession):
        super().__init__(SESchema, db)

    async def get_by_page(self, page_id: uuid.UUID) -> List[SESchema]:
        result = await self.db.execute(
            select(SESchema).where(SESchema.page_id == page_id).order_by(desc(SESchema.created_at))
        )
        return result.scalars().all()


class SEAnswerReadinessRepository(BaseRepository[SEAnswerReadiness]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEAnswerReadiness, db)

    async def get_by_page(self, page_id: uuid.UUID) -> Optional[SEAnswerReadiness]:
        result = await self.db.execute(
            select(SEAnswerReadiness).where(SEAnswerReadiness.page_id == page_id)
        )
        return result.scalar_one_or_none()


class SERecommendationRepository(BaseRepository[SERecommendation]):
    def __init__(self, db: AsyncSession):
        super().__init__(SERecommendation, db)

    async def get_by_page(self, page_id: uuid.UUID, status: Optional[str] = None) -> List[SERecommendation]:
        query = select(SERecommendation).where(SERecommendation.page_id == page_id)
        if status:
            query = query.where(SERecommendation.status == status)
        query = query.order_by(desc(SERecommendation.priority), desc(SERecommendation.created_at))
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_pending(self, limit: int = 50) -> List[SERecommendation]:
        result = await self.db.execute(
            select(SERecommendation)
            .where(SERecommendation.status == "pending")
            .order_by(SERecommendation.priority, SERecommendation.created_at)
            .limit(limit)
        )
        return result.scalars().all()


class SEOHistoryRepository(BaseRepository[SEOHistoryEntry]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEOHistoryEntry, db)

    async def get_by_page(self, page_id: uuid.UUID, skip: int = 0, limit: int = 50) -> Tuple[List[SEOHistoryEntry], int]:
        query = select(SEOHistoryEntry).where(SEOHistoryEntry.page_id == page_id).order_by(desc(SEOHistoryEntry.started_at))
        count_query = select(func.count()).select_from(SEOHistoryEntry).where(SEOHistoryEntry.page_id == page_id)
        result = await self.db.execute(query.offset(skip).limit(limit))
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()


class SEOLogsRepository(BaseRepository[SEOLogsEntry]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEOLogsEntry, db)

    async def get_by_page(self, page_id: uuid.UUID, skip: int = 0, limit: int = 100,
                          log_type: Optional[str] = None) -> Tuple[List[SEOLogsEntry], int]:
        query = select(SEOLogsEntry).where(SEOLogsEntry.page_id == page_id).order_by(desc(SEOLogsEntry.timestamp))
        count_query = select(func.count()).select_from(SEOLogsEntry).where(SEOLogsEntry.page_id == page_id)

        if log_type:
            query = query.where(SEOLogsEntry.type == log_type)
            count_query = count_query.where(SEOLogsEntry.type == log_type)

        result = await self.db.execute(query.offset(skip).limit(limit))
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def get_by_website(self, website_id: str, skip: int = 0, limit: int = 100,
                             log_type: Optional[str] = None) -> Tuple[List[SEOLogsEntry], int]:
        query = (
            select(SEOLogsEntry)
            .join(SEOPage, SEOLogsEntry.page_id == SEOPage.id)
            .where(SEOPage.website_id == website_id)
            .order_by(desc(SEOLogsEntry.timestamp))
        )
        count_query = (
            select(func.count())
            .select_from(SEOLogsEntry)
            .join(SEOPage, SEOLogsEntry.page_id == SEOPage.id)
            .where(SEOPage.website_id == website_id)
        )

        if log_type:
            query = query.where(SEOLogsEntry.type == log_type)
            count_query = count_query.where(SEOLogsEntry.type == log_type)

        result = await self.db.execute(query.offset(skip).limit(limit))
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()


class SEOCrawlJobRepository(BaseRepository[SEOCrawlJob]):
    def __init__(self, db: AsyncSession):
        super().__init__(SEOCrawlJob, db)

    async def get_by_website(
        self, website_id: str, skip: int = 0, limit: int = 50, status: Optional[str] = None
    ) -> Tuple[List[SEOCrawlJob], int]:
        query = select(SEOCrawlJob).where(SEOCrawlJob.website_id == website_id)
        count_query = select(func.count()).select_from(SEOCrawlJob).where(SEOCrawlJob.website_id == website_id)

        if status:
            query = query.where(SEOCrawlJob.status == status)
            count_query = count_query.where(SEOCrawlJob.status == status)

        query = query.order_by(desc(SEOCrawlJob.started_at)).offset(skip).limit(limit)

        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def get_latest_by_website(self, website_id: str) -> Optional[SEOCrawlJob]:
        result = await self.db.execute(
            select(SEOCrawlJob)
            .where(SEOCrawlJob.website_id == website_id)
            .order_by(desc(SEOCrawlJob.started_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_running_jobs(self, limit: int = 20) -> List[SEOCrawlJob]:
        from app.modules.onpage_seo.models import CrawlStatusEnum

        result = await self.db.execute(
            select(SEOCrawlJob)
            .where(SEOCrawlJob.status.in_([CrawlStatusEnum.queued, CrawlStatusEnum.running]))
            .order_by(SEOCrawlJob.started_at)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_job(self, obj_in: Dict[str, Any]) -> SEOCrawlJob:
        return await self.create(obj_in)