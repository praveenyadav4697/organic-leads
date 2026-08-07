from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, desc, asc
import uuid

from app.shared.repositories.base_repository import BaseRepository
from app.modules.search_console.models import (
    SearchConsoleProperty,
    SearchConsoleCredential,
    UrlInspectionResult,
    SearchConsoleSitemap,
    SearchConsoleManualAction,
    SearchConsoleCrawlError,
    SearchConsoleEnhancement,
    SearchConsolePerformanceReport,
    SearchConsoleAuditLog,
    SearchConsoleSyncJob,
    SearchConsoleAlert,
    AlertStatusEnum,
    AlertTypeEnum,
    AlertSeverityEnum,
)


class SearchConsolePropertyRepository(BaseRepository[SearchConsoleProperty]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleProperty, db)

    async def get_by_property_id(self, property_id: str) -> Optional[SearchConsoleProperty]:
        result = await self.db.execute(
            select(SearchConsoleProperty).where(SearchConsoleProperty.property_id == property_id)
        )
        return result.scalar_one_or_none()

    async def get_by_site_url(self, site_url: str) -> Optional[SearchConsoleProperty]:
        result = await self.db.execute(
            select(SearchConsoleProperty).where(SearchConsoleProperty.site_url == site_url)
        )
        return result.scalar_one_or_none()

    async def get_by_property_id_or_site_url(self, identifier: str) -> Optional[SearchConsoleProperty]:
        result = await self.db.execute(
            select(SearchConsoleProperty).where(
                (SearchConsoleProperty.property_id == identifier) |
                (SearchConsoleProperty.site_url == identifier)
            )
        )
        return result.scalar_one_or_none()

    async def list_paginated(
        self,
        skip: int = 0,
        limit: int = 100,
        connection_status: Optional[str] = None,
    ) -> tuple[List[SearchConsoleProperty], int]:
        query = select(SearchConsoleProperty)
        count_query = select(func.count()).select_from(SearchConsoleProperty)

        if connection_status:
            query = query.where(SearchConsoleProperty.connection_status == connection_status)
            count_query = count_query.where(SearchConsoleProperty.connection_status == connection_status)

        query = query.order_by(desc(SearchConsoleProperty.created_at)).offset(skip).limit(limit)

        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        items = result.scalars().all()
        total = total_result.scalar_one()
        return items, total


