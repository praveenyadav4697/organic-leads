import uuid as uuid_pkg
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.database import get_db
from app.main import app
from app.modules.search_console.service import SearchConsoleService
from app.modules.search_console.dependencies import get_search_console_service
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
    ConnectionStatusEnum,
    PropertyTypeEnum,
    PermissionLevelEnum,
    SiteOwnershipEnum,
    SyncStatusEnum,
)
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

TEST_DATABASE_URL = settings.DATABASE_URL

engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)

SEARCH_CONSOLE_TABLES = [
    SearchConsoleSyncJob.__table__,
    SearchConsoleAuditLog.__table__,
    SearchConsolePerformanceReport.__table__,
    SearchConsoleEnhancement.__table__,
    SearchConsoleCrawlError.__table__,
    SearchConsoleManualAction.__table__,
    SearchConsoleSitemap.__table__,
    UrlInspectionResult.__table__,
    SearchConsoleCredential.__table__,
    SearchConsoleProperty.__table__,
]

SEARCH_CONSOLE_TABLE_NAMES = [t.name for t in SEARCH_CONSOLE_TABLES]


@pytest.fixture(autouse=True)
async def setup_test_db():
    async with engine.begin() as conn:
        for table in SEARCH_CONSOLE_TABLES:
            try:
                await conn.run_sync(table.create, checkfirst=True)
            except Exception:
                pass
    yield


@pytest.fixture
async def db_session():
    async with engine.connect() as cleanup_conn:
        autocommit = await cleanup_conn.execution_options(isolation_level="AUTOCOMMIT")
        for table_name in reversed(SEARCH_CONSOLE_TABLE_NAMES):
            try:
                await autocommit.execute(text(f'TRUNCATE TABLE {table_name} CASCADE'))
            except Exception:
                pass
    async with TestingSessionLocal() as session:
        yield session


@pytest.fixture
async def client(db_session):
    async def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def client_with_mocks(db_session, mock_google_client, mock_api_client):
    def _get_db_override():
        yield db_session

    def _get_sc_service_override():
        svc = SearchConsoleService(db_session)
        svc._oauth_client = mock_google_client
        svc._api_client = mock_api_client
        return svc

    app.dependency_overrides[get_db] = _get_db_override
    app.dependency_overrides[get_search_console_service] = _get_sc_service_override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def service(db_session):
    return SearchConsoleService(db_session)


@pytest.fixture
def service_with_mocks(db_session, mock_google_client, mock_api_client):
    svc = SearchConsoleService(db_session)
    svc._oauth_client = mock_google_client
    svc._api_client = mock_api_client
    return svc


@pytest.fixture
def mock_google_client(monkeypatch):
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_ID", "test_client_id")
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_SECRET", "test_client_secret")
    instance = MagicMock()
    instance.get_authorization_url = MagicMock(return_value="https://accounts.google.com/o/oauth2/auth?client_id=test")
    instance.exchange_code_for_tokens = AsyncMock(return_value={
        "access_token": "test_access_token",
        "refresh_token": "test_refresh_token",
        "token_type": "Bearer",
        "scope": "https://www.googleapis.com/auth/webmasters",
        "expires_at": datetime.now(timezone.utc) + timezone.utc.utcoffset(datetime.now(timezone.utc)),
        "refresh_expires_at": None,
        "id_token": None,
    })
    instance.refresh_access_token = AsyncMock(return_value={
        "access_token": "refreshed_access_token",
        "refresh_token": "test_refresh_token",
        "token_type": "Bearer",
        "expires_at": datetime.now(timezone.utc) + timezone.utc.utcoffset(datetime.now(timezone.utc)),
        "refresh_expires_at": None,
        "id_token": None,
    })
    instance.revoke_token = AsyncMock(return_value=True)
    instance.token_needs_rotation = MagicMock(return_value=False)
    instance.is_token_expired = MagicMock(return_value=False)
    instance.aclose = AsyncMock()
    return instance


