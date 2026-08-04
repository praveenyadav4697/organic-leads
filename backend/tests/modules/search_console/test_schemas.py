import pytest
from datetime import datetime, timezone
import uuid

from app.modules.search_console.schemas import (
    SearchConsolePropertyCreate,
    SearchConsolePropertyUpdate,
    SearchConsolePropertyResponse,
    UrlInspectionRequest,
    SitemapCreate,
    SyncRequest,
    StatusResponse,
    OAuthCallbackResponse,
    PerformanceRow,
    PerformanceResponse,
    PaginatedResponse,
    PropertyTypeEnum,
    PermissionLevelEnum,
    SiteOwnershipEnum,
    VerificationMethodEnum,
    ConnectionStatusEnum,
)
from app.modules.search_console.models import (
    SearchConsoleProperty as SearchConsolePropertyModel,
    PropertyTypeEnum as ModelPropertyTypeEnum,
    PermissionLevelEnum as ModelPermissionLevelEnum,
    SiteOwnershipEnum as ModelSiteOwnershipEnum,
    ConnectionStatusEnum as ModelConnectionStatusEnum,
    VerificationMethodEnum as ModelVerificationMethodEnum,
)


@pytest.mark.asyncio
async def test_search_console_property_create_schema():
    data = {
        "property_id": "sc-domain:example.com",
        "property_name": "example.com",
        "property_type": "website",
        "site_url": "https://example.com",
        "permission_level": "siteOwner",
        "site_ownership": "sole",
        "verification_method": None,
        "connection_status": "connected",
        "created_by": "test_user",
    }
    schema = SearchConsolePropertyCreate(**data)
    assert schema.property_id == "sc-domain:example.com"
    assert schema.property_type == PropertyTypeEnum.website
    assert schema.connection_status == ConnectionStatusEnum.connected


@pytest.mark.asyncio
async def test_search_console_property_update_schema():
    data = {
        "property_name": "Updated Name",
        "is_verified": True,
        "verified_at": "2024-01-01T00:00:00Z",
    }
    schema = SearchConsolePropertyUpdate(**data)
    assert schema.property_name == "Updated Name"
    assert schema.is_verified is True


@pytest.mark.asyncio
async def test_search_console_property_update_partial():
    schema = SearchConsolePropertyUpdate(property_name=None, is_verified=True)
    assert schema.property_name is None
    assert schema.is_verified is True


@pytest.mark.asyncio
async def test_property_response_from_orm():
    prop = SearchConsolePropertyModel(
        id=uuid.uuid4(),
        property_id="sc-domain:test.com",
        property_name="test.com",
        property_type=ModelPropertyTypeEnum.website,
        site_url="https://test.com",
        permission_level=ModelPermissionLevelEnum.site_owner,
        site_ownership=ModelSiteOwnershipEnum.sole,
        verification_method=None,
        connection_status=ModelConnectionStatusEnum.connected,
        is_verified=True,
        verified_at=datetime.now(timezone.utc),
        created_by="system",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        last_sync_at=None,
        sync_status="synced",
        sync_error=None,
    )
    response = SearchConsolePropertyResponse.model_validate(prop)
    assert response.property_id == "sc-domain:test.com"
    assert response.is_verified is True


@pytest.mark.asyncio
async def test_url_inspection_request_schema():
    schema = UrlInspectionRequest(inspected_url="https://example.com/page")
    assert schema.inspected_url == "https://example.com/page"


@pytest.mark.asyncio
async def test_sitemap_create_schema():
    schema = SitemapCreate(site_url="https://example.com/sitemap.xml", type="sitemap")
    assert schema.site_url == "https://example.com/sitemap.xml"
    assert schema.type == "sitemap"


@pytest.mark.asyncio
async def test_sync_request_schema_defaults():
    schema = SyncRequest()
    assert schema.sync_type == "full"
    assert schema.force is False


@pytest.mark.asyncio
async def test_performance_row_schema():
    row = PerformanceRow(
        clicks=100, impressions=1000, ctr=10.0, position=1.5,
        country_code="US", device="desktop", query="test query", page="/page",
    )
    assert row.clicks == 100
    assert row.ctr == 10.0


@pytest.mark.asyncio
async def test_performance_response_schema():
    row = PerformanceRow(clicks=10, impressions=100, ctr=10.0, position=1.0)
    schema = PerformanceResponse(rows=[row], total_rows=1, date_range={"start": "2024-01-01", "end": "2024-01-28"})
    assert len(schema.rows) == 1
    assert schema.total_rows == 1


@pytest.mark.asyncio
async def test_paginated_response():
    schema = PaginatedResponse(items=[1, 2, 3], total=3, page=1, page_size=10, total_pages=1)
    assert schema.total == 3
    assert schema.items == [1, 2, 3]
