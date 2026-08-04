import pytest
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.search_console.service import SearchConsoleService
from app.modules.search_console.exceptions import (
    PropertyNotFoundException,
    PropertyNotConnectedException,
    GoogleOAuthException,
    SyncFailedException,
    VerificationFailedException,
    SearchConsoleException,
)
from app.modules.search_console.models import (
    SearchConsoleProperty,
    SearchConsoleCredential,
    ConnectionStatusEnum,
    PropertyTypeEnum,
    PermissionLevelEnum,
    SiteOwnershipEnum,
    VerificationMethodEnum,
    SyncStatusEnum,
)
from app.modules.search_console.repository import (
    SearchConsolePropertyRepository,
    SearchConsoleCredentialRepository,
)
from app.modules.search_console.schemas import (
    SearchConsolePropertyCreate,
    SearchConsolePropertyUpdate,
    UrlInspectionRequest,
    SitemapCreate,
    SyncRequest,
)


@pytest.fixture
async def service_with_mocks(db_session, mock_google_client, mock_api_client):
    svc = SearchConsoleService(db_session)
    svc._oauth_client = mock_google_client
    svc._api_client = mock_api_client
    return svc


@pytest.fixture
async def test_property_with_creds(db_session):
    from app.shared.utils.encryption import encrypt_value
    prop_repo = SearchConsolePropertyRepository(db_session)
    cred_repo = SearchConsoleCredentialRepository(db_session)

    prop = await prop_repo.create({
        "property_id": f"sc-domain:cred-test-{uuid.uuid4().hex[:8]}.com",
        "property_name": "cred-test.com",
        "property_type": PropertyTypeEnum.website,
        "site_url": "https://cred-test.com",
        "permission_level": PermissionLevelEnum.site_owner,
        "site_ownership": SiteOwnershipEnum.sole,
        "connection_status": ConnectionStatusEnum.connected,
        "is_verified": True,
        "verified_at": datetime.now(timezone.utc),
        "created_by": "test_user",
    })
    await db_session.commit()
    await db_session.refresh(prop)

    cred = await cred_repo.create({
        "property_id": prop.id,
        "encrypted_access_token": encrypt_value("ya29.test_access_token"),
        "encrypted_refresh_token": encrypt_value("test_refresh_token"),
        "token_type": "Bearer",
        "scope": "https://www.googleapis.com/auth/webmasters",
        "expires_at": datetime.now(timezone.utc) + timezone.utc.utcoffset(datetime.now(timezone.utc)),
        "is_revoked": False,
    })
    await db_session.commit()
    await db_session.refresh(cred)

    return prop


@pytest.mark.asyncio
async def test_create_property(service_with_mocks):
    data = {
        "property_id": "sc-domain:new-test.com",
        "property_name": "New Test",
        "property_type": "website",
        "site_url": "https://new-test.com",
        "permission_level": "siteOwner",
        "site_ownership": "sole",
        "verification_method": None,
        "connection_status": "pending",
        "created_by": "test_user",
    }
    prop = await service_with_mocks.create_property(data)
    assert prop.property_id == "sc-domain:new-test.com"
    assert prop.site_url == "https://new-test.com"
    assert prop.created_by == "test_user"


@pytest.mark.asyncio
async def test_create_property_invalid_url(service_with_mocks):
    data = {
        "property_id": "sc-domain:test.com",
        "property_name": "Test",
        "property_type": "website",
        "site_url": "not-a-url",
        "permission_level": "siteOwner",
        "site_ownership": "sole",
        "verification_method": None,
        "connection_status": "pending",
        "created_by": "test_user",
    }
    with pytest.raises(SearchConsoleException):
        await service_with_mocks.create_property(data)


@pytest.mark.asyncio
async def test_get_property_by_id(service_with_mocks, test_property):
    prop = await service_with_mocks.get_property(str(test_property.id))
    assert prop.id == test_property.id


@pytest.mark.asyncio
async def test_get_property_by_property_id(service_with_mocks, test_property):
    prop = await service_with_mocks.get_property(test_property.property_id)
    assert prop.id == test_property.id


@pytest.mark.asyncio
async def test_get_property_not_found(service_with_mocks):
    with pytest.raises(PropertyNotFoundException):
        await service_with_mocks.get_property("nonexistent")


@pytest.mark.asyncio
async def test_update_property(service_with_mocks, test_property):
    update = {"property_name": "Updated Name", "is_verified": True}
    prop = await service_with_mocks.update_property(str(test_property.id), update)
    assert prop.property_name == "Updated Name"
    assert prop.is_verified is True


@pytest.mark.asyncio
async def test_delete_property(service_with_mocks, test_property):
    result = await service_with_mocks.delete_property(str(test_property.id))
    assert result is True

    with pytest.raises(PropertyNotFoundException):
        await service_with_mocks.get_property(str(test_property.id))


@pytest.mark.asyncio
async def test_get_properties_paginated(service_with_mocks, test_property):
    items, total = await service_with_mocks.get_properties(skip=0, limit=10)
    assert total >= 1
    assert len(items) >= 1


@pytest.mark.asyncio
async def test_oauth_authorization_url(service_with_mocks):
    url = service_with_mocks.get_oauth_authorization_url("https://example.com", "http://localhost/callback")
    assert "accounts.google.com" in url
    assert "client_id" in url


