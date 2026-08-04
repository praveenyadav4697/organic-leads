from typing import Dict, Any, Optional, List, Union
import httpx
import base64
from urllib.parse import urlparse
from app.core.config import settings
from app.shared.utils.encryption import decrypt_value


class WordPressAPIError(Exception):
    def __init__(self, message: str, status_code: int = 500, details: Any = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


def _rest_base(base_url: str) -> str:
    if not base_url:
        return base_url
    parsed = urlparse(base_url)
    path = (parsed.path or "").rstrip("/")
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
        if self.app_password:
            try:
                self.app_password = decrypt_value(self.app_password)
            except Exception:
                pass
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

    async def _upload_request(self, method: str, endpoint: str, *, files: Dict[str, Any], data: Optional[Dict[str, Any]] = None) -> httpx.Response:
        url = f"{self.base_url}/wp-json/organic-leads/v1{endpoint}"
        headers = self._auth_headers()

        try:
            response = await self._client.request(method, url, headers=headers, files=files, data=data)
            return response
        except httpx.TimeoutException:
            raise WordPressAPIError("WordPress API request timed out", status_code=504)
        except httpx.HTTPError as e:
            raise WordPressAPIError(f"WordPress API connection error: {str(e)}", status_code=502)

    async def _json_or_error(self, response: httpx.Response, endpoint: str) -> Dict[str, Any]:
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

    async def get_site_health(self) -> Dict[str, Any]:
        response = await self._request("GET", "/site-health")
        return await self._json_or_error(response, "/site-health")

    async def get_server(self) -> Dict[str, Any]:
        response = await self._request("GET", "/server")
        return await self._json_or_error(response, "/server")

    async def get_database(self) -> Dict[str, Any]:
        response = await self._request("GET", "/database")
        return await self._json_or_error(response, "/database")

    async def get_themes(self) -> List[Dict[str, Any]]:
        response = await self._request("GET", "/themes")
        data = await self._json_or_error(response, "/themes")
        if isinstance(data, dict) and "themes" in data:
            return data["themes"]
        return data if isinstance(data, list) else []

    async def get_theme(self, slug: str) -> Dict[str, Any]:
        response = await self._request("GET", f"/themes/{slug}")
        return await self._json_or_error(response, f"/themes/{slug}")

    async def install_theme(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        response = await self._upload_request(
            "POST",
            "/themes/install",
            files={"theme_file": (filename, file_content, "application/zip")},
        )
        return await self._json_or_error(response, "/themes/install")

    async def activate_theme(self, slug: str) -> Dict[str, Any]:
        response = await self._request("POST", "/themes/activate", json={"slug": slug})
        return await self._json_or_error(response, "/themes/activate")

    async def delete_theme(self, slug: str) -> Dict[str, Any]:
        response = await self._request("DELETE", f"/themes/{slug}")
        return await self._json_or_error(response, f"/themes/{slug}")

    async def update_theme(self, slug: str) -> Dict[str, Any]:
        response = await self._request("POST", "/themes/update", json={"slug": slug})
        return await self._json_or_error(response, "/themes/update")

    async def get_plugins(self) -> List[Dict[str, Any]]:
        response = await self._request("GET", "/plugins")
        data = await self._json_or_error(response, "/plugins")
        if isinstance(data, dict) and "plugins" in data:
            return data["plugins"]
        return data if isinstance(data, list) else []

    async def get_plugin(self, slug: str) -> Dict[str, Any]:
        response = await self._request("GET", f"/plugins/{slug}")
        return await self._json_or_error(response, f"/plugins/{slug}")

    async def install_plugin(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        response = await self._upload_request(
            "POST",
            "/plugins/install",
            files={"plugin_file": (filename, file_content, "application/zip")},
        )
        return await self._json_or_error(response, "/plugins/install")

    async def activate_plugin(self, slug: str) -> Dict[str, Any]:
        response = await self._request("POST", "/plugins/activate", json={"slug": slug})
        return await self._json_or_error(response, "/plugins/activate")

    async def deactivate_plugin(self, slug: str) -> Dict[str, Any]:
        response = await self._request("POST", "/plugins/deactivate", json={"slug": slug})
        return await self._json_or_error(response, "/plugins/deactivate")

    async def delete_plugin(self, slug: str) -> Dict[str, Any]:
        response = await self._request("DELETE", f"/plugins/{slug}")
        return await self._json_or_error(response, f"/plugins/{slug}")

    async def update_plugin(self, slug: str) -> Dict[str, Any]:
        response = await self._request("POST", "/plugins/update", json={"slug": slug})
        return await self._json_or_error(response, "/plugins/update")

    async def get_forms(self) -> Dict[str, Any]:
        response = await self._request("GET", "/forms")
        data = await self._json_or_error(response, "/forms")
        if isinstance(data, dict) and "forms" in data:
            return data
        return {"forms": data} if data else {"forms": []}

    async def get_form(self, form_id: str) -> Dict[str, Any]:
        response = await self._request("GET", f"/forms/{form_id}")
        data = await self._json_or_error(response, f"/forms/{form_id}")
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data

    async def create_form(self, data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self._request("POST", "/forms", json=data)
        return await self._json_or_error(response, "/forms")

    async def update_form(self, form_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        response = await self._request("PUT", f"/forms/{form_id}", json=data)
        data = await self._json_or_error(response, f"/forms/{form_id}")
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data

    async def delete_form(self, form_id: str) -> Dict[str, Any]:
        response = await self._request("DELETE", f"/forms/{form_id}")
        data = await self._json_or_error(response, f"/forms/{form_id}")
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data

    async def publish_form(self, form_id: str) -> Dict[str, Any]:
        response = await self._request("POST", "/forms/publish", json={"id": form_id})
        return await self._json_or_error(response, "/forms/publish")

    async def unpublish_form(self, form_id: str) -> Dict[str, Any]:
        response = await self._request("POST", "/forms/unpublish", json={"id": form_id})
        return await self._json_or_error(response, "/forms/unpublish")

    async def duplicate_form(self, form_id: str) -> Dict[str, Any]:
        response = await self._request("POST", "/forms/duplicate", json={"id": form_id})
        data = await self._json_or_error(response, "/forms/duplicate")
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data

    async def preview_form(self, form_id: str) -> Dict[str, Any]:
        response = await self._request("POST", "/forms/preview", json={"id": form_id})
        data = await self._json_or_error(response, "/forms/preview")
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data

    async def get_forms_health(self) -> Dict[str, Any]:
        response = await self._request("GET", "/forms/health")
        data = await self._json_or_error(response, "/forms/health")
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data

    async def get_pages(self) -> Dict[str, Any]:
        response = await self._request("GET", "/pages")
        return await self._json_or_error(response, "/pages")

    async def get_posts(self) -> Dict[str, Any]:
        response = await self._request("GET", "/posts")
        return await self._json_or_error(response, "/posts")

    async def get_media(self) -> Dict[str, Any]:
        response = await self._request("GET", "/media")
        return await self._json_or_error(response, "/media")

    async def get_users(self) -> Dict[str, Any]:
        response = await self._request("GET", "/users")
        return await self._json_or_error(response, "/users")

    async def get_menus(self) -> Dict[str, Any]:
        response = await self._request("GET", "/menus")
        return await self._json_or_error(response, "/menus")

    async def get_widgets(self) -> Dict[str, Any]:
        response = await self._request("GET", "/widgets")
        return await self._json_or_error(response, "/widgets")

    async def get_settings(self) -> Dict[str, Any]:
        response = await self._request("GET", "/settings")
        return await self._json_or_error(response, "/settings")

    async def get_categories(self) -> Dict[str, Any]:
        response = await self._request("GET", "/categories")
        return await self._json_or_error(response, "/categories")

    async def get_tags(self) -> Dict[str, Any]:
        response = await self._request("GET", "/tags")
        return await self._json_or_error(response, "/tags")

    async def get_types(self) -> Dict[str, Any]:
        response = await self._request("GET", "/types")
        return await self._json_or_error(response, "/types")

    async def get_shortcodes(self) -> Dict[str, Any]:
        response = await self._request("GET", "/shortcodes")
        return await self._json_or_error(response, "/shortcodes")

    async def get_brand_assets(self) -> Dict[str, Any]:
        response = await self._request("GET", "/brand-assets")
        return await self._json_or_error(response, "/brand-assets")

    async def get_full_sync(self) -> Dict[str, Any]:
        response = await self._request("GET", "/full-sync")
        return await self._json_or_error(response, "/full-sync")

    async def get_tracking_scripts(self) -> Dict[str, Any]:
        response = await self._request("GET", "/tracking-scripts")
        return await self._json_or_error(response, "/tracking-scripts")

    async def get_tracking_scripts_health(self) -> Dict[str, Any]:
        response = await self._request("GET", "/tracking-scripts/health")
        return await self._json_or_error(response, "/tracking-scripts/health")

    async def get_spam_protection(self) -> Dict[str, Any]:
        response = await self._request("GET", "/spam-protection")
        return await self._json_or_error(response, "/spam-protection")

    async def verify_tracking_scripts(self) -> Dict[str, Any]:
        response = await self._request("GET", "/tracking-scripts/verify")
        return await self._json_or_error(response, "/tracking-scripts/verify")

    async def get_form_submissions(self, form_id: str, limit: int = 50, offset: int = 0) -> Dict[str, Any]:
        params = f"?limit={limit}&offset={offset}"
        response = await self._request("GET", f"/forms/{form_id}/submissions{params}")
        return await self._json_or_error(response, f"/forms/{form_id}/submissions")

    async def get_submissions_summary(self) -> Dict[str, Any]:
        response = await self._request("GET", "/forms/submissions/summary")
        return await self._json_or_error(response, "/forms/submissions/summary")

    async def get_consent_details(self) -> Dict[str, Any]:
        response = await self._request("GET", "/consent")
        return await self._json_or_error(response, "/consent")

    async def verify_consent_details(self) -> Dict[str, Any]:
        response = await self._request("GET", "/consent/verify")
        return await self._json_or_error(response, "/consent/verify")

    async def close(self) -> None:
        await self._client.aclose()