@pytest.fixture
def mock_api_client():
    instance = MagicMock()
    instance.set_access_token = MagicMock()
    instance.aclose = AsyncMock()
    instance.list_properties = AsyncMock(return_value={"sites": []})
    instance.get_property = AsyncMock(return_value={"verified": False})
    instance.verify_property = AsyncMock(return_value={"verified": True})
    instance.get_verification_token = AsyncMock(return_value={"verificationToken": "test_token"})
    instance.inspect_url = AsyncMock(return_value={
        "inspectionResult": {
            "coverageState": "indexed",
            "lastCrawlTime": "2024-01-01T00:00:00Z",
        }
    })
    instance.get_sitemaps = AsyncMock(return_value={"sitemapEntries": []})
    instance.submit_sitemap = AsyncMock(return_value={})
    instance.get_manual_actions = AsyncMock(return_value={"manualActions": []})
    instance.get_performance = AsyncMock(return_value={"rows": [], "totalRows": 0})
    instance.get_search_analytics_queries = AsyncMock(return_value={"rows": [], "totalRows": 0})
    instance.get_search_analytics_pages = AsyncMock(return_value={"rows": [], "totalRows": 0})
    instance.get_search_analytics_devices = AsyncMock(return_value={"rows": [], "totalRows": 0})
    instance.get_search_analytics_countries = AsyncMock(return_value={"rows": [], "totalRows": 0})
    instance.get_search_analytics_search_appearance = AsyncMock(return_value={"rows": [], "totalRows": 0})
    instance.get_security_issues = AsyncMock(return_value={"issues": []})
    instance.get_mobile_usability = AsyncMock(return_value={"mobileUsability": []})
    instance.get_amp_issues = AsyncMock(return_value={"amp": []})
    instance.get_crawl_stats = AsyncMock(return_value={
        "crawlDiagnostics": {
            "webCrawl": {
                "timeSeries": {
                    "crawlablePages": {
                        "all": {
                            "results": [
                                {
                                    "platform": "web",
                                    "errorType": "serverError",
                                    "errorSubType": "internalServerError",
                                    "pageUrl": "https://example.com/error-page",
                                    "referringUrl": "https://example.com/referrer",
                                    "statusCode": 500,
                                    "detectedAt": "2024-01-01T00:00:00Z",
                                    "resolved": False,
                                }
                            ]
                        }
                    }
                }
            }
        }
    })
    instance.get_rich_results = AsyncMock(return_value={"richResults": []})
    instance.get_core_web_vitals = AsyncMock(return_value={"coreWebVitals": []})
    instance.get_index_status = AsyncMock(return_value={"indexStatus": []})
    instance.get_links = AsyncMock(return_value={"links": []})
    instance.get_url_notifications = AsyncMock(return_value={})
    instance.revoke_token = AsyncMock(return_value={})
    return instance


@pytest.fixture
def oauth_client(monkeypatch):
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_ID", "test_client_id")
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_SECRET", "test_client_secret")
    from app.modules.search_console.google_client import GoogleOAuthClient
    return GoogleOAuthClient()


@pytest.fixture
def api_client(monkeypatch):
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_ID", "test_client_id")
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_SECRET", "test_client_secret")
    from app.modules.search_console.google_client import SearchConsoleApiClient
    return SearchConsoleApiClient()


@pytest.fixture
async def test_property(db_session):
    from app.shared.utils.encryption import encrypt_value
    repo = SearchConsolePropertyRepository(db_session)
    cred_repo = SearchConsoleCredentialRepository(db_session)

    prop = await repo.create({
        "property_id": f"sc-domain:example-{uuid_pkg.uuid4().hex[:8]}.com",
        "property_name": "example.com",
        "property_type": PropertyTypeEnum.website,
        "site_url": "https://example.com",
        "permission_level": PermissionLevelEnum.site_owner,
        "site_ownership": SiteOwnershipEnum.sole,
        "connection_status": ConnectionStatusEnum.connected,
        "is_verified": True,
        "verified_at": datetime.now(timezone.utc),
        "created_by": "test_user",
    })
    await db_session.commit()
    await db_session.refresh(prop)

    await cred_repo.create({
        "property_id": prop.id,
        "encrypted_access_token": encrypt_value("ya29.test_access_token"),
        "encrypted_refresh_token": encrypt_value("test_refresh_token"),
        "token_type": "Bearer",
        "scope": "https://www.googleapis.com/auth/webmasters",
        "expires_at": datetime.now(timezone.utc) + timezone.utc.utcoffset(datetime.now(timezone.utc)),
        "is_revoked": False,
    })
    await db_session.commit()

    return prop