@pytest.mark.asyncio
async def test_handle_oauth_callback(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.handle_oauth_callback(
        code="auth_code",
        state="https://cred-test.com",
    )
    assert result["connection_status"] == "connected"
    assert result["is_verified"] is True


@pytest.mark.asyncio
async def test_handle_oauth_callback_property_not_found(service_with_mocks):
    with pytest.raises(PropertyNotFoundException):
        await service_with_mocks.handle_oauth_callback(
            code="auth_code",
            state="https://nonexistent.com",
        )


@pytest.mark.asyncio
async def test_verify_property(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.verify_property(str(test_property_with_creds.id), "html")
    assert result["is_verified"] is True
    assert result["verification_method"] == "html"


@pytest.mark.asyncio
async def test_get_verification_info(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.get_verification_info(str(test_property_with_creds.id), "html")
    assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_inspect_url(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.inspect_url(str(test_property_with_creds.id), "https://example.com/page")
    assert result is not None
    assert result.inspected_url == "https://example.com/page"


@pytest.mark.asyncio
async def test_get_url_inspections(service_with_mocks, test_property_with_creds):
    await service_with_mocks.inspect_url(str(test_property_with_creds.id), "https://example.com/page1")
    items, total = await service_with_mocks.get_url_inspections(str(test_property_with_creds.id))
    assert total >= 1


@pytest.mark.asyncio
async def test_get_sitemaps(service_with_mocks, test_property_with_creds):
    items, total = await service_with_mocks.get_sitemaps(str(test_property_with_creds.id))
    assert total == 0


@pytest.mark.asyncio
async def test_add_sitemap(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.add_sitemap(str(test_property_with_creds.id), {
        "site_url": "https://example.com/sitemap.xml",
        "type": "sitemap",
    })
    assert result.site_url == "https://example.com/sitemap.xml"


@pytest.mark.asyncio
async def test_get_manual_actions(service_with_mocks, test_property_with_creds):
    items, total = await service_with_mocks.get_manual_actions(str(test_property_with_creds.id))
    assert total == 0


@pytest.mark.asyncio
async def test_get_crawl_errors(service_with_mocks, test_property_with_creds):
    items, total = await service_with_mocks.get_crawl_errors(str(test_property_with_creds.id))
    assert total == 0


@pytest.mark.asyncio
async def test_get_enhancements(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.get_enhancements(str(test_property_with_creds.id))
    assert isinstance(result, list)


@pytest.mark.asyncio
async def test_get_performance(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.get_performance(
        str(test_property_with_creds.id), "2024-01-01", "2024-01-28"
    )
    assert "rows" in result
    assert "date_range" in result


@pytest.mark.asyncio
async def test_get_search_queries(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.get_search_queries(
        str(test_property_with_creds.id), "2024-01-01", "2024-01-28"
    )
    assert "rows" in result


@pytest.mark.asyncio
async def test_get_devices(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.get_devices(
        str(test_property_with_creds.id), "2024-01-01", "2024-01-28"
    )
    assert "rows" in result


@pytest.mark.asyncio
async def test_get_countries(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.get_countries(
        str(test_property_with_creds.id), "2024-01-01", "2024-01-28"
    )
    assert "rows" in result


@pytest.mark.asyncio
async def test_get_security_issues(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.get_security_issues(str(test_property_with_creds.id))
    assert isinstance(result, dict)


@pytest.mark.asyncio
async def test_get_status(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.get_status(str(test_property_with_creds.id))
    assert "property_id" in result
    assert "connection_status" in result
    assert "credential_status" in result


@pytest.mark.asyncio
async def test_sync_property(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.sync_property(str(test_property_with_creds.id), "full")
    assert "job_id" in result
    assert result["sync_type"] == "full"


@pytest.mark.asyncio
async def test_sync_property_not_connected(service_with_mocks, db_session):
    prop_repo = SearchConsolePropertyRepository(db_session)
    prop = await prop_repo.create({
        "property_id": f"sc-domain:not-connected-{uuid.uuid4().hex[:8]}.com",
        "property_name": "Not Connected",
        "property_type": PropertyTypeEnum.website,
        "site_url": "https://not-connected.com",
        "permission_level": PermissionLevelEnum.site_owner,
        "site_ownership": SiteOwnershipEnum.unverified,
        "connection_status": ConnectionStatusEnum.pending,
        "created_by": "test",
    })
    await db_session.commit()

    with pytest.raises(PropertyNotConnectedException):
        await service_with_mocks.sync_property(str(prop.id), "full")


@pytest.mark.asyncio
async def test_revoke_credentials(service_with_mocks, test_property_with_creds):
    result = await service_with_mocks.revoke_credentials(test_property_with_creds.id)
    assert result is True


@pytest.mark.asyncio
async def test_get_audit_logs(service_with_mocks, test_property_with_creds):
    items, total = await service_with_mocks.get_audit_logs(str(test_property_with_creds.id))
    assert total == 0


@pytest.mark.asyncio
async def test_get_sync_jobs(service_with_mocks, test_property_with_creds):
    items, total = await service_with_mocks.get_sync_jobs(str(test_property_with_creds.id))
    assert total == 0
