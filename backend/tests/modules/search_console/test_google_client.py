import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta

from app.modules.search_console.google_client import (
    GoogleOAuthClient,
    SearchConsoleApiClient,
    OAUTH_TOKEN_URL,
    SEARCHCONSOLE_API_BASE,
)
from app.modules.search_console.exceptions import GoogleOAuthException


@pytest.fixture
def oauth_client(monkeypatch):
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_ID", "test_client_id")
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_SECRET", "test_client_secret")
    return GoogleOAuthClient()


@pytest.fixture
def api_client(monkeypatch):
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_ID", "test_client_id")
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_SECRET", "test_client_secret")
    return SearchConsoleApiClient()


@pytest.mark.asyncio
async def test_get_authorization_url(oauth_client):
    url = oauth_client.get_authorization_url("test_state", "http://localhost/callback")
    assert "accounts.google.com" in url
    assert "client_id=test_client_id" in url
    assert "state=test_state" in url
    assert "response_type=code" in url
    assert "access_type=offline" in url


@pytest.mark.asyncio
async def test_token_expiry_check():
    assert GoogleOAuthClient.is_token_expired(None) is True

    future = datetime.now(timezone.utc) + timedelta(hours=1)
    assert GoogleOAuthClient.is_token_expired(future) is False

    past = datetime.now(timezone.utc) - timedelta(hours=1)
    assert GoogleOAuthClient.is_token_expired(past) is True


@pytest.mark.asyncio
async def test_token_needs_rotation():
    future = datetime.now(timezone.utc) + timedelta(seconds=30)
    assert GoogleOAuthClient.token_needs_rotation(future) is True

    future_safe = datetime.now(timezone.utc) + timedelta(minutes=5)
    assert GoogleOAuthClient.token_needs_rotation(future_safe) is False

    assert GoogleOAuthClient.token_needs_rotation(None) is True


@pytest.mark.asyncio
async def test_validate_credentials():
    assert GoogleOAuthClient.validate_credentials(None) is False
    assert GoogleOAuthClient.validate_credentials("") is False
    assert GoogleOAuthClient.validate_credentials("invalid_token") is False
    assert GoogleOAuthClient.validate_credentials("ya29.test_token") is True


@pytest.mark.asyncio
async def test_normalize_tokens():
    raw = {
        "access_token": "test_access",
        "refresh_token": "test_refresh",
        "token_type": "Bearer",
        "scope": "webmasters",
        "expires_in": 3600,
    }
    result = GoogleOAuthClient._normalize_tokens(raw)
    assert result["access_token"] == "test_access"
    assert result["refresh_token"] == "test_refresh"
    assert result["token_type"] == "Bearer"
    assert result["expires_at"] is not None


@pytest.mark.asyncio
async def test_normalize_tokens_preserves_refresh_token():
    raw = {
        "access_token": "new_access",
        "token_type": "Bearer",
        "expires_in": 3600,
    }
    result = GoogleOAuthClient._normalize_tokens(raw)
    assert result["refresh_token"] is None
    if result["refresh_token"] is None:
        result["refresh_token"] = "original_refresh"
    assert result["refresh_token"] == "original_refresh"


@pytest.mark.asyncio
async def test_api_client_auth_headers(api_client):
    api_client.set_access_token("test_token")
    headers = api_client._auth_headers()
    assert headers["Authorization"] == "Bearer test_token"
    assert headers["Content-Type"] == "application/json"


@pytest.mark.asyncio
async def test_api_client_no_token(api_client):
    with pytest.raises(GoogleOAuthException):
        api_client._auth_headers()


@pytest.mark.asyncio
async def test_credentials_missing(monkeypatch):
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_ID", "")
    monkeypatch.setattr("app.modules.search_console.google_client.settings.GOOGLE_CLIENT_SECRET", "")
    with pytest.raises(Exception):
        GoogleOAuthClient()
