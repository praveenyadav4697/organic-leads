from typing import Dict, Any, Optional, List
import httpx
import base64
from urllib.parse import urlparse
from app.core.config import settings


class WordPressAPIError(Exception):
    def __init__(self, message: str, status_code: int = 500, details: Any = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


def _rest_base(base_url: str) -> str:
    """Return the site root, stripping any trailing /wp-admin or /wp-admin/
    so the WordPress REST API endpoint can be appended correctly.

    The WordPress REST API lives at:
        https://example.com/wp-json/...
    NOT under /wp-admin/. Historically we received the admin URL (e.g.
    ``http://localhost:8082/wp-admin``) and the client naively appended
    ``/wp-json/...`` to it, producing ``/wp-admin/wp-json/...`` which the
    web server correctly answered with 404.
    """
    if not base_url:
        return base_url
    parsed = urlparse(base_url)
    path = (parsed.path or "").rstrip("/")
    # Strip a trailing /wp-admin or /wp-admin/ segment so the REST URL
    # continues from the site root.
    if path.lower().endswith("/wp-admin"):
        path = path[: -len("/wp-admin")]
    elif path.lower().endswith("/wp-admin/"):
        path = path[: -len("/wp-admin/")]
    rebuilt = parsed._replace(path=path.rstrip("/") or "")
    return rebuilt.geturl().rstrip("/")


class WordPressClient:
    def __init__(self, base_url: str, username: Optional[str] = None, app_password: Optional[str] = None):
        self.base_url = _rest_base(base_url)
        self.username = username
        self.app_password = app_password
        self._client = httpx.AsyncClient(
            timeout=settings.WORDPRESS_API_TIMEOUT,
            follow_redirects=True,
        )

    def _auth_headers(self) -> Dict[str, str]:
        if not self.username or not self.app_password:
            return {}
        token = base64.b64encode(f"{self.username}:{self.app_password}".encode()).decode()
        return {"Authorization": f"Basic {token}"}

    def _not_found_message(self, endpoint: str) -> str:
        return (
            f"Organic Leads Connector plugin not found at "
            f"{self.base_url}/wp-json/organic-leads/v1{endpoint}. "
            "Install and activate the connector plugin on the WordPress site."
        )

    async def _request(self, method: str, endpoint: str, **kwargs) -> httpx.Response:
        url = f"{self.base_url}/wp-json/organic-leads/v1{endpoint}"
        headers = {**self._auth_headers(), "Content-Type": "application/json"}

        try:
            response = await self._client.request(method, url, headers=headers, **kwargs)
            return response
        except httpx.TimeoutException:
            raise WordPressAPIError("WordPress API request timed out", status_code=504)
        except httpx.HTTPError as e:
            raise WordPressAPIError(f"WordPress API connection error: {str(e)}", status_code=502)

    async def _json_or_error(self, response: httpx.Response, endpoint: str) -> Dict[str, Any]:
        """Raise a meaningful WordPressAPIError instead of bubbling
        httpx.HTTPStatusError so the caller (sync_wordpress) can wrap
        it in an AppException and return a proper HTTP status."""
        if response.status_code == 401:
            raise WordPressAPIError("Invalid WordPress credentials", status_code=401)
        if response.status_code == 404:
            raise WordPressAPIError(self._not_found_message(endpoint), status_code=404)
        if response.status_code >= 400:
            snippet = response.text[:200] if response.text else ""
            raise WordPressAPIError(
                f"WordPress API returned {response.status_code}: {snippet}",
                status_code=response.status_code,
            )
        try:
            return response.json()
        except ValueError:
            raise WordPressAPIError(
                f"WordPress API returned non-JSON response from {endpoint}",
                status_code=502,
            )

    async def get_system(self) -> Dict[str, Any]:
        response = await self._request("GET", "/system")
        return await self._json_or_error(response, "/system")

    async def get_plugins(self) -> List[Dict[str, Any]]:
        response = await self._request("GET", "/plugins")
        data = await self._json_or_error(response, "/plugins")
        return data if isinstance(data, list) else []

    async def get_themes(self) -> List[Dict[str, Any]]:
        response = await self._request("GET", "/themes")
        data = await self._json_or_error(response, "/themes")
        return data if isinstance(data, list) else []

    async def get_security(self) -> Dict[str, Any]:
        response = await self._request("GET", "/security")
        return await self._json_or_error(response, "/security")

    async def get_performance(self) -> Dict[str, Any]:
        response = await self._request("GET", "/performance")
        return await self._json_or_error(response, "/performance")

    async def get_health(self) -> Dict[str, Any]:
        response = await self._request("GET", "/health")
        return await self._json_or_error(response, "/health")

    async def get_full_sync(self) -> Dict[str, Any]:
        response = await self._request("GET", "/full-sync")
        return await self._json_or_error(response, "/full-sync")

    async def close(self) -> None:
        await self._client.aclose()
