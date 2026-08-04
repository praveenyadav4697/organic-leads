import pytest
import json
import uuid
from datetime import datetime, timezone

from app.modules.search_console.models import (
    SearchConsoleProperty,
    ConnectionStatusEnum,
    PropertyTypeEnum,
    PermissionLevelEnum,
    SiteOwnershipEnum,
    SyncStatusEnum,
)
from app.modules.search_console.schemas import SearchConsolePropertyCreate
from app.shared.utils.encryption import encrypt_value


@pytest.mark.asyncio
async def test_create_property_endpoint(client):
    response = await client.post("/api/v1/search-console/properties", json={
        "property_id": "sc-domain:route-test.com",
        "property_name": "Route Test",
        "property_type": "website",
        "site_url": "https://route-test.com",
        "permission_level": "siteOwner",
        "site_ownership": "sole",
        "verification_method": None,
        "connection_status": "pending",
        "created_by": "test_user",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["property_id"] == "sc-domain:route-test.com"
    assert data["property_name"] == "Route Test"
    assert data["connection_status"] == "pending"


@pytest.mark.asyncio
async def test_create_property_invalid_url(client):
    response = await client.post("/api/v1/search-console/properties", json={
        "property_id": "sc-domain:test.com",
        "property_name": "Test",
        "property_type": "website",
        "site_url": "not-a-url",
        "permission_level": "siteOwner",
        "site_ownership": "sole",
        "verification_method": None,
        "connection_status": "pending",
        "created_by": "test_user",
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_properties(client, test_property):
    response = await client.get("/api/v1/search-console/properties")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "page_size" in data
    assert "total_pages" in data
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_list_properties_with_filter(client, test_property):
    response = await client.get(
        "/api/v1/search-console/properties?connection_status=connected"
    )
    assert response.status_code == 200
    data = response.json()
    assert all(p["connection_status"] == "connected" for p in data["items"])


@pytest.mark.asyncio
async def test_get_property_by_id(client, test_property):
    response = await client.get(f"/api/v1/search-console/properties/{test_property.id}")
    assert response.status_code == 200
    data = response.json()
    assert "property_id" in data


@pytest.mark.asyncio
async def test_get_property_by_property_id(client, test_property):
    response = await client.get(f"/api/v1/search-console/properties/{test_property.property_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["site_url"] == "https://example.com"


@pytest.mark.asyncio
async def test_get_property_not_found(client):
    response = await client.get("/api/v1/search-console/properties/nonexistent-id")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_property(client, test_property):
    response = await client.put(
        f"/api/v1/search-console/properties/{test_property.id}",
        json={"property_name": "Updated Name", "is_verified": True},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["property_name"] == "Updated Name"
    assert data["is_verified"] is True


@pytest.mark.asyncio
async def test_delete_property(client, test_property):
    response = await client.delete(f"/api/v1/search-console/properties/{test_property.id}")
    assert response.status_code == 204

    response = await client.get(f"/api/v1/search-console/properties/{test_property.id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_inspect_url(client_with_mocks, test_property):
    response = await client_with_mocks.post(
        f"/api/v1/search-console/properties/{test_property.property_id}/inspect",
        json={"inspected_url": "https://example.com/page"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["inspected_url"] == "https://example.com/page"


@pytest.mark.asyncio
async def test_list_sitemaps(client, test_property):
    response = await client.get(
        f"/api/v1/search-console/properties/{test_property.id}/sitemaps?page=1&page_size=10"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_add_sitemap(client_with_mocks, test_property):
    response = await client_with_mocks.post(
        f"/api/v1/search-console/properties/{test_property.id}/sitemaps",
        json={"site_url": "https://example.com/sitemap.xml", "type": "sitemap"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["site_url"] == "https://example.com/sitemap.xml"


@pytest.mark.asyncio
async def test_list_manual_actions(client, test_property):
    response = await client.get(
        f"/api/v1/search-console/properties/{test_property.id}/manual-actions?page=1&page_size=10"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_list_crawl_errors(client, test_property):
    response = await client.get(
        f"/api/v1/search-console/properties/{test_property.id}/crawl-errors?page=1&page_size=10"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_list_enhancements(client, test_property):
    response = await client.get(
        f"/api/v1/search-console/properties/{test_property.id}/enhancements"
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_performance(client_with_mocks, test_property):
    response = await client_with_mocks.get(
        f"/api/v1/search-console/properties/{test_property.id}/performance"
        "?start_date=2024-01-01&end_date=2024-01-28"
    )
    assert response.status_code == 200
    data = response.json()
    assert "rows" in data
    assert "date_range" in data


@pytest.mark.asyncio
async def test_get_performance_with_dimensions(client_with_mocks, test_property):
    response = await client_with_mocks.get(
        f"/api/v1/search-console/properties/{test_property.id}/performance"
        "?start_date=2024-01-01&end_date=2024-01-28&dimensions=query&dimensions=page&metrics=clicks&metrics=impressions"
    )
    assert response.status_code == 200
    data = response.json()
    assert "rows" in data


@pytest.mark.asyncio
async def test_oauth_authorize_endpoint(client):
    import os
    os.environ["GOOGLE_CLIENT_ID"] = "test_client_id"
    os.environ["GOOGLE_CLIENT_SECRET"] = "test_client_secret"

    from app.core.config import get_settings
    settings_obj = get_settings()
    settings_obj.GOOGLE_CLIENT_ID = "test_client_id"
    settings_obj.GOOGLE_CLIENT_SECRET = "test_client_secret"

    from app.modules.search_console.google_client import _check_credentials
    _check_credentials()

    response = await client.get(
        "/api/v1/search-console/oauth/authorize?state=https://example.com"
    )
    assert response.status_code == 200
    data = response.json()
    assert "authorization_url" in data
    assert "state" in data


@pytest.mark.asyncio
async def test_get_status_endpoint(client, test_property):
    response = await client.get(
        f"/api/v1/search-console/status?property_id={test_property.id}"
    )
    assert response.status_code == 200
    data = response.json()
    assert "property_id" in data
    assert "connection_status" in data
    assert "credential_status" in data


@pytest.mark.asyncio
async def test_get_queries_endpoint(client_with_mocks, test_property):
    response = await client_with_mocks.get(
        f"/api/v1/search-console/properties/{test_property.id}/queries"
        "?start_date=2024-01-01&end_date=2024-01-28"
    )
    assert response.status_code == 200
    data = response.json()
    assert "rows" in data


@pytest.mark.asyncio
async def test_get_devices_endpoint(client_with_mocks, test_property):
    response = await client_with_mocks.get(
        f"/api/v1/search-console/properties/{test_property.id}/devices"
        "?start_date=2024-01-01&end_date=2024-01-28"
    )
    assert response.status_code == 200
    data = response.json()
    assert "rows" in data


@pytest.mark.asyncio
async def test_get_countries_endpoint(client_with_mocks, test_property):
    response = await client_with_mocks.get(
        f"/api/v1/search-console/properties/{test_property.id}/countries"
        "?start_date=2024-01-01&end_date=2024-01-28"
    )
    assert response.status_code == 200
    data = response.json()
    assert "rows" in data


@pytest.mark.asyncio
async def test_get_security_endpoint(client_with_mocks, test_property):
    response = await client_with_mocks.get(
        f"/api/v1/search-console/properties/{test_property.id}/security"
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_revoke_credentials_endpoint(client, test_property):
    response = await client.post(
        f"/api/v1/search-console/properties/{test_property.id}/revoke"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["revoked"] is True


@pytest.mark.asyncio
async def test_list_audit_logs(client, test_property):
    response = await client.get(
        f"/api/v1/search-console/properties/{test_property.id}/audit-logs?page=1&page_size=50"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_list_sync_jobs(client, test_property):
    response = await client.get(
        f"/api/v1/search-console/properties/{test_property.id}/sync-jobs?page=1&page_size=50"
    )
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.asyncio
async def test_sync_property_endpoint(client_with_mocks, test_property):
    response = await client_with_mocks.post(
        f"/api/v1/search-console/properties/{test_property.id}/sync",
        json={"sync_type": "full", "force": False},
    )
    assert response.status_code == 200
    data = response.json()
    assert "job_id" in data
    assert "sync_type" in data
