import pytest
import uuid
from datetime import datetime, timezone

from app.modules.search_console.repository import (
    SearchConsolePropertyRepository,
    SearchConsoleCredentialRepository,
    UrlInspectionResultRepository,
    SearchConsoleSitemapRepository,
    SearchConsoleManualActionRepository,
    SearchConsoleCrawlErrorRepository,
    SearchConsoleEnhancementRepository,
    SearchConsolePerformanceReportRepository,
    SearchConsoleAuditLogRepository,
    SearchConsoleSyncJobRepository,
)
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
    PropertyTypeEnum,
    PermissionLevelEnum,
    SiteOwnershipEnum,
    ConnectionStatusEnum,
    SyncStatusEnum,
)


@pytest.mark.asyncio
async def test_get_by_property_id(db_session, test_property):
    repo = SearchConsolePropertyRepository(db_session)
    result = await repo.get_by_property_id(test_property.property_id)
    assert result is not None
    assert result.id == test_property.id


@pytest.mark.asyncio
async def test_get_by_site_url(db_session, test_property):
    repo = SearchConsolePropertyRepository(db_session)
    result = await repo.get_by_site_url(test_property.site_url)
    assert result is not None
    assert result.id == test_property.id


@pytest.mark.asyncio
async def test_get_by_property_id_or_site_url(db_session, test_property):
    repo = SearchConsolePropertyRepository(db_session)
    result1 = await repo.get_by_property_id_or_site_url(test_property.property_id)
    result2 = await repo.get_by_property_id_or_site_url(test_property.site_url)
    assert result1 is not None and result1.id == test_property.id
    assert result2 is not None and result2.id == test_property.id


@pytest.mark.asyncio
async def test_list_paginated(db_session, test_property):
    repo = SearchConsolePropertyRepository(db_session)
    items, total = await repo.list_paginated(skip=0, limit=10)
    assert total >= 1
    assert len(items) >= 1


@pytest.mark.asyncio
async def test_list_paginated_with_filter(db_session, test_property):
    repo = SearchConsolePropertyRepository(db_session)
    items, total = await repo.list_paginated(
        skip=0, limit=10, connection_status="connected"
    )
    assert all(p.connection_status == ConnectionStatusEnum.connected for p in items)


@pytest.mark.asyncio
async def test_get_or_create_credential(db_session, test_property):
    repo = SearchConsoleCredentialRepository(db_session)
    cred = await repo.create({
        "property_id": test_property.id,
        "encrypted_access_token": "enc_access",
        "encrypted_refresh_token": "enc_refresh",
        "token_type": "Bearer",
        "scope": "webmasters",
        "expires_at": datetime.now(timezone.utc),
    })
    await db_session.commit()

    fetched = await repo.get_by_property(test_property.id)
    assert fetched is not None
    assert fetched.encrypted_access_token == "enc_access"

    active = await repo.get_active_by_property(test_property.id)
    assert active is not None
    assert active.is_revoked is False


@pytest.mark.asyncio
async def test_inspection_repo_create_and_get(db_session, test_property):
    repo = UrlInspectionResultRepository(db_session)
    result = await repo.create({
        "property_id": test_property.id,
        "inspected_url": "https://example.com/page1",
        "coverage_status": "indexed",
    })
    await db_session.commit()

    fetched = await repo.get_by_url(test_property.id, "https://example.com/page1")
    assert fetched is not None
    assert fetched.coverage_status == "indexed"

    history = await repo.get_by_property(test_property.id)
    assert len(history) >= 1


@pytest.mark.asyncio
async def test_sitemap_repo_pagination(db_session, test_property):
    repo = SearchConsoleSitemapRepository(db_session)
    await repo.create({
        "property_id": test_property.id,
        "site_url": "https://example.com",
        "type": "sitemap",
        "is_pending_sitemap": False,
    })
    await db_session.commit()

    items, total = await repo.get_by_property(test_property.id, skip=0, limit=10)
    assert total >= 1
    assert len(items) >= 1


@pytest.mark.asyncio
async def test_manual_action_repo(db_session, test_property):
    repo = SearchConsoleManualActionRepository(db_session)
    await repo.create({
        "property_id": test_property.id,
        "action_type": "spam",
        "action_reason": "spam content",
        "is_partial": True,
        "resolution": "pending",
    })
    await db_session.commit()

    items, total = await repo.get_by_property(test_property.id)
    assert total >= 1


@pytest.mark.asyncio
async def test_crawl_error_repo(db_session, test_property):
    repo = SearchConsoleCrawlErrorRepository(db_session)
    await repo.create({
        "property_id": test_property.id,
        "platform": "web",
        "error_type": "serverError",
        "page_url": "https://example.com/error",
    })
    await db_session.commit()

    items, total = await repo.get_by_property(test_property.id)
    assert total >= 1

    filtered, _ = await repo.get_by_property(test_property.id, error_type="serverError")
    assert len(filtered) >= 1


@pytest.mark.asyncio
async def test_enhancement_repo_create_or_update(db_session, test_property):
    repo = SearchConsoleEnhancementRepository(db_session)
    result = await repo.create_or_update({
        "property_id": test_property.id,
        "enhancement_type": "core_web_vitals",
        "status": "valid",
        "items_count": 0,
    })
    await db_session.commit()
    assert result.enhancement_type == "core_web_vitals"

    updated = await repo.create_or_update({
        "property_id": test_property.id,
        "enhancement_type": "core_web_vitals",
        "status": "error",
        "items_count": 5,
    })
    await db_session.commit()
    assert updated.status == "error"


@pytest.mark.asyncio
async def test_performance_report_repo(db_session, test_property):
    repo = SearchConsolePerformanceReportRepository(db_session)
    report = await repo.create({
        "property_id": test_property.id,
        "start_date": "2024-01-01",
        "end_date": "2024-01-28",
        "dimensions": ["query"],
        "metrics": ["clicks"],
        "total_rows": 10,
        "rows": [],
    })
    await db_session.commit()

    latest = await repo.get_latest_by_property(test_property.id)
    assert latest is not None
    assert latest.total_rows == 10


@pytest.mark.asyncio
async def test_audit_log_repo(db_session, test_property):
    repo = SearchConsoleAuditLogRepository(db_session)
    await repo.create_log({
        "property_id": test_property.id,
        "action": "property_created",
        "actor": "test",
        "status": "success",
    })
    await db_session.commit()

    items, total = await repo.get_by_property(test_property.id)
    assert total >= 1


@pytest.mark.asyncio
async def test_sync_job_repo(db_session, test_property):
    repo = SearchConsoleSyncJobRepository(db_session)
    job = await repo.create({
        "property_id": test_property.id,
        "sync_type": "full",
        "status": SyncStatusEnum.running,
        "started_at": datetime.now(timezone.utc),
    })
    await db_session.commit()

    latest = await repo.get_latest_by_property(test_property.id)
    assert latest is not None
    assert latest.status == SyncStatusEnum.running

    pending = await repo.get_pending_jobs()
    assert len(pending) >= 1
