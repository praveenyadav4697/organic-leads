"""Google OAuth 2.0 and Search Console API client.

Uses ``httpx.AsyncClient`` (same pattern as ``wp_client.py``) to communicate
with Google's OAuth2 token endpoint and the Search Console REST API.

Token lifecycle:
  1. ``get_authorization_url`` — front-end redirects the user to Google.
  2. ``exchange_code_for_tokens`` — back-end exchanges the auth code.
  3. ``refresh_access_token`` — automatic refresh when the access token expires.
  4. ``validate_credentials`` — credential validation / token introspection.
"""
from __future__ import annotations

import base64
import json
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx

from app.core.config import settings
from app.modules.search_console.exceptions import (
    GoogleOAuthException,
    GoogleCredentialsMissingException,
)


GOOGLE_ACCOUNTS_BASE = "https://accounts.google.com"
GOOGLE_API_BASE = "https://www.googleapis.com"
SEARCHCONSOLE_API_BASE = f"{GOOGLE_API_BASE}/webmasters/v3"
OAUTH_TOKEN_URL = f"{GOOGLE_ACCOUNTS_BASE}/o/oauth2/token"
OAUTH_AUTH_URL = f"{GOOGLE_ACCOUNTS_BASE}/o/oauth2/auth"
OAUTH_REVOKE_URL = f"{GOOGLE_ACCOUNTS_BASE}/o/oauth2/revoke"


def _check_credentials() -> None:
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise GoogleCredentialsMissingException()


def _scopes() -> list[str]:
    scopes_str = settings.GOOGLE_OAUTH_SCOPES or (
        "https://www.googleapis.com/auth/webmasters "
        "https://www.googleapis.com/auth/webmasters.readonly"
    )
    return [s.strip() for s in scopes_str.split() if s.strip()]


class GoogleOAuthClient:
    """OAuth 2.0 authorization-code-flow client for Google Search Console."""

    def __init__(self, timeout: Optional[float] = None):
        _check_credentials()
        self._timeout = timeout or settings.SEARCH_CONSOLE_API_TIMEOUT
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                follow_redirects=True,
            )
        return self._client

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    def get_authorization_url(self, state: str, redirect_uri: Optional[str] = None) -> str:
        """Build the Google consent-screen URL the front-end redirects to."""
        _check_credentials()
        redirect = redirect_uri or settings.GOOGLE_REDIRECT_URI
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": redirect,
            "scope": " ".join(_scopes()),
            "access_type": "offline",
            "prompt": "consent",
            "response_type": "code",
            "state": state,
        }
        return f"{OAUTH_AUTH_URL}?{urlencode(params)}"

    async def exchange_code_for_tokens(self, code: str, redirect_uri: Optional[str] = None) -> Dict[str, Any]:
        """Exchange an authorization code for access + refresh tokens."""
        _check_credentials()
        redirect = redirect_uri or settings.GOOGLE_REDIRECT_URI
        client = await self._get_client()
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect,
        }
        try:
            resp = await client.post(OAUTH_TOKEN_URL, data=data)
        except httpx.HTTPError as e:
            raise GoogleOAuthException(f"Token exchange network error: {e}", status_code=502)

        if resp.status_code != 200:
            body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            raise GoogleOAuthException(
                f"Token exchange failed: {body.get('error_description', resp.text)}",
                status_code=resp.status_code,
                details=body,
            )

        tokens = resp.json()
        return self._normalize_tokens(tokens)

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh an access token using a stored refresh token."""
        _check_credentials()
        client = await self._get_client()
        data = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        }
        try:
            resp = await client.post(OAUTH_TOKEN_URL, data=data)
        except httpx.HTTPError as e:
            raise GoogleOAuthException(f"Token refresh network error: {e}", status_code=502)

        if resp.status_code != 200:
            body = resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
            raise GoogleOAuthException(
                f"Token refresh failed: {body.get('error_description', resp.text)}",
                status_code=resp.status_code,
                details=body,
            )

        tokens = resp.json()
        # refresh_token is only returned on the initial code exchange; preserve it
        tokens.setdefault("refresh_token", refresh_token)
        return self._normalize_tokens(tokens)

    async def revoke_token(self, token: str) -> bool:
        """Revoke an access or refresh token."""
        _check_credentials()
        client = await self._get_client()
        try:
            await client.post(
                OAUTH_REVOKE_URL,
                data={"token": token},
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            return True
        except httpx.HTTPError:
            return False

    @staticmethod
    def validate_credentials(access_token: str) -> bool:
        """Lightweight validation — checks token format and expiry without a network call.

        A full network validation happens in :meth:`SearchConsoleApiClient.get_account_info`.
        """
        if not access_token or not access_token.startswith("ya"):
            return False
        return True

    @staticmethod
    def _normalize_tokens(raw: Dict[str, Any]) -> Dict[str, Any]:
        """Normalise Google's token response into our internal shape."""
        expires_at = None
        expires_in = raw.get("expires_in")
        if expires_in is not None:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))

        refresh_expires_at = None
        if raw.get("refresh_token") and raw.get("expires_in"):
            # Google refresh tokens last ~6 months; use a conservative estimate
            refresh_expires_at = datetime.now(timezone.utc) + timedelta(days=180)

        return {
            "access_token": raw.get("access_token"),
            "refresh_token": raw.get("refresh_token"),
            "token_type": raw.get("token_type", "Bearer"),
            "scope": raw.get("scope"),
            "expires_at": expires_at,
            "refresh_expires_at": refresh_expires_at,
            "id_token": raw.get("id_token"),
        }

    @staticmethod
    def is_token_expired(expires_at: Optional[datetime]) -> bool:
        if expires_at is None:
            return True
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) >= expires_at

    @staticmethod
    def token_needs_rotation(expires_at: Optional[datetime]) -> bool:
        """Return True if the token will expire within the next 60 seconds."""
        if expires_at is None:
            return True
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        buffer_time = datetime.now(timezone.utc) + timedelta(seconds=60)
        return expires_at <= buffer_time


