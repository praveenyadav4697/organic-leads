import pytest
import uuid
from datetime import datetime, timezone

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
    VerificationMethodEnum,
    ConnectionStatusEnum,
    SyncStatusEnum,
)


@pytest.mark.asyncio
async def test_search_console_property_creation(db_session):
    prop = SearchConsoleProperty(
        property_id="sc-domain:example.com",
        property_name="example.com",
        property_type=PropertyTypeEnum.website,
        site_url="https://example.com",
        permission_level=PermissionLevelEnum.site_owner,
        site_ownership=SiteOwnershipEnum.sole,
        connection_status=ConnectionStatusEnum.connected,
        is_verified=True,
        verified_at=datetime.now(timezone.utc),
        created_by="test_user",
    )
    db_session.add(prop)
    await db_session.commit()
    await db_session.refresh(prop)

    assert prop.id is not None
    assert isinstance(prop.id, uuid.UUID)
    assert prop.property_id == "sc-domain:example.com"
    assert prop.property_type == PropertyTypeEnum.website
    assert prop.connection_status == ConnectionStatusEnum.connected
    assert prop.is_verified is True
    assert prop.created_at is not None
    assert prop.updated_at is not None


@pytest.mark.asyncio
async def test_search_console_property_defaults(db_session):
    prop = SearchConsoleProperty(
        property_id="sc-domain:default-test.com",
        property_name="Default Test",
        property_type=PropertyTypeEnum.website,
        site_url="https://default-test.com",
        permission_level=PermissionLevelEnum.site_owner,
        site_ownership=SiteOwnershipEnum.unverified,
        connection_status=ConnectionStatusEnum.pending,
        created_by="system",
    )
    db_session.add(prop)
    await db_session.commit()
    await db_session.refresh(prop)

    assert prop.is_verified is False
    assert prop.verified_at is None
    assert prop.connection_status == ConnectionStatusEnum.pending
    assert prop.sync_status == "pending"
    assert prop.sync_error is None
    assert prop.last_sync_at is None


@pytest.mark.asyncio
async def test_search_console_credential_creation(db_session, test_property):
    cred = SearchConsoleCredential(
        property_id=test_property.id,
        encrypted_access_token="encrypted_access",
        encrypted_refresh_token="encrypted_refresh",
        token_type="Bearer",
        scope="https://www.googleapis.com/auth/webmasters",
        expires_at=datetime.now(timezone.utc),
        is_revoked=False,
    )
    db_session.add(cred)
    await db_session.commit()
    await db_session.refresh(cred)

    assert cred.id is not None
    assert cred.property_id == test_property.id
    assert cred.token_type == "Bearer"
    assert cred.is_revoked is False
    assert cred.token_version == 1


@pytest.mark.asyncio
async def test_url_inspection_result_creation(db_session, test_property):
    inspection = UrlInspectionResult(
        property_id=test_property.id,
        inspected_url="https://example.com/page",
        coverage_status="indexed",
        last_crawl_time=datetime.now(timezone.utc),
        is_roboted=False,
        is_noindex=False,
        is_unreachable=False,
    )
    db_session.add(inspection)
    await db_session.commit()
    await db_session.refresh(inspection)

    assert inspection.id is not None
    assert inspection.inspected_url == "https://example.com/page"
    assert inspection.coverage_status == "indexed"


@pytest.mark.asyncio
async def test_sitemap_creation(db_session, test_property):
    sitemap = SearchConsoleSitemap(
        property_id=test_property.id,
        site_url="https://example.com",
        type="sitemap",
        is_pending_sitemap=False,
        path="/sitemap.xml",
        warnings_count=0,
        errors_count=0,
    )
    db_session.add(sitemap)
    await db_session.commit()
    await db_session.refresh(sitemap)

    assert sitemap.id is not None
    assert sitemap.type == "sitemap"
    assert sitemap.is_pending_sitemap is False


@pytest.mark.asyncio
async def test_manual_action_creation(db_session, test_property):
    action = SearchConsoleManualAction(
        property_id=test_property.id,
        action_type="manual_action_type",
        action_reason="Some reason",
        is_partial=False,
        resolution="pending",
    )
    db_session.add(action)
    await db_session.commit()
    await db_session.refresh(action)

    assert action.id is not None
    assert action.resolution == "pending"


@pytest.mark.asyncio
async def test_crawl_error_creation(db_session, test_property):
    error = SearchConsoleCrawlError(
        property_id=test_property.id,
        platform="web",
        error_type="serverError",
        page_url="https://example.com/page",
        detected_at=datetime.now(timezone.utc),
    )
    db_session.add(error)
    await db_session.commit()
    await db_session.refresh(error)

    assert error.id is not None
    assert error.platform == "web"
    assert error.resolved is False


@pytest.mark.asyncio
async def test_enhancement_creation(db_session, test_property):
    enhancement = SearchConsoleEnhancement(
        property_id=test_property.id,
        enhancement_type="core_web_vitals",
        status="valid",
        items_count=0,
    )
    db_session.add(enhancement)
    await db_session.commit()
    await db_session.refresh(enhancement)

    assert enhancement.id is not None
    assert enhancement.enhancement_type == "core_web_vitals"
    assert enhancement.status == "valid"


@pytest.mark.asyncio
async def test_performance_report_creation(db_session, test_property):
    report = SearchConsolePerformanceReport(
        property_id=test_property.id,
        start_date="2024-01-01",
        end_date="2024-01-28",
        dimensions=["query"],
        metrics=["clicks", "impressions"],
        total_rows=10,
    )
    db_session.add(report)
    await db_session.commit()
    await db_session.refresh(report)

    assert report.id is not None
    assert report.start_date == "2024-01-01"
    assert report.total_rows == 10
    assert report.dimensions == ["query"]


@pytest.mark.asyncio
async def test_audit_log_creation(db_session, test_property):
    log = SearchConsoleAuditLog(
        property_id=test_property.id,
        action="property_created",
        actor="test_user",
        status="success",
    )
    db_session.add(log)
    await db_session.commit()
    await db_session.refresh(log)

    assert log.id is not None
    assert log.action == "property_created"
    assert log.status == "success"


@pytest.mark.asyncio
async def test_sync_job_creation(db_session, test_property):
    job = SearchConsoleSyncJob(
        property_id=test_property.id,
        sync_type="full",
        status=SyncStatusEnum.running,
        started_at=datetime.now(timezone.utc),
        max_retries=3,
    )
    db_session.add(job)
    await db_session.commit()
    await db_session.refresh(job)

    assert job.id is not None
    assert job.status == SyncStatusEnum.running
    assert job.retry_count == 0