class SearchConsoleCredentialRepository(BaseRepository[SearchConsoleCredential]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleCredential, db)

    async def get_by_property(self, property_id: uuid.UUID) -> Optional[SearchConsoleCredential]:
        result = await self.db.execute(
            select(SearchConsoleCredential)
            .where(SearchConsoleCredential.property_id == property_id)
            .order_by(desc(SearchConsoleCredential.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_active_by_property(self, property_id: uuid.UUID) -> Optional[SearchConsoleCredential]:
        result = await self.db.execute(
            select(SearchConsoleCredential)
            .where(
                SearchConsoleCredential.property_id == property_id,
                SearchConsoleCredential.is_revoked.is_(False),
            )
            .order_by(desc(SearchConsoleCredential.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_credential(self, obj_in: Dict[str, Any]) -> SearchConsoleCredential:
        return await self.create(obj_in)

    async def revoke(self, credential_id: uuid.UUID) -> bool:
        await self.db.execute(
            delete(SearchConsoleCredential).where(SearchConsoleCredential.id == credential_id)
        )
        return True


class UrlInspectionResultRepository(BaseRepository[UrlInspectionResult]):
    def __init__(self, db: AsyncSession):
        super().__init__(UrlInspectionResult, db)

    async def get_by_property(self, property_id: Any, skip: int = 0, limit: int = 100) -> tuple[List[UrlInspectionResult], int]:
        query = (
            select(UrlInspectionResult)
            .where(UrlInspectionResult.property_id == property_id)
            .order_by(desc(UrlInspectionResult.inspected_at))
            .offset(skip)
            .limit(limit)
        )
        count_query = select(func.count()).select_from(UrlInspectionResult).where(UrlInspectionResult.property_id == property_id)
        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        items = result.scalars().all()
        total = total_result.scalar_one()
        return items, total

    async def get_by_url(self, property_id: Any, inspected_url: str) -> Optional[UrlInspectionResult]:
        result = await self.db.execute(
            select(UrlInspectionResult)
            .where(
                UrlInspectionResult.property_id == property_id,
                UrlInspectionResult.inspected_url == inspected_url,
            )
            .order_by(desc(UrlInspectionResult.inspected_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_inspection(self, obj_in: Dict[str, Any]) -> UrlInspectionResult:
        return await self.create(obj_in)


class SearchConsoleSitemapRepository(BaseRepository[SearchConsoleSitemap]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleSitemap, db)

    async def get_by_property(
        self, property_id: Any, skip: int = 0, limit: int = 100
    ) -> tuple[List[SearchConsoleSitemap], int]:
        query = (
            select(SearchConsoleSitemap)
            .where(SearchConsoleSitemap.property_id == property_id)
            .order_by(desc(SearchConsoleSitemap.updated_at))
            .offset(skip)
            .limit(limit)
        )
        count_query = (
            select(func.count())
            .select_from(SearchConsoleSitemap)
            .where(SearchConsoleSitemap.property_id == property_id)
        )
        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def get_by_path(self, property_id: Any, path: str) -> Optional[SearchConsoleSitemap]:
        result = await self.db.execute(
            select(SearchConsoleSitemap)
            .where(
                SearchConsoleSitemap.property_id == property_id,
                SearchConsoleSitemap.path == path,
            )
            .order_by(desc(SearchConsoleSitemap.updated_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_sitemap(self, obj_in: Dict[str, Any]) -> SearchConsoleSitemap:
        return await self.create(obj_in)

    async def delete_by_property(self, property_id: Any) -> None:
        await self.db.execute(
            delete(SearchConsoleSitemap).where(SearchConsoleSitemap.property_id == property_id)
        )


class SearchConsoleManualActionRepository(BaseRepository[SearchConsoleManualAction]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleManualAction, db)

    async def get_by_property(
        self, property_id: Any, skip: int = 0, limit: int = 100
    ) -> tuple[List[SearchConsoleManualAction], int]:
        query = (
            select(SearchConsoleManualAction)
            .where(SearchConsoleManualAction.property_id == property_id)
            .order_by(desc(SearchConsoleManualAction.created_at))
            .offset(skip)
            .limit(limit)
        )
        count_query = (
            select(func.count())
            .select_from(SearchConsoleManualAction)
            .where(SearchConsoleManualAction.property_id == property_id)
        )
        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def create_manual_action(self, obj_in: Dict[str, Any]) -> SearchConsoleManualAction:
        return await self.create(obj_in)

    async def delete_by_property(self, property_id: Any) -> None:
        await self.db.execute(
            delete(SearchConsoleManualAction).where(SearchConsoleManualAction.property_id == property_id)
        )


class SearchConsoleCrawlErrorRepository(BaseRepository[SearchConsoleCrawlError]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleCrawlError, db)

    async def get_by_property(
        self, property_id: Any, skip: int = 0, limit: int = 100, error_type: Optional[str] = None
    ) -> tuple[List[SearchConsoleCrawlError], int]:
        query = (
            select(SearchConsoleCrawlError)
            .where(SearchConsoleCrawlError.property_id == property_id)
            .order_by(desc(SearchConsoleCrawlError.detected_at))
            .offset(skip)
            .limit(limit)
        )
        count_query = (
            select(func.count())
            .select_from(SearchConsoleCrawlError)
            .where(SearchConsoleCrawlError.property_id == property_id)
        )
        if error_type:
            query = query.where(SearchConsoleCrawlError.error_type == error_type)
            count_query = count_query.where(SearchConsoleCrawlError.error_type == error_type)

        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def create_crawl_error(self, obj_in: Dict[str, Any]) -> SearchConsoleCrawlError:
        return await self.create(obj_in)

    async def delete_by_property(self, property_id: Any) -> None:
        await self.db.execute(
            delete(SearchConsoleCrawlError).where(SearchConsoleCrawlError.property_id == property_id)
        )


class SearchConsoleEnhancementRepository(BaseRepository[SearchConsoleEnhancement]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleEnhancement, db)

    async def get_by_property(self, property_id: Any) -> List[SearchConsoleEnhancement]:
        result = await self.db.execute(
            select(SearchConsoleEnhancement)
            .where(SearchConsoleEnhancement.property_id == property_id)
            .order_by(desc(SearchConsoleEnhancement.updated_at))
        )
        return result.scalars().all()

    async def get_by_type(self, property_id: Any, enhancement_type: str) -> Optional[SearchConsoleEnhancement]:
        result = await self.db.execute(
            select(SearchConsoleEnhancement)
            .where(
                SearchConsoleEnhancement.property_id == property_id,
                SearchConsoleEnhancement.enhancement_type == enhancement_type,
            )
            .order_by(desc(SearchConsoleEnhancement.updated_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_or_update(self, obj_in: Dict[str, Any]) -> SearchConsoleEnhancement:
        existing = await self.get_by_type(obj_in["property_id"], obj_in["enhancement_type"])
        if existing:
            await self.update(existing.id, obj_in)
            return await self.get(existing.id)
        return await self.create(obj_in)


class SearchConsolePerformanceReportRepository(BaseRepository[SearchConsolePerformanceReport]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsolePerformanceReport, db)

    async def get_by_property(
        self, property_id: Any, skip: int = 0, limit: int = 100
    ) -> tuple[List[SearchConsolePerformanceReport], int]:
        query = (
            select(SearchConsolePerformanceReport)
            .where(SearchConsolePerformanceReport.property_id == property_id)
            .order_by(desc(SearchConsolePerformanceReport.created_at))
            .offset(skip)
            .limit(limit)
        )
        count_query = (
            select(func.count())
            .select_from(SearchConsolePerformanceReport)
            .where(SearchConsolePerformanceReport.property_id == property_id)
        )
        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def get_latest_by_property(self, property_id: Any) -> Optional[SearchConsolePerformanceReport]:
        result = await self.db.execute(
            select(SearchConsolePerformanceReport)
            .where(SearchConsolePerformanceReport.property_id == property_id)
            .order_by(desc(SearchConsolePerformanceReport.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def create_report(self, obj_in: Dict[str, Any]) -> SearchConsolePerformanceReport:
        return await self.create(obj_in)


class SearchConsoleAuditLogRepository(BaseRepository[SearchConsoleAuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleAuditLog, db)

    async def get_by_property(
        self, property_id: Any, skip: int = 0, limit: int = 100
    ) -> tuple[List[SearchConsoleAuditLog], int]:
        query = (
            select(SearchConsoleAuditLog)
            .where(SearchConsoleAuditLog.property_id == property_id)
            .order_by(desc(SearchConsoleAuditLog.created_at))
            .offset(skip)
            .limit(limit)
        )
        count_query = (
            select(func.count())
            .select_from(SearchConsoleAuditLog)
            .where(SearchConsoleAuditLog.property_id == property_id)
        )
        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def create_log(self, obj_in: Dict[str, Any]) -> SearchConsoleAuditLog:
        return await self.create(obj_in)


class SearchConsoleSyncJobRepository(BaseRepository[SearchConsoleSyncJob]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleSyncJob, db)

    async def get_by_property(
        self, property_id: Any, skip: int = 0, limit: int = 100, status: Optional[str] = None
    ) -> tuple[List[SearchConsoleSyncJob], int]:
        query = (
            select(SearchConsoleSyncJob)
            .where(SearchConsoleSyncJob.property_id == property_id)
            .order_by(desc(SearchConsoleSyncJob.started_at))
            .offset(skip)
            .limit(limit)
        )
        count_query = (
            select(func.count())
            .select_from(SearchConsoleSyncJob)
            .where(SearchConsoleSyncJob.property_id == property_id)
        )
        if status:
            query = query.where(SearchConsoleSyncJob.status == status)
            count_query = count_query.where(SearchConsoleSyncJob.status == status)

        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def get_latest_by_property(self, property_id: Any) -> Optional[SearchConsoleSyncJob]:
        result = await self.db.execute(
            select(SearchConsoleSyncJob)
            .where(SearchConsoleSyncJob.property_id == property_id)
            .order_by(desc(SearchConsoleSyncJob.started_at))
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_pending_jobs(self, limit: int = 50) -> List[SearchConsoleSyncJob]:
        from app.modules.search_console.models import SyncStatusEnum
        result = await self.db.execute(
            select(SearchConsoleSyncJob)
            .where(SearchConsoleSyncJob.status.in_([SyncStatusEnum.queued, SyncStatusEnum.running]))
            .order_by(SearchConsoleSyncJob.started_at)
            .limit(limit)
        )
        return result.scalars().all()

    async def create_job(self, obj_in: Dict[str, Any]) -> SearchConsoleSyncJob:
        return await self.create(obj_in)


class SearchConsoleAlertRepository(BaseRepository[SearchConsoleAlert]):
    def __init__(self, db: AsyncSession):
        super().__init__(SearchConsoleAlert, db)

    async def get_open_by_type(
        self,
        alert_type: Any,
        property_id: Any = None,
    ) -> Optional[SearchConsoleAlert]:
        """Return the open alert for a type/property pair (dedup key)."""
        query = (
            select(SearchConsoleAlert)
            .where(SearchConsoleAlert.alert_type == alert_type)
            .where(SearchConsoleAlert.status == AlertStatusEnum.open)
        )
        if property_id is not None:
            query = query.where(SearchConsoleAlert.property_id == property_id)
        result = await self.db.execute(query.order_by(desc(SearchConsoleAlert.created_at)).limit(1))
        return result.scalar_one_or_none()

    async def create_alert(
        self,
        alert_type: AlertTypeEnum,
        severity: AlertSeverityEnum,
        title: str,
        message: str,
        property_id: Any = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> SearchConsoleAlert:
        """Dedup-aware alert creation.

        While an alert with the same ``(property_id, alert_type)`` is still
        ``open``, the existing alert is refreshed (message + occurrence
        count) instead of inserting a duplicate row.
        """
        now = datetime.utcnow()
        existing = await self.get_open_by_type(alert_type, property_id)
        if existing is not None:
            existing.alert_type = alert_type
            existing.severity = severity
            existing.title = title
            existing.message = message
            existing.occurrence_count += 1
            if details:
                existing.details = {**(existing.details or {}), **details}
            existing.updated_at = now
            await self.db.commit()
            await self.db.refresh(existing)
            return existing

        alert = await self.create({
            "property_id": property_id,
            "alert_type": alert_type,
            "severity": severity,
            "title": title,
            "message": message,
            "status": AlertStatusEnum.open,
            "occurrence_count": 1,
            "details": details or {},
        })
        await self.db.commit()
        await self.db.refresh(alert)
        return alert

    async def list_alerts(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        alert_type: Optional[str] = None,
        property_id: Any = None,
    ) -> tuple[List[SearchConsoleAlert], int]:
        query = select(SearchConsoleAlert).order_by(desc(SearchConsoleAlert.created_at))
        count_query = select(func.count()).select_from(SearchConsoleAlert)
        if status:
            query = query.where(SearchConsoleAlert.status == status)
            count_query = count_query.where(SearchConsoleAlert.status == status)
        if alert_type:
            query = query.where(SearchConsoleAlert.alert_type == alert_type)
            count_query = count_query.where(SearchConsoleAlert.alert_type == alert_type)
        if property_id is not None:
            query = query.where(SearchConsoleAlert.property_id == property_id)
            count_query = count_query.where(SearchConsoleAlert.property_id == property_id)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        total_result = await self.db.execute(count_query)
        return result.scalars().all(), total_result.scalar_one()

    async def list_open(self, limit: int = 100) -> List[SearchConsoleAlert]:
        result = await self.db.execute(
            select(SearchConsoleAlert)
            .where(SearchConsoleAlert.status == AlertStatusEnum.open)
            .order_by(desc(SearchConsoleAlert.created_at))
            .limit(limit)
        )
        return result.scalars().all()

    async def update_status(
        self,
        alert_id: Any,
        status: AlertStatusEnum,
        actor: str,
        resolved: bool = False,
    ) -> Optional[SearchConsoleAlert]:
        alert = await self.get(alert_id)
        if alert is None:
            return None
        alert.status = status
        if resolved:
            alert.resolved_at = datetime.utcnow()
        else:
            from app.modules.search_console.models import AlertStatusEnum as _ASE
            if status == _ASE.acknowledged:
                alert.acknowledged_by = actor
                alert.acknowledged_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(alert)
        return alert