class SearchConsoleApiClient:
    """Thin wrapper around the Google Search Console REST API."""

    def __init__(self, timeout: Optional[float] = None):
        self._timeout = timeout or settings.SEARCH_CONSOLE_API_TIMEOUT
        self._client: Optional[httpx.AsyncClient] = None
        self._access_token: Optional[str] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self._timeout,
                follow_redirects=True,
                base_url=SEARCHCONSOLE_API_BASE,
            )
        return self._client

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    def set_access_token(self, token: str) -> None:
        self._access_token = token

    def _auth_headers(self) -> Dict[str, str]:
        if not self._access_token:
            raise GoogleOAuthException("No access token set", status_code=401)
        return {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }

    async def _request(
        self, method: str, path: str, params: Optional[Dict[str, Any]] = None, json_body: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        client = await self._get_client()
        url = path if path.startswith("/") else f"/{path}"
        try:
            resp = await client.request(
                method, url, params=params, json=json_body, headers=self._auth_headers()
            )
        except httpx.HTTPError as e:
            raise GoogleOAuthException(f"Search Console API error: {e}", status_code=502)

        if resp.status_code != 200:
            body = {}
            try:
                body = resp.json()
            except Exception:
                pass
            raise GoogleOAuthException(
                f"Search Console API returned {resp.status_code}: {body.get('error', {}).get('message', resp.text)}",
                status_code=resp.status_code,
                details=body,
            )

        return resp.json()

    # --- Search Console API methods -------------------------------------------

    async def get_account(self) -> Dict[str, Any]:
        """Get the authenticated user's Search Console account list."""
        return await self._request("GET", "/accounts")

    async def list_properties(self) -> Dict[str, Any]:
        """List all verified properties for the authenticated user."""
        return await self._request("GET", "/sites")

    async def get_property(self, site_url: str) -> Dict[str, Any]:
        """Get a single property by its site URL."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}")

    async def verify_property(self, site_url: str) -> Dict[str, Any]:
        """Verify a property using the stored verification token."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("POST", f"/sites/{encoded}/verify")

    async def get_verification_token(self, site_url: str, verification_method: str = "html") -> Dict[str, Any]:
        """Get a verification token for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request(
            "GET",
            f"/sites/{encoded}/verify",
            params={"verificationMethod": verification_method},
        )

    async def delete_property(self, site_url: str) -> Dict[str, Any]:
        """Delete (un-verify) a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("DELETE", f"/sites/{encoded}")

    async def inspect_url(self, site_url: str, inspected_url: str) -> Dict[str, Any]:
        """Inspect a URL via the URL Inspection API."""
        return await self._request(
            "POST",
            "/urlInspection/index:inspect",
            json_body={"inspectionUrl": inspected_url, "siteUrl": site_url},
        )

    async def get_sitemaps(self, site_url: str) -> Dict[str, Any]:
        """Get sitemaps for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/sitemaps")

    async def get_sitemap(self, site_url: str, sitemap_url: str) -> Dict[str, Any]:
        """Get a specific sitemap's details."""
        from urllib.parse import quote
        encoded_site = quote(site_url, safe="")
        encoded_sitemap = quote(sitemap_url, safe="")
        return await self._request("GET", f"/sites/{encoded_site}/sitemaps/{encoded_sitemap}")

    async def submit_sitemap(self, site_url: str, sitemap_url: str) -> Dict[str, Any]:
        """Submit a sitemap for a property."""
        from urllib.parse import quote
        encoded_site = quote(site_url, safe="")
        encoded_sitemap = quote(sitemap_url, safe="")
        return await self._request("PUT", f"/sites/{encoded_site}/sitemaps/{encoded_sitemap}")

    async def delete_sitemap(self, site_url: str, sitemap_url: str) -> Dict[str, Any]:
        """Delete a sitemap from a property."""
        from urllib.parse import quote
        encoded_site = quote(site_url, safe="")
        encoded_sitemap = quote(sitemap_url, safe="")
        return await self._request("DELETE", f"/sites/{encoded_site}/sitemaps/{encoded_sitemap}")

    async def get_performance(
        self,
        site_url: str,
        start_date: str,
        end_date: str,
        dimensions: Optional[List[str]] = None,
        row_limit: int = 1000,
        start_row: int = 0,
        dimension_filter_groups: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Query the Search Analytics API for performance data."""
        body: Dict[str, Any] = {
            "startDate": start_date,
            "endDate": end_date,
            "rowLimit": row_limit,
            "startRow": start_row,
        }
        if dimensions:
            body["dimensions"] = dimensions
        if dimension_filter_groups:
            body["dimensionFilterGroups"] = dimension_filter_groups

        return await self._request("POST", "/data/searchanalytics", json_body=body)

    async def get_search_analytics_queries(self, site_url: str, start_date: str, end_date: str, row_limit: int = 1000) -> Dict[str, Any]:
        """Get search queries performance data (query dimension)."""
        return await self.get_performance(
            site_url, start_date, end_date,
            dimensions=["query"], row_limit=row_limit,
        )

    async def get_search_analytics_pages(self, site_url: str, start_date: str, end_date: str, row_limit: int = 1000) -> Dict[str, Any]:
        """Get page-level performance data (page dimension)."""
        return await self.get_performance(
            site_url, start_date, end_date,
            dimensions=["page"], row_limit=row_limit,
        )

    async def get_search_analytics_devices(self, site_url: str, start_date: str, end_date: str, row_limit: int = 100) -> Dict[str, Any]:
        """Get device-level performance data."""
        return await self.get_performance(
            site_url, start_date, end_date,
            dimensions=["device"], row_limit=row_limit,
        )

    async def get_search_analytics_countries(self, site_url: str, start_date: str, end_date: str, row_limit: int = 100) -> Dict[str, Any]:
        """Get country-level performance data."""
        return await self.get_performance(
            site_url, start_date, end_date,
            dimensions=["country"], row_limit=row_limit,
        )

    async def get_search_analytics_search_appearance(self, site_url: str, start_date: str, end_date: str, row_limit: int = 100) -> Dict[str, Any]:
        """Get search appearance performance data."""
        return await self.get_performance(
            site_url, start_date, end_date,
            dimensions=["searchAppearance"], row_limit=row_limit,
        )

    async def get_manual_actions(self, site_url: str) -> Dict[str, Any]:
        """Get manual actions for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/manualActions")

    async def get_url_notifications(self, site_url: str) -> Dict[str, Any]:
        """Get URL notification status."""
        return await self._request("GET", "/urlNotifications")

    async def get_crawl_stats(self, site_url: str) -> Dict[str, Any]:
        """Get crawl statistics for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/crawlstats")

    async def get_mobile_usability(self, site_url: str) -> Dict[str, Any]:
        """Get mobile usability issues for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/mobileUsability")

    async def get_index_status(self, site_url: str) -> Dict[str, Any]:
        """Get index status for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/indexstatus")

    async def get_security_issues(self, site_url: str) -> Dict[str, Any]:
        """Get security issues for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/securityIssues")

    async def get_amp_issues(self, site_url: str) -> Dict[str, Any]:
        """Get AMP issues for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/amp")

    async def get_rich_results(self, site_url: str) -> Dict[str, Any]:
        """Get rich results issues for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/richResults")

    async def get_core_web_vitals(self, site_url: str) -> Dict[str, Any]:
        """Get Core Web Vitals issues for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/coreWebVitals")

    async def get_links(self, site_url: str) -> Dict[str, Any]:
        """Get links data for a property."""
        from urllib.parse import quote
        encoded = quote(site_url, safe="")
        return await self._request("GET", f"/sites/{encoded}/links")
