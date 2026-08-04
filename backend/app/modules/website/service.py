from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
import asyncio
import sys
from concurrent.futures import ThreadPoolExecutor
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete
from fastapi import HTTPException
from app.core.exceptions import AppException, NotFoundException, ConflictException, ValidationException
from app.core.config import settings
from app.shared.utils.encryption import encrypt_value, decrypt_value
from app.modules.website.models import (
    Website,
    WebsiteScanHistory,
    WordPressPlugin,
    WordPressTheme,
    WebsiteSSL,
    HostingInformation,
    WebsiteHealth,
    WebsiteDNS,
    WebsiteSecurity,
    WebsiteScreenshot,
    WordPressSync,
    WhoisInformation,
    RobotsInformation,
    SitemapInformation,
    PerformanceInformation,
    MobileInformation,
    SEOInformation,
    ThemeStatusEnum,
    PluginLog,
    PluginOperationEnum,
    PluginSecurityStatusEnum,
    WebsiteForm,
    FormField,
    FormHealth,
    FormLog,
    FormOperationEnum,
    FormStatusEnum,
    FormHealthEnum,
)
from app.modules.website.schemas import (
    WebsiteCreate,
    WebsiteUpdate,
    WebsiteResponse,
    WordPressPluginResponse,
    WordPressThemeResponse,
    ThemeActivateRequest,
    ThemeUpdateRequest,
    WebsiteSSLResponse,
    HostingInformationResponse,
    WebsiteHealthResponse,
    WebsiteDNSResponse,
    WebsiteSecurityResponse,
    PluginLogResponse,
    FormResponse,
    FormDetailResponse,
    FormHealthResponse,
    FormCreateRequest,
    FormUpdateRequest,
    FormOperationResponse,
    FormLogResponse,
)
from app.modules.website.validators import validate_domain, validate_url
from app.modules.website.repository import (
    WebsiteRepository,
    WebsiteScanHistoryRepository,
    WordPressPluginRepository,
    WordPressThemeRepository,
    WebsiteSSLRepository,
    HostingInformationRepository,
    WebsiteHealthRepository,
    WebsiteDNSRepository,
    WebsiteSecurityRepository,
    WebsiteScreenshotRepository,
    WordPressSyncRepository,
    WhoisInformationRepository,
    RobotsInformationRepository,
    SitemapInformationRepository,
    PerformanceInformationRepository,
    MobileInformationRepository,
    SEOInformationRepository,
    PluginLogRepository,
    WebsiteFormRepository,
    FormLogRepository,
)
from app.modules.website.scanner import WebsiteScanner
from app.modules.website.screenshot import ScreenshotService, ScreenshotCaptureError
from app.modules.website.wp_client import WordPressClient, WordPressAPIError
import uuid
import logging

logger = logging.getLogger(__name__)


class WebsiteService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = WebsiteRepository(db)
        self.scanner = WebsiteScanner()
        self.screenshot_service = ScreenshotService()
        self._screenshot_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="screenshot")

    def _run_playwright_capture(self, url: str, output_path: Path, width: int = 1440, height: int = 900, full_page: bool = False) -> dict:
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        service = ScreenshotService()
        try:
            return loop.run_until_complete(
                service.capture(url, output_path, width, height, full_page)
            )
        finally:
            try:
                loop.run_until_complete(service.close())
            except Exception:
                pass
            loop.close()

    def _encrypt_credentials(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Encrypt credential fields and drop blank values so a partially-filled
        update request cannot overwrite a previously persisted secret with an
        empty string.

        The frontend sends an empty password field on re-edit because the
        existing password is never returned to the client (it is encrypted and
        never exposed). Without this guard, every "Save" without retyping the
        password would silently null the stored credential.
        """
        for key in ("hosting_password", "wp_app_password"):
            value = data.get(key)
            if not value:  # None / empty string / whitespace -> do not touch DB
                data.pop(key, None)
                continue
            data[key] = encrypt_value(value)
        return data

    def _decrypt_password(self, encrypted_value: Optional[str]) -> Optional[str]:
        if not encrypted_value:
            return None
        return decrypt_value(encrypted_value)

    async def register_website(self, website_in: WebsiteCreate) -> WebsiteResponse:
        normalized_domain = validate_domain(website_in.domain)
        existing = await self.repo.get_by_domain(normalized_domain)
        if existing:
            raise ConflictException(f"Website with domain {normalized_domain} already exists")

        website_data = self._encrypt_credentials(website_in.model_dump(exclude_none=True))
        website_data["domain"] = normalized_domain
        if website_data.get("url"):
            website_data["url"] = validate_url(website_data["url"])

        website = await self.repo.create_website(WebsiteCreate(**website_data))

        try:
            await self.run_scan(website.id)
        except Exception:
            pass

        website = await self.repo.get(website.id)
        return WebsiteResponse.model_validate(website)

    async def get_website(self, website_id: uuid.UUID) -> WebsiteResponse:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        return WebsiteResponse.model_validate(website)

    async def list_websites(self, skip: int = 0, limit: int = 100) -> List[WebsiteResponse]:
        websites = await self.repo.get_all(skip=skip, limit=limit)
        return [WebsiteResponse.model_validate(w) for w in websites]

    async def update_website(self, website_id: uuid.UUID, website_in: WebsiteUpdate) -> WebsiteResponse:
        update_data = website_in.model_dump(exclude_unset=True)
        if "domain" in update_data:
            update_data["domain"] = validate_domain(update_data["domain"])
        if "url" in update_data:
            update_data["url"] = validate_url(update_data["url"])
        update_data = self._encrypt_credentials(update_data)
        website = await self.repo.update_website(website_id, WebsiteUpdate(**update_data))
        if not website:
            raise NotFoundException("Website", website_id)
        return WebsiteResponse.model_validate(website)

    async def delete_website(self, website_id: uuid.UUID) -> None:
        deleted = await self.repo.delete_website(website_id)
        if not deleted:
            raise NotFoundException("Website", website_id)

    async def run_scan(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        scan = WebsiteScanHistoryRepository(self.db)
        scan_record = await scan.create_scan({
            "website_id": website_id,
            "scan_type": "full",
            "status": "running",
            "started_at": datetime.utcnow(),
        })

        try:
            credentials = {
                "username": website.wp_username,
                "app_password": self._decrypt_password(website.wp_app_password),
            } if website.wp_username and website.wp_app_password else None

            results = await self.scanner.scan_website(website, scan_record.id, credentials)
            serializable_results = self._make_serializable(results)

            await scan.update(scan_record.id, {
                "status": "completed",
                "completed_at": datetime.utcnow(),
                "duration_seconds": (datetime.utcnow() - scan_record.started_at.replace(tzinfo=None)).total_seconds(),
                "result": serializable_results,
            })

            await self._update_website_summary(website_id, results)

            plugin_repo = WordPressPluginRepository(self.db)
            theme_repo = WordPressThemeRepository(self.db)
            ssl_repo = WebsiteSSLRepository(self.db)
            hosting_repo = HostingInformationRepository(self.db)
            health_repo = WebsiteHealthRepository(self.db)
            dns_repo = WebsiteDNSRepository(self.db)
            security_repo = WebsiteSecurityRepository(self.db)

            if "plugins" in results:
                await plugin_repo.delete_by_website(website_id)
                await plugin_repo.bulk_create([
                    {**p, "website_id": website_id} for p in results["plugins"]
                ])

            if "themes" in results:
                await theme_repo.delete_by_website(website_id)
                await theme_repo.bulk_create([
                    {**t, "website_id": website_id} for t in results["themes"]
                ])

            if "ssl" in results:
                ssl_data = {**results["ssl"], "website_id": website_id, "scan_history_id": scan_record.id}
                await ssl_repo.create(ssl_data)

            if "hosting" in results:
                hosting_data = {**results["hosting"], "website_id": website_id, "scan_history_id": scan_record.id}
                await hosting_repo.create(hosting_data)

            if "health" in results:
                health_data = {**results["health"], "website_id": website_id, "audit_type": "full"}
                await health_repo.create(health_data)

            if "dns" in results:
                dns_data = {**results["dns"], "website_id": website_id, "scan_history_id": scan_record.id}
                await dns_repo.create(dns_data)

            if "security" in results:
                security_data = {**results["security"], "website_id": website_id, "scan_history_id": scan_record.id}
                await security_repo.create(security_data)

            # Persist discovery fact tables (public-only, no credentials required).
            if "site_info" in results:
                si = results["site_info"]
                await self._persist_seo(website_id, scan_record.id, si)

            if "wordpress" in results:
                wp = results["wordpress"]
                await self._persist_wordpress_public(website_id, scan_record.id, wp)

            if "ssl" in results and results["ssl"]:
                ssl_d = results["ssl"]
                await self._persist_ssl_discovery(website_id, scan_record.id, ssl_d)

            if "dns" in results and results["dns"]:
                dns_d = results["dns"]
                await self._persist_dns_discovery(website_id, scan_record.id, dns_d)

            if "whois" in results and results["whois"]:
                whois_d = results["whois"]
                await self._persist_whois_discovery(website_id, scan_record.id, whois_d)

            if "seo" in results and results["seo"]:
                seo_d = results["seo"]
                await self._persist_seo_discovery(website_id, scan_record.id, seo_d)

            if "performance" in results and results["performance"]:
                perf_d = results["performance"]
                await self._persist_performance_discovery(website_id, scan_record.id, perf_d)

            if "security" in results and results["security"]:
                sec_d = results["security"]
                await self._persist_security_discovery(website_id, scan_record.id, sec_d)

            if "mobile" in results and results["mobile"]:
                mob_d = results["mobile"]
                await self._persist_mobile_discovery(website_id, scan_record.id, mob_d)

            if "robots" in results and results["robots"] is not None:
                robots_d = results["robots"]
                await self._persist_robots_discovery(website_id, scan_record.id, robots_d)

            if "sitemap" in results and results["sitemap"] is not None:
                sitemap_d = results["sitemap"]
                await self._persist_sitemap_discovery(website_id, scan_record.id, sitemap_d)

            await self.db.commit()
            return {
                "website_id": str(website_id),
                "scan_id": str(scan_record.id),
                "status": "completed",
                "started_at": scan_record.started_at.isoformat(),
                "completed_at": datetime.utcnow().isoformat(),
                "estimated_duration_seconds": (datetime.utcnow() - scan_record.started_at.replace(tzinfo=None)).total_seconds(),
                "results": results,
            }

        except Exception as e:
            await scan.update(scan_record.id, {
                "status": "failed",
                "completed_at": datetime.utcnow(),
                "error_message": str(e),
            })
            await self.db.rollback()
            raise

    async def _update_website_summary(self, website_id: uuid.UUID, results: Dict[str, Any]) -> None:
        update_data: Dict[str, Any] = {
            "last_scan": datetime.utcnow(),
            "cms": results.get("cms", "wordpress"),
        }

        if results.get("version"):
            update_data["version"] = results.get("version")
        if results.get("hosting"):
            update_data["hosting"] = results.get("hosting").get("hosting_provider") or results.get("hosting").get("server_software")
        if results.get("ssl"):
            update_data["ssl"] = results.get("ssl").get("security_rating")
        if results.get("dns"):
            update_data["dns"] = results.get("dns").get("propagation_status")
            if results.get("dns").get("a_records"):
                update_data["ip"] = results.get("dns").get("a_records")[0]
        if results.get("health"):
            update_data["health"] = int(results.get("health").get("overall_score", 0))
            update_data["performance"] = int(results.get("health").get("performance_score", 0))
            update_data["seo"] = int(results.get("health").get("seo_score", 0))
            update_data["security"] = int(results.get("health").get("security_score", 0))
            update_data["responsive"] = int(results.get("health").get("best_practices_score", 0))
        if results.get("hosting"):
            update_data["uptime"] = results.get("hosting").get("response_headers", {}).get("x-uptime") or update_data.get("uptime")
        update_data["issues"] = len(results.get("plugins", [])) + len(results.get("themes", []))

        await self.repo.update(website_id, update_data)

    async def _persist_seo(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        repo = SEOInformationRepository(self.db)
        await repo.create_seo({
            "website_id": website_id,
            "scan_history_id": scan_id,
            "title": data.get("title"),
            "meta_description": data.get("meta_description"),
            "canonical_url": None,
            "robots_meta": None,
            "h1_count": 0,
            "h2_count": 0,
            "images_total": 0,
            "images_missing_alt": 0,
            "og_title": None,
            "og_description": None,
            "og_image": None,
            "og_type": None,
            "twitter_card": None,
            "twitter_title": None,
            "twitter_description": None,
            "twitter_image": None,
            "json_ld_blocks": None,
            "has_schema_org": False,
            "not_publicly_available": False,
        })

    async def _persist_whois_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        repo = WhoisInformationRepository(self.db)
        await repo.create_whois({
            "website_id": website_id,
            "scan_history_id": scan_id,
            "registrar": data.get("registrar"),
            "registration_date": data.get("registration_date"),
            "expiry_date": data.get("expiry_date"),
            "updated_date": data.get("updated_date"),
            "name_servers": data.get("name_servers"),
            "source": "rdap" if data.get("source") == "rdap" else "whois",
            "not_publicly_available": False,
        })

    async def _persist_robots_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        repo = RobotsInformationRepository(self.db)
        await repo.create_robots({
            "website_id": website_id,
            "scan_history_id": scan_id,
            "url": data.get("url"),
            "exists": data.get("exists", False),
            "status_code": data.get("status_code"),
            "body": data.get("body"),
            "not_publicly_available": False,
        })

    async def _persist_sitemap_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        repo = SitemapInformationRepository(self.db)
        await repo.create_sitemap({
            "website_id": website_id,
            "scan_history_id": scan_id,
            "url": data.get("url"),
            "exists": data.get("exists", False),
            "status_code": data.get("status_code"),
            "url_count": data.get("url_count", 0),
            "sitemap_kind": data.get("sitemap_kind"),
            "not_publicly_available": False,
        })

    async def _persist_performance_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        repo = PerformanceInformationRepository(self.db)
        await repo.create_performance({
            "website_id": website_id,
            "scan_history_id": scan_id,
            "response_time_ms": data.get("response_time_ms"),
            "ttfb_ms": data.get("ttfb_ms"),
            "dns_ms": data.get("dns_ms"),
            "tcp_ms": data.get("tcp_ms"),
            "tls_ms": data.get("tls_ms"),
            "request_ms": data.get("request_ms"),
            "response_ms": data.get("response_ms"),
            "dom_processing_ms": data.get("dom_processing_ms"),
            "load_event_ms": data.get("load_event_ms"),
            "redirect_count": data.get("redirect_count", 0),
            "http_version": data.get("http_version"),
            "content_encoding": data.get("content_encoding"),
            "compression_enabled": data.get("compression_enabled", False),
            "final_url": data.get("final_url"),
            "status_code": data.get("status_code"),
            "lcp_ms": data.get("lcp_ms"),
            "cls": data.get("cls"),
            "inp_ms": data.get("inp_ms"),
            "fid_ms": data.get("fid_ms"),
            "fcp_ms": data.get("fcp_ms"),
            "speed_index_ms": data.get("speed_index_ms"),
            "page_size_bytes": data.get("page_size_bytes"),
            "page_encoded_bytes": data.get("page_encoded_bytes"),
            "page_decoded_bytes": data.get("page_decoded_bytes"),
            "request_count": data.get("request_count"),
            "dom_size": data.get("dom_size"),
            "js_bytes": data.get("js_bytes"),
            "css_bytes": data.get("css_bytes"),
            "image_bytes": data.get("image_bytes"),
            "font_bytes": data.get("font_bytes"),
            "video_bytes": data.get("video_bytes"),
            "xhr_fetch_bytes": data.get("xhr_fetch_bytes"),
            "other_bytes": data.get("other_bytes"),
            "third_party_bytes": data.get("third_party_bytes"),
            "third_party_requests": data.get("third_party_requests"),
            "js_requests": data.get("js_requests"),
            "css_requests": data.get("css_requests"),
            "image_requests": data.get("image_requests"),
            "font_requests": data.get("font_requests"),
            "video_requests": data.get("video_requests"),
            "xhr_fetch_requests": data.get("xhr_fetch_requests"),
            "other_requests": data.get("other_requests"),
            "largest_resource": data.get("largest_resource"),
            "not_publicly_available": False,
        })

    async def _persist_mobile_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        repo = MobileInformationRepository(self.db)
        await repo.create_mobile({
            "website_id": website_id,
            "scan_history_id": scan_id,
            "viewport_meta": data.get("viewport_meta"),
            "has_responsive_tag": data.get("has_responsive_tag", False),
            "not_publicly_available": False,
        })

    async def _persist_seo_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        repo = SEOInformationRepository(self.db)
        await repo.create_seo({
            "website_id": website_id,
            "scan_history_id": scan_id,
            "title": data.get("title"),
            "meta_description": data.get("meta_description"),
            "canonical_url": data.get("canonical_url"),
            "robots_meta": data.get("robots_meta"),
            "h1_count": data.get("h1_count", 0),
            "h2_count": data.get("h2_count", 0),
            "images_total": data.get("images_total", 0),
            "images_missing_alt": data.get("images_missing_alt", 0),
            "og_title": data.get("og_title"),
            "og_description": data.get("og_description"),
            "og_image": data.get("og_image"),
            "og_type": data.get("og_type"),
            "twitter_card": data.get("twitter_card"),
            "twitter_title": data.get("twitter_title"),
            "twitter_description": data.get("twitter_description"),
            "twitter_image": data.get("twitter_image"),
            "json_ld_blocks": data.get("json_ld_blocks"),
            "has_schema_org": data.get("has_schema_org", False),
            "not_publicly_available": False,
        })

    async def _persist_ssl_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        pass

    async def _persist_dns_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        pass

    async def _persist_wordpress_public(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        pass

    async def _persist_security_discovery(
        self, website_id: uuid.UUID, scan_id: uuid.UUID, data: Dict[str, Any]
    ) -> None:
        pass

    async def get_scan_history(self, website_id: uuid.UUID, limit: int = 50) -> Dict[str, Any]:
        scan_repo = WebsiteScanHistoryRepository(self.db)
        items = await scan_repo.get_by_website(website_id, limit=limit)
        return {
            "items": [WebsiteScanHistoryResponse.model_validate(item) for item in items],
            "total": len(items),
        }

    async def get_wordpress_info(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        sync_repo = WordPressSyncRepository(self.db)
        latest_sync = await sync_repo.get_latest_by_website(website_id)

        if latest_sync and latest_sync.system_info:
            system = latest_sync.system_info
            return {
                "version": system.get("wordpress_version", website.version or "unknown"),
                "phpVersion": system.get("php_version", "unknown"),
                "databaseVersion": system.get("database_version", "unknown"),
                "dbEngine": system.get("database_engine", "MySQL"),
                "restApi": system.get("rest_api_status") == "enabled",
                "cron": system.get("cron_status") == "running",
                "xmlrpc": system.get("xmlrpc_status") == "enabled",
                "debug": system.get("debug_mode", False),
                "maintenance": system.get("maintenance_mode", False),
                "autoUpdates": system.get("automatic_updates", False),
                "language": system.get("language", "en_US"),
                "timezone": system.get("timezone", "UTC"),
                "permalink": system.get("permalink_structure", "/%postname%/"),
                "memoryLimit": system.get("memory_limit", "unknown"),
                "diskUsage": system.get("disk_usage", 0),
                "uptime": system.get("server_uptime", "unknown"),
            }

        hosting_repo = HostingInformationRepository(self.db)
        latest_hosting = await hosting_repo.get_latest_by_website(website_id)

        return {
            "version": website.version or "unknown",
            "phpVersion": (latest_hosting.php_version if latest_hosting else None) or "unknown",
            "databaseVersion": (latest_hosting.database_version if latest_hosting else None) or "unknown",
            "dbEngine": "MySQL",
            "restApi": website.wp_rest_api_status != "inactive",
            "cron": True,
            "xmlrpc": website.wp_xmlrpc_status == "enabled",
            "debug": False,
            "maintenance": False,
            "autoUpdates": False,
            "language": "en_US",
            "timezone": (latest_hosting.timezone if latest_hosting else None) or "UTC",
            "permalink": "unknown",
            "memoryLimit": (latest_hosting.memory_limit if latest_hosting else None) or "unknown",
            "diskUsage": website.disk_usage or 0,
            "uptime": website.uptime or "unknown",
        }

    async def sync_wordpress(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        if not website.wp_username or not website.wp_app_password:
            raise AppException(
                message="WordPress credentials not configured. Please add WordPress username and application password.",
                status_code=400,
            )

        wp_url = website.wp_admin_url or website.url
        if not wp_url:
            raise AppException(
                message="WordPress admin URL not configured.",
                status_code=400,
            )

        credentials = {
            "username": website.wp_username,
            "app_password": self._decrypt_password(website.wp_app_password),
        }

        client = WordPressClient(wp_url, credentials["username"], credentials["app_password"])
        started_at = datetime.utcnow()

        try:
            full_sync = await client.get_full_sync()
            duration = (datetime.utcnow() - started_at).total_seconds()

            sync_repo = WordPressSyncRepository(self.db)
            await sync_repo.create_sync({
                "website_id": website_id,
                "sync_type": "full",
                "status": "completed",
                "system_info": full_sync.get("system"),
                "plugins": full_sync.get("plugins"),
                "themes": full_sync.get("themes"),
                "forms": full_sync.get("forms"),
                "security": full_sync.get("security"),
                "performance": full_sync.get("performance"),
                "health": full_sync.get("health"),
                "duration_seconds": duration,
                "synced_at": datetime.utcnow(),
            })

            await self._update_wordpress_data(website_id, full_sync)
            await self.db.commit()

            return {
                "website_id": str(website_id),
                "status": "completed",
                "synced_at": datetime.utcnow().isoformat(),
                "duration_seconds": duration,
                "system": full_sync.get("system"),
                "plugins_count": len(full_sync.get("plugins", [])),
                "themes_count": len(full_sync.get("themes", [])),
                "forms_count": len(full_sync.get("forms", {}).get("forms", [])) if isinstance(full_sync.get("forms"), dict) else 0,
            }

        except WordPressAPIError as e:
            await self.db.rollback()
            sync_repo = WordPressSyncRepository(self.db)
            await sync_repo.create_sync({
                "website_id": website_id,
                "sync_type": "full",
                "status": "failed",
                "error_message": str(e),
                "duration_seconds": (datetime.utcnow() - started_at).total_seconds(),
                "synced_at": datetime.utcnow(),
            })
            await self.db.commit()
            raise AppException(
                message=f"WordPress sync failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def _update_wordpress_data(self, website_id: uuid.UUID, full_sync: Dict[str, Any]) -> None:
        system = full_sync.get("system", {})
        plugins = full_sync.get("plugins", [])
        themes = full_sync.get("themes", [])

        update_data: Dict[str, Any] = {
            "last_scan": datetime.utcnow(),
            "cms": "wordpress",
            "version": system.get("wordpress_version"),
        }

        if system.get("memory_limit"):
            update_data["memory"] = int(self._parse_memory_to_mb(system.get("memory_limit", "0")))
        if system.get("disk_usage"):
            update_data["disk_usage"] = int(float(system.get("disk_usage", "0")))
        if system.get("server_software"):
            update_data["hosting"] = system.get("server_software")
        if system.get("timezone"):
            update_data["location"] = system.get("timezone")
        update_data["uptime"] = system.get("server_uptime", "unknown")

        await self.repo.update(website_id, update_data)

        plugin_repo = WordPressPluginRepository(self.db)
        await plugin_repo.delete_by_website(website_id)
        for plugin in plugins:
            await plugin_repo.create_plugin({
                "website_id": website_id,
                "name": plugin.get("name", "Unknown"),
                "version": plugin.get("version", "unknown"),
                "status": PluginStatusEnum.enabled if plugin.get("status") == "active" else PluginStatusEnum.disabled,
                "auto_update": plugin.get("auto_update", False),
                "last_updated": plugin.get("last_updated"),
                "description": plugin.get("description"),
                "health": "active" if plugin.get("status") == "active" else "inactive",
            })

        theme_repo = WordPressThemeRepository(self.db)
        await theme_repo.delete_by_website(website_id)
        for theme in themes:
            await theme_repo.create_theme({
                "website_id": website_id,
                "name": theme.get("name", "Unknown"),
                "version": theme.get("version", "unknown"),
                "status": ThemeStatusEnum.active if theme.get("status") == "active" else ThemeStatusEnum.inactive,
                "author": theme.get("author"),
                "updated": theme.get("updated"),
                "description": theme.get("description"),
            })

        forms_data = full_sync.get("forms", {})
        forms_list = forms_data.get("forms", []) if isinstance(forms_data, dict) else []
        website_form_repo = WebsiteFormRepository(self.db)
        await website_form_repo.delete_by_website(website_id)
        for form in forms_list:
            await website_form_repo.create_website_form({
                "website_id": website_id,
                "wordpress_form_id": str(form.get("id", "")),
                "plugin": form.get("plugin", ""),
                "name": form.get("name", "Untitled Form"),
                "description": form.get("description"),
                "status": FormStatusEnum.published if form.get("status") == "published" else FormStatusEnum.draft,
                "shortcode": form.get("shortcode"),
                "fields_count": form.get("fields_count", 0),
                "entries_count": form.get("entries_count"),
                "health": FormHealthEnum.healthy if form.get("health") == "healthy" else FormHealthEnum.unknown,
                "responsive": form.get("responsive", False),
                "auto_update_enabled": form.get("auto_update_enabled", False),
            })

    def _parse_memory_to_mb(self, memory_str: str) -> int:
        if not memory_str:
            return 0
        memory_str = str(memory_str).strip().upper()
        if memory_str.endswith("G"):
            return int(float(memory_str[:-1]) * 1024)
        if memory_str.endswith("M"):
            return int(float(memory_str[:-1]))
        if memory_str.endswith("K"):
            return int(float(memory_str[:-1]) / 1024)
        return int(memory_str)

    async def get_scan_status(self, website_id: uuid.UUID, scan_id: uuid.UUID) -> Dict[str, Any]:
        scan_repo = WebsiteScanHistoryRepository(self.db)
        scan = await scan_repo.get(scan_id)
        if not scan or scan.website_id != website_id:
            raise NotFoundException("Scan", scan_id)
        return {
            "id": str(scan.id),
            "website_id": str(scan.website_id),
            "scan_type": scan.scan_type,
            "status": scan.status,
            "started_at": scan.started_at.isoformat(),
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "duration_seconds": scan.duration_seconds,
            "error_message": scan.error_message,
            "result": scan.result,
        }

    async def get_plugins(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Fetch plugins from WordPress live, falling back to cached DB data.

        Tries a real-time request to the WordPress connector first. If WordPress
        is unreachable (502/504) or credentials are missing, returns the cached
        DB store populated during the last ``sync_wordpress``.
        """
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            plugins = await client.get_plugins()
            await self._log_plugin_operation("list", website_id, "", started_at, True, result={"count": len(plugins)})
            return plugins
        except WordPressAPIError as e:
            await self._log_plugin_operation("list", website_id, "", started_at, False, str(e))
            if e.status_code in (502, 504):
                cached = await self._get_cached_plugins(website_id)
                if cached:
                    return cached
            raise AppException(
                message=f"WordPress plugin list failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def _get_cached_plugins(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Return cached plugin data from the DB store as normalized dicts."""
        repo = WordPressPluginRepository(self.db)
        plugins = await repo.get_by_website(website_id)
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "slug": p.name.lower().replace(" ", "-") if p.name else "",
                "version": p.version or "unknown",
                "latest_version": p.version or "unknown",
                "status": p.status.value if hasattr(p, "status") and p.status else "disabled",
                "author": "",
                "description": p.description or "",
                "auto_update": p.auto_update or False,
                "license": p.license or "",
                "last_updated": p.last_updated or "",
                "update_available": False,
                "security_status": "unknown",
                "vulnerable": False,
                "health": p.health or "unknown",
                "requires_wp": "",
                "requires_php": "",
                "plugin_uri": "",
                "text_domain": "",
                "plugin_size": "",
                "install_date": "",
                "dependencies": [],
                "file": "",
            }
            for p in plugins
        ]

    async def get_themes(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Fetch themes from WordPress live, falling back to cached DB data.

        Tries a real-time request to the WordPress connector first. If WordPress
        is unreachable (502/504) or credentials are missing, returns the cached
        DB store populated during the last ``sync_wordpress`` so the UI always
        has data to display.
        """
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            themes = await client.get_themes()
            transformed = [self._normalize_theme(t) for t in themes]
            self._log_theme_operation("list", website_id, None, started_at, True)
            return transformed
        except WordPressAPIError as e:
            self._log_theme_operation("list", website_id, None, started_at, False, str(e))
            if e.status_code in (502, 504):
                cached = await self._get_cached_themes(website_id)
                if cached:
                    self._log_theme_operation("list_fallback", website_id, None, started_at, True)
                    return cached
            raise AppException(
                message=f"WordPress theme list failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def _get_cached_themes(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Return cached theme data from the DB store as normalized dicts."""
        repo = WordPressThemeRepository(self.db)
        themes = await repo.get_by_website(website_id)
        return [
            {
                "id": str(t.id),
                "name": t.name,
                "slug": t.name.lower().replace(" ", "-") if t.name else "",
                "version": t.version or "unknown",
                "status": t.status.value if hasattr(t, "status") and t.status else "inactive",
                "author": t.author or "",
                "license": t.license or "",
                "updated": t.updated or "",
                "description": t.description or "",
                "screenshot": "",
                "themeUri": "",
                "parent": "",
                "requiresWp": "",
                "requiresPhp": "",
                "autoUpdate": False,
                "lastUpdated": t.updated or "",
            }
            for t in themes
        ]

    @staticmethod
    def _normalize_theme(wp_theme: Dict[str, Any]) -> Dict[str, Any]:
        """Map WordPress theme keys to the API/Frontend camelCase schema."""
        active = wp_theme.get("active", False)
        return {
            "id": wp_theme.get("slug") or wp_theme.get("stylesheet") or str(wp_theme.get("name", "")).lower(),
            "name": wp_theme.get("name", ""),
            "slug": wp_theme.get("slug") or wp_theme.get("stylesheet", ""),
            "version": wp_theme.get("version", "unknown"),
            "status": "active" if active else "inactive",
            "author": wp_theme.get("author", ""),
            "license": wp_theme.get("license", ""),
            "updated": wp_theme.get("last_updated", wp_theme.get("updated", "")),
            "description": wp_theme.get("description", ""),
            "screenshot": wp_theme.get("screenshot_uri") or wp_theme.get("screenshot", ""),
            "themeUri": wp_theme.get("theme_uri", ""),
            "parent": wp_theme.get("parent", ""),
            "requiresWp": wp_theme.get("requires_wp", ""),
            "requiresPhp": wp_theme.get("requires_php", ""),
            "autoUpdate": wp_theme.get("auto_update", False),
            "lastUpdated": wp_theme.get("last_updated", ""),
        }

    async def _get_wp_client(self, website: "Website") -> WordPressClient:
        """Create a WordPressClient from a website's stored credentials.

        Follows the same credential-validation pattern used by
        ``sync_wordpress`` — raises AppException when credentials or the admin
        URL are missing.
        """
        if not website.wp_username or not website.wp_app_password:
            raise AppException(
                message="WordPress credentials not configured. Please add WordPress username and application password.",
                status_code=400,
            )

        wp_url = website.wp_admin_url or website.url
        if not wp_url:
            raise AppException(
                message="WordPress admin URL not configured.",
                status_code=400,
            )

        return WordPressClient(
            wp_url,
            website.wp_username,
            self._decrypt_password(website.wp_app_password),
        )

    def _log_theme_operation(
        self,
        operation: str,
        website_id: uuid.UUID,
        theme_slug: Optional[str],
        started_at: datetime,
        success: bool,
        error: Optional[str] = None,
    ) -> None:
        """Log a theme management operation for audit purposes."""
        duration = (datetime.utcnow() - started_at).total_seconds()
        status = "success" if success else "failure"
        logger.info(
            "theme_operation",
            extra={
                "operation": operation,
                "website_id": str(website_id),
                "theme_slug": theme_slug,
                "execution_time_seconds": duration,
                "user": "system",
                "status": status,
                "error": error,
            },
        )

    async def install_theme(self, website_id: uuid.UUID, theme_file_content: bytes, filename: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        max_size_bytes = settings.WORDPRESS_UPLOAD_MAX_SIZE_MB * 1024 * 1024
        if len(theme_file_content) > max_size_bytes:
            raise AppException(
                message="Theme file exceeds maximum size",
                status_code=413,
                details={"max_size_mb": settings.WORDPRESS_UPLOAD_MAX_SIZE_MB},
            )

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.install_theme(theme_file_content, filename)
            self._log_theme_operation("install", website_id, result.get("theme", {}).get("slug"), started_at, True)
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("install", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"Theme installation failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def activate_theme(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.activate_theme(slug)
            theme_repo = WordPressThemeRepository(self.db)
            await theme_repo.deactivate_all_for_website(website_id)
            await self.db.commit()
            self._log_theme_operation("activate", website_id, slug, started_at, True)
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("activate", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Theme activation failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def delete_theme(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.delete_theme(slug)
            self._log_theme_operation("delete", website_id, slug, started_at, True)
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("delete", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Theme deletion failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_theme(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_theme(slug)
            self._log_theme_operation("get_detail", website_id, slug, started_at, True)
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("get_detail", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Failed to fetch theme details: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def update_theme(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.update_theme(slug)
            self._log_theme_operation("update", website_id, slug, started_at, True)
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("update", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Theme update failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    # ------------------------------------------------------------------
    # Plugin management (live WordPress calls)
    # ------------------------------------------------------------------

    async def _log_plugin_operation(
        self,
        operation: str,
        website_id: uuid.UUID,
        plugin_slug: str,
        started_at: datetime,
        success: bool,
        error: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log a plugin management operation to the audit trail."""
        duration = (datetime.utcnow() - started_at).total_seconds()
        status = "success" if success else "failure"
        try:
            op = PluginOperationEnum(operation)
        except ValueError:
            op = PluginOperationEnum.list
        plugin_entry = PluginLog(
            website_id=website_id,
            plugin_slug=plugin_slug,
            operation=op,
            status=status,
            result=result,
            error_message=error,
            execution_time_seconds=duration,
        )
        self.db.add(plugin_entry)
        await self.db.flush()
        await self.db.commit()

    async def get_plugins(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Fetch the full, live list of installed plugins from WordPress.

        Falls back to cached DB data when WordPress is unreachable.
        """
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            plugins = await client.get_plugins()
            transformed = [self._normalize_plugin(p) for p in plugins]
            await self._log_plugin_operation("list", website_id, "", started_at, True, result={"count": len(transformed)})
            return transformed
        except WordPressAPIError as e:
            await self._log_plugin_operation("list", website_id, "", started_at, False, str(e))
            if e.status_code in (502, 504):
                cached = await self._get_cached_plugins(website_id)
                if cached:
                    return cached
            raise AppException(
                message=f"WordPress plugin list failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    @staticmethod
    def _normalize_plugin(wp_plugin: Dict[str, Any]) -> Dict[str, Any]:
        """Map WordPress plugin keys to the API/Frontend camelCase schema."""
        active = wp_plugin.get("active", False)
        update_available = wp_plugin.get("update_available", False)
        return {
            "id": wp_plugin.get("slug") or str(wp_plugin.get("name", "")).lower(),
            "name": wp_plugin.get("name", ""),
            "slug": wp_plugin.get("slug") or "",
            "version": wp_plugin.get("version", "unknown"),
            "latest_version": wp_plugin.get("latest_version", ""),
            "status": "enabled" if active else "disabled",
            "auto_update": wp_plugin.get("auto_update", False),
            "author": wp_plugin.get("author", ""),
            "description": wp_plugin.get("description", ""),
            "license": wp_plugin.get("license", ""),
            "last_updated": wp_plugin.get("last_updated", ""),
            "requires_wp": wp_plugin.get("requires_wp", ""),
            "requires_php": wp_plugin.get("requires_php", ""),
            "plugin_uri": wp_plugin.get("plugin_uri", ""),
            "text_domain": wp_plugin.get("text_domain", ""),
            "update_available": update_available,
            "security_status": wp_plugin.get("security_status", "unknown"),
            "vulnerability_count": wp_plugin.get("vulnerability_count", 0),
            "load_time_ms": wp_plugin.get("load_time_ms"),
            "memory_usage_kb": wp_plugin.get("memory_usage_kb"),
            "db_queries": wp_plugin.get("db_queries"),
            "install_date": wp_plugin.get("install_date"),
            "plugin_size": wp_plugin.get("plugin_size"),
        }

    async def _get_cached_plugins(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Return cached plugin data from the DB store as normalized dicts."""
        repo = WordPressPluginRepository(self.db)
        plugins = await repo.get_by_website(website_id)
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "slug": p.name.lower().replace(" ", "-") if p.name else "",
                "version": p.version or "unknown",
                "latest_version": "",
                "status": p.status.value if hasattr(p, "status") and p.status else "disabled",
                "auto_update": p.auto_update or False,
                "author": p.author or "",
                "description": p.description or "",
                "license": p.license or "",
                "last_updated": p.last_updated or "",
                "requires_wp": "",
                "requires_php": "",
                "plugin_uri": "",
                "text_domain": "",
                "update_available": False,
                "security_status": "unknown",
                "vulnerability_count": 0,
                "load_time_ms": None,
                "memory_usage_kb": None,
                "db_queries": None,
                "install_date": None,
                "plugin_size": None,
            }
            for p in plugins
        ]

    async def get_plugin(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_plugin(slug)
            await self._log_plugin_operation("get_detail", website_id, slug, started_at, True)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("get_detail", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Failed to fetch plugin details: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def install_plugin_from_repo(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.install_plugin_from_repo(slug)
            await self._log_plugin_operation("install", website_id, slug, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("install", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Plugin installation failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def upload_plugin(self, website_id: uuid.UUID, file_content: bytes, filename: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        max_size_bytes = settings.WORDPRESS_UPLOAD_MAX_SIZE_MB * 1024 * 1024
        if len(file_content) > max_size_bytes:
            raise AppException(
                message="Plugin file exceeds maximum size",
                status_code=413,
                details={"max_size_mb": settings.WORDPRESS_UPLOAD_MAX_SIZE_MB},
            )

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.upload_plugin(file_content, filename)
            plugin_slug = result.get("plugin", {}).get("slug", "")
            await self._log_plugin_operation("install", website_id, plugin_slug, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("install", website_id, "", started_at, False, str(e))
            raise AppException(
                message=f"Plugin upload failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def activate_plugin(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.activate_plugin(slug)
            await self._log_plugin_operation("activate", website_id, slug, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("activate", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Plugin activation failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def deactivate_plugin(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.deactivate_plugin(slug)
            await self._log_plugin_operation("deactivate", website_id, slug, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("deactivate", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Plugin deactivation failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def delete_plugin(self, website_id: uuid.UUID, slug: str, force: bool = False, delete_files: bool = False) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.delete_plugin(slug, force, delete_files)
            await self._log_plugin_operation("delete", website_id, slug, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("delete", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Plugin deletion failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def update_plugin(self, website_id: uuid.UUID, slug: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.update_plugin(slug)
            await self._log_plugin_operation("update", website_id, slug, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("update", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Plugin update failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def rollback_plugin(self, website_id: uuid.UUID, slug: str, version: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.rollback_plugin(slug, version)
            await self._log_plugin_operation("rollback", website_id, slug, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("rollback", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Plugin rollback failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def set_plugin_auto_update(self, website_id: uuid.UUID, slug: str, enabled: bool) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.set_plugin_auto_update(slug, enabled)
            operation = "auto_update_enable" if enabled else "auto_update_disable"
            await self._log_plugin_operation(operation, website_id, slug, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("auto_update", website_id, slug, started_at, False, str(e))
            raise AppException(
                message=f"Auto-update toggle failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def search_plugins(self, website_id: uuid.UUID, query: str, per_page: int = 10, page: int = 1) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.search_plugins(query, per_page, page)
            await self._log_plugin_operation("search", website_id, "", started_at, True, result={"count": len(result.get("plugins", []))})
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("search", website_id, "", started_at, False, str(e))
            raise AppException(
                message=f"Plugin search failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_plugins_health(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_plugins_health()
            await self._log_plugin_operation("health", website_id, "", started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("health", website_id, "", started_at, False, str(e))
            raise AppException(
                message=f"Plugin health check failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_plugins_security(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_plugins_security()
            await self._log_plugin_operation("security", website_id, "", started_at, True, result={"count": len(result)})
            return result
        except WordPressAPIError as e:
            await self._log_plugin_operation("security", website_id, "", started_at, False, str(e))
            raise AppException(
                message=f"Plugin security check failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_plugin_logs(self, website_id: uuid.UUID, limit: int = 50) -> List[PluginLogResponse]:
        """Return plugin operation audit logs from the DB."""
        from app.modules.website.repository import PluginLogRepository
        repo = PluginLogRepository(self.db)
        logs = await repo.get_by_website(website_id, limit)
        return [PluginLogResponse.model_validate(log) for log in logs]

    async def get_ssl(self, website_id: uuid.UUID) -> Optional[WebsiteSSLResponse]:
        repo = WebsiteSSLRepository(self.db)
        ssl = await repo.get_latest_by_website(website_id)
        if not ssl:
            raise NotFoundException("SSL information for website", website_id)
        return WebsiteSSLResponse.model_validate(ssl)

    async def get_hosting(self, website_id: uuid.UUID) -> Optional[HostingInformationResponse]:
        repo = HostingInformationRepository(self.db)
        hosting = await repo.get_latest_by_website(website_id)
        if not hosting:
            raise NotFoundException("Hosting information for website", website_id)
        return HostingInformationResponse.model_validate(hosting)

    async def get_health(self, website_id: uuid.UUID) -> Optional[WebsiteHealthResponse]:
        repo = WebsiteHealthRepository(self.db)
        health = await repo.get_latest_by_website(website_id)
        if not health:
            raise NotFoundException("Health information for website", website_id)
        return WebsiteHealthResponse.model_validate(health)

    async def get_dns(self, website_id: uuid.UUID) -> Optional[WebsiteDNSResponse]:
        repo = WebsiteDNSRepository(self.db)
        dns = await repo.get_latest_by_website(website_id)
        if not dns:
            raise NotFoundException("DNS information for website", website_id)
        return WebsiteDNSResponse.model_validate(dns)

    async def get_security(self, website_id: uuid.UUID) -> Optional[WebsiteSecurityResponse]:
        repo = WebsiteSecurityRepository(self.db)
        security = await repo.get_latest_by_website(website_id)
        if not security:
            raise NotFoundException("Security information for website", website_id)
        return WebsiteSecurityResponse.model_validate(security)

    async def capture_screenshot(self, website_id: uuid.UUID, full_page: bool = False) -> dict:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        storage_dir = Path(__file__).resolve().parent.parent.parent.parent.parent / "storage" / "screenshots"
        storage_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{website_id}.png"
        output_path = storage_dir / filename
        relative_path = f"screenshots/{filename}"

        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                self._screenshot_executor,
                self._run_playwright_capture,
                website.url,
                output_path,
                1440,
                900,
                full_page,
            )
        except ScreenshotCaptureError as e:
            screenshot_repo = WebsiteScreenshotRepository(self.db)
            await screenshot_repo.create_screenshot({
                "website_id": website_id,
                "file_path": relative_path,
                "width": 1440,
                "height": 900,
                "file_size": 0,
                "status": "failed",
                "error_message": str(e),
            })
            await self.db.commit()
            raise HTTPException(
                status_code=500,
                detail=f"Screenshot capture failed: {e}",
            )

        screenshot_repo = WebsiteScreenshotRepository(self.db)
        await screenshot_repo.create_screenshot({
            "website_id": website_id,
            "file_path": relative_path,
            "width": result["width"],
            "height": result["height"],
            "file_size": result["file_size"],
            "status": result["status"],
            "error_message": result["error_message"],
        })
        await self.db.commit()

        return {
            "path": relative_path,
            "url": f"/screenshots/{filename}",
            "width": result["width"],
            "height": result["height"],
            "file_size": result["file_size"],
            "captured_at": datetime.utcnow().isoformat(),
        }

    async def get_screenshot(self, website_id: uuid.UUID) -> dict:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        screenshot_repo = WebsiteScreenshotRepository(self.db)
        screenshot = await screenshot_repo.get_latest_by_website(website_id)
        if not screenshot:
            return {"path": f"screenshots/{website_id}.png", "url": f"/screenshots/{website_id}.png"}

        result = {
            "path": screenshot.file_path,
            "url": f"/screenshots/{Path(screenshot.file_path).name}",
            "width": screenshot.width,
            "height": screenshot.height,
            "file_size": screenshot.file_size,
            "status": screenshot.status,
            "captured_at": screenshot.captured_at.isoformat(),
        }
        if screenshot.error_message:
            result["error_message"] = screenshot.error_message
        return result

    def _make_serializable(self, obj: Any) -> Any:
        if isinstance(obj, dict):
            return {k: self._make_serializable(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        if isinstance(obj, datetime):
            return obj.isoformat()
        return obj

    async def get_seo(self, website_id: uuid.UUID) -> Dict[str, Any]:
        repo = SEOInformationRepository(self.db)
        latest = await repo.get_latest_by_website(website_id)
        if not latest:
            return {
                "title": None,
                "meta_description": None,
                "canonical_url": None,
                "robots_meta": None,
                "h1_count": 0,
                "h2_count": 0,
                "images_total": 0,
                "images_missing_alt": 0,
                "og_title": None,
                "og_description": None,
                "og_image": None,
                "og_type": None,
                "twitter_card": None,
                "twitter_title": None,
                "twitter_description": None,
                "twitter_image": None,
                "json_ld_blocks": None,
                "has_schema_org": False,
                "not_publicly_available": True,
            }
        return {
            "title": latest.title,
            "meta_description": latest.meta_description,
            "canonical_url": latest.canonical_url,
            "robots_meta": latest.robots_meta,
            "h1_count": latest.h1_count,
            "h2_count": latest.h2_count,
            "images_total": latest.images_total,
            "images_missing_alt": latest.images_missing_alt,
            "og_title": latest.og_title,
            "og_description": latest.og_description,
            "og_image": latest.og_image,
            "og_type": latest.og_type,
            "twitter_card": latest.twitter_card,
            "twitter_title": latest.twitter_title,
            "twitter_description": latest.twitter_description,
            "twitter_image": latest.twitter_image,
            "json_ld_blocks": latest.json_ld_blocks,
            "has_schema_org": latest.has_schema_org,
            "not_publicly_available": latest.not_publicly_available,
        }

    async def get_performance(self, website_id: uuid.UUID) -> Dict[str, Any]:
        repo = PerformanceInformationRepository(self.db)
        latest = await repo.get_latest_by_website(website_id)
        if not latest:
            return {
                "response_time_ms": None,
                "ttfb_ms": None,
                "dns_ms": None,
                "tcp_ms": None,
                "tls_ms": None,
                "request_ms": None,
                "response_ms": None,
                "dom_processing_ms": None,
                "load_event_ms": None,
                "redirect_count": None,
                "http_version": None,
                "content_encoding": None,
                "compression_enabled": False,
                "final_url": None,
                "status_code": None,
                "lcp_ms": None,
                "cls": None,
                "inp_ms": None,
                "fid_ms": None,
                "fcp_ms": None,
                "speed_index_ms": None,
                "page_size_bytes": None,
                "page_encoded_bytes": None,
                "page_decoded_bytes": None,
                "request_count": None,
                "dom_size": None,
                "js_bytes": None,
                "css_bytes": None,
                "image_bytes": None,
                "font_bytes": None,
                "video_bytes": None,
                "xhr_fetch_bytes": None,
                "other_bytes": None,
                "third_party_bytes": None,
                "third_party_requests": None,
                "js_requests": None,
                "css_requests": None,
                "image_requests": None,
                "font_requests": None,
                "video_requests": None,
                "xhr_fetch_requests": None,
                "other_requests": None,
                "largest_resource": None,
                "not_publicly_available": True,
            }
        return {
            "response_time_ms": latest.response_time_ms,
            "ttfb_ms": latest.ttfb_ms,
            "dns_ms": latest.dns_ms,
            "tcp_ms": latest.tcp_ms,
            "tls_ms": latest.tls_ms,
            "request_ms": latest.request_ms,
            "response_ms": latest.response_ms,
            "dom_processing_ms": latest.dom_processing_ms,
            "load_event_ms": latest.load_event_ms,
            "redirect_count": latest.redirect_count,
            "http_version": latest.http_version,
            "content_encoding": latest.content_encoding,
            "compression_enabled": latest.compression_enabled,
            "final_url": latest.final_url,
            "status_code": latest.status_code,
            "lcp_ms": latest.lcp_ms,
            "cls": latest.cls,
            "inp_ms": latest.inp_ms,
            "fid_ms": latest.fid_ms,
            "fcp_ms": latest.fcp_ms,
            "speed_index_ms": latest.speed_index_ms,
            "page_size_bytes": latest.page_size_bytes,
            "page_encoded_bytes": latest.page_encoded_bytes,
            "page_decoded_bytes": latest.page_decoded_bytes,
            "request_count": latest.request_count,
            "dom_size": latest.dom_size,
            "js_bytes": latest.js_bytes,
            "css_bytes": latest.css_bytes,
            "image_bytes": latest.image_bytes,
            "font_bytes": latest.font_bytes,
            "video_bytes": latest.video_bytes,
            "xhr_fetch_bytes": latest.xhr_fetch_bytes,
            "other_bytes": latest.other_bytes,
            "third_party_bytes": latest.third_party_bytes,
            "third_party_requests": latest.third_party_requests,
            "js_requests": latest.js_requests,
            "css_requests": latest.css_requests,
            "image_requests": latest.image_requests,
            "font_requests": latest.font_requests,
            "xhr_fetch_requests": latest.xhr_fetch_requests,
            "other_requests": latest.other_requests,
            "largest_resource": latest.largest_resource,
            "not_publicly_available": latest.not_publicly_available,
        }

    async def get_robots(self, website_id: uuid.UUID) -> Dict[str, Any]:
        repo = RobotsInformationRepository(self.db)
        latest = await repo.get_latest_by_website(website_id)
        if not latest:
            return {
                "exists": False,
                "status_code": None,
                "body": None,
                "not_publicly_available": True,
            }
        return {
            "exists": latest.exists,
            "status_code": latest.status_code,
            "body": latest.body,
            "not_publicly_available": latest.not_publicly_available,
        }

    async def get_sitemap(self, website_id: uuid.UUID) -> Dict[str, Any]:
        repo = SitemapInformationRepository(self.db)
        latest = await repo.get_latest_by_website(website_id)
        if not latest:
            return {
                "exists": False,
                "status_code": None,
                "url_count": 0,
                "sitemap_kind": None,
                "not_publicly_available": True,
            }
        return {
            "exists": latest.exists,
            "status_code": latest.status_code,
            "url_count": latest.url_count,
            "sitemap_kind": latest.sitemap_kind,
            "not_publicly_available": latest.not_publicly_available,
        }

    async def get_responsive(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        scan_repo = WebsiteScanHistoryRepository(self.db)
        latest_scan = await scan_repo.get_latest_by_website(website_id)

        screenshot_repo = WebsiteScreenshotRepository(self.db)
        latest_screenshot = await screenshot_repo.get_latest_by_website(website_id)

        base = {
            "website_id": str(website_id),
            "url": website.url,
            "responsive_score": website.responsive or 0,
            "last_scan": website.last_scan.isoformat() if website.last_scan else None,
            "scanned_at": latest_scan.started_at.isoformat() if latest_scan else None,
            "scan_status": latest_scan.status if latest_scan else "none",
        }

        if latest_scan and latest_scan.result:
            result = latest_scan.result or {}
            mobile = result.get("mobile") or {}
            base.update({
                "viewport_meta": mobile.get("viewport_meta"),
                "has_responsive_tag": mobile.get("has_responsive_tag", False),
                "responsive_score": result.get("responsive_score") or base["responsive_score"],
                "errors": result.get("errors") or [],
                "final_url": result.get("final_url"),
            })

        if latest_screenshot:
            base.update({
                "screenshot_url": f"/screenshots/{Path(latest_screenshot.file_path).name}" if latest_screenshot.file_path else None,
                "screenshot_status": latest_screenshot.status,
                "screenshot_error": latest_screenshot.error_message,
                "screenshot_width": latest_screenshot.width,
                "screenshot_height": latest_screenshot.height,
                "screenshot_file_size": latest_screenshot.file_size,
                "screenshot_captured_at": latest_screenshot.captured_at.isoformat() if latest_screenshot.captured_at else None,
            })

        health_repo = WebsiteHealthRepository(self.db)
        latest_health = await health_repo.get_latest_by_website(website_id)
        if latest_health and latest_health.details:
            details = latest_health.details or {}
            base["accessibility_score"] = details.get("accessibility_score")

        return base


    async def get_system(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_system()
            self._log_theme_operation("system_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("system_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress system info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_site_health(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_site_health()
            self._log_theme_operation("site_health_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("site_health_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress site health failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_server(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_server()
            self._log_theme_operation("server_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("server_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress server info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_database(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_database()
            self._log_theme_operation("database_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("database_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress database info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_forms(self, website_id: uuid.UUID) -> Dict[str, Any]:
        """Fetch forms from WordPress live, falling back to cached DB data."""
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_forms()
            await self._log_form_operation("list", website_id, "", started_at, True, result={"count": len(result.get("forms", []))})
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("list", website_id, "", started_at, False, str(e))
            if e.status_code in (502, 504):
                cached = await self._get_cached_forms(website_id)
                if cached:
                    return {"forms": cached}
            raise AppException(
                message=f"WordPress forms info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def _get_cached_forms(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Return cached form data from DB as normalized dicts."""
        repo = WebsiteFormRepository(self.db)
        forms = await repo.get_by_website(website_id)
        return [
            {
                "id": str(f.id),
                "plugin": f.plugin,
                "name": f.name,
                "description": f.description or "",
                "status": f.status.value if f.status else "draft",
                "shortcode": f.shortcode or "",
                "fields_count": f.fields_count,
                "entries_count": f.entries_count or 0,
                "health": f.health.value if f.health else "unknown",
                "responsive": f.responsive,
                "auto_update_enabled": f.auto_update_enabled,
                "created_at": f.created_at.isoformat(),
                "updated_at": f.updated_at.isoformat(),
                "fields": [],
            }
            for f in forms
        ]

    async def _log_form_operation(
        self,
        operation: str,
        website_id: uuid.UUID,
        form_id: str,
        started_at: datetime,
        success: bool,
        error: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        form_name: Optional[str] = None,
    ) -> None:
        """Log a form management operation to the audit trail."""
        duration = (datetime.utcnow() - started_at).total_seconds()
        status = "success" if success else "failure"
        try:
            op = FormOperationEnum(operation)
        except ValueError:
            op = FormOperationEnum.create
        entry = FormLog(
            website_id=website_id,
            form_id=form_id,
            form_name=form_name,
            operation=op,
            status=status,
            result=result,
            error_message=error,
            execution_time_seconds=duration,
        )
        self.db.add(entry)
        await self.db.flush()
        await self.db.commit()

    async def get_form(self, website_id: uuid.UUID, form_id: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_form(form_id)
            await self._log_form_operation("get_detail", website_id, form_id, started_at, True)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("get_detail", website_id, form_id, started_at, False, str(e))
            raise AppException(
                message=f"Failed to fetch form details: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def create_form(self, website_id: uuid.UUID, data: Dict[str, Any]) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        name = data.get("name", "Untitled Form")
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.create_form(data)
            await self._log_form_operation("create", website_id, name, started_at, True, result=result, form_name=name)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("create", website_id, name, started_at, False, str(e), form_name=name)
            raise AppException(
                message=f"Form creation failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def update_form(self, website_id: uuid.UUID, form_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.update_form(form_id, data)
            await self._log_form_operation("update", website_id, form_id, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("update", website_id, form_id, started_at, False, str(e))
            raise AppException(
                message=f"Form update failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def delete_form(self, website_id: uuid.UUID, form_id: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.delete_form(form_id)
            await self._log_form_operation("delete", website_id, form_id, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("delete", website_id, form_id, started_at, False, str(e))
            raise AppException(
                message=f"Form deletion failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def publish_form(self, website_id: uuid.UUID, form_id: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.publish_form(form_id)
            await self._log_form_operation("publish", website_id, form_id, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("publish", website_id, form_id, started_at, False, str(e))
            raise AppException(
                message=f"Form publish failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def unpublish_form(self, website_id: uuid.UUID, form_id: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.unpublish_form(form_id)
            await self._log_form_operation("unpublish", website_id, form_id, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("unpublish", website_id, form_id, started_at, False, str(e))
            raise AppException(
                message=f"Form unpublish failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def duplicate_form(self, website_id: uuid.UUID, form_id: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.duplicate_form(form_id)
            await self._log_form_operation("duplicate", website_id, form_id, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("duplicate", website_id, form_id, started_at, False, str(e))
            raise AppException(
                message=f"Form duplication failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def preview_form(self, website_id: uuid.UUID, form_id: str) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.preview_form(form_id)
            await self._log_form_operation("preview", website_id, form_id, started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("preview", website_id, form_id, started_at, False, str(e))
            raise AppException(
                message=f"Form preview failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_forms_health(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)

        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_forms_health()
            await self._log_form_operation("health", website_id, "", started_at, True, result=result)
            return result
        except WordPressAPIError as e:
            await self._log_form_operation("health", website_id, "", started_at, False, str(e))
            raise AppException(
                message=f"Form health check failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_form_logs(self, website_id: uuid.UUID, limit: int = 50) -> List[FormLogResponse]:
        """Return form operation audit logs from the DB."""
        repo = FormLogRepository(self.db)
        logs = await repo.get_by_website(website_id, limit)
        return [FormLogResponse.model_validate(log) for log in logs]

    async def get_pages(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_pages()
            self._log_theme_operation("pages_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("pages_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress pages info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_posts(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_posts()
            self._log_theme_operation("posts_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("posts_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress posts info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_media(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_media()
            self._log_theme_operation("media_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("media_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress media info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_users(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_users()
            self._log_theme_operation("users_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("users_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress users info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_menus(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_menus()
            self._log_theme_operation("menus_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("menus_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress menus info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_widgets(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_widgets()
            self._log_theme_operation("widgets_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("widgets_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress widgets info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_logs(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_logs()
            self._log_theme_operation("logs_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("logs_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress logs failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_backup(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_backup()
            self._log_theme_operation("backup_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("backup_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress backup info failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def generate_screenshot(self, website_id: uuid.UUID, device: str = "desktop") -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.generate_screenshot(device)
            self._log_theme_operation("screenshot_generate", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("screenshot_generate", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress screenshot generation failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_full_sync(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_full_sync()
            self._log_theme_operation("fullsync_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("fullsync_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress full sync failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_settings(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_settings()
            self._log_theme_operation("settings_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("settings_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress settings failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_categories(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_categories()
            self._log_theme_operation("categories_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("categories_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress categories failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_tags(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_tags()
            self._log_theme_operation("tags_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("tags_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress tags failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_types(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_types()
            self._log_theme_operation("types_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("types_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress types failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_shortcodes(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_shortcodes()
            self._log_theme_operation("shortcodes_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("shortcodes_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress shortcodes failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_brand_assets(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            result = await client.get_brand_assets()
            self._log_theme_operation("brand_assets_get", website_id, None, started_at, True)
            await self.db.commit()
            return result
        except WordPressAPIError as e:
            self._log_theme_operation("brand_assets_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress brand assets failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_inventory(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            async def safe_get(method_name: str, default: Any = None) -> Any:
                try:
                    method = getattr(client, method_name)
                    result = await method()
                    if isinstance(result, dict):
                        if method_name in ("get_pages", "get_posts", "get_media", "get_users", "get_menus", "get_widgets", "get_categories", "get_tags", "get_types", "get_shortcodes"):
                            key = method_name.replace("get_", "") + "s"
                            if key == "types":
                                key = "types"
                            elif key == "shortcodes":
                                key = "shortcodes"
                            elif key == "widgets":
                                key = "widgets"
                            elif key == "menus":
                                key = "menus"
                            elif key == "categories":
                                key = "categories"
                            elif key == "tags":
                                key = "tags"
                            elif key == "pages":
                                key = "pages"
                            elif key == "posts":
                                key = "posts"
                            elif key == "media":
                                key = "media"
                            elif key == "users":
                                key = "users"
                            return result.get(key, []) if isinstance(result.get(key), list) else result.get(key, default)
                    return result
                except WordPressAPIError:
                    return default
                except Exception:
                    return default

            pages = await safe_get("get_pages", [])
            posts = await safe_get("get_posts", [])
            media = await safe_get("get_media", [])
            users = await safe_get("get_users", [])
            menus = await safe_get("get_menus", [])
            widgets = await safe_get("get_widgets", [])
            categories = await safe_get("get_categories", [])
            tags = await safe_get("get_tags", [])
            types = await safe_get("get_types", [])
            shortcodes = await safe_get("get_shortcodes", [])
            plugins = await safe_get("get_plugins", [])
            themes = await safe_get("get_themes", [])
            forms_data = await safe_get("get_forms", {})

            forms_list = []
            if isinstance(forms_data, dict):
                forms_list = forms_data.get("forms", [])

            custom_post_types = []
            if isinstance(types, list):
                custom_post_types = [t for t in types if t.get("name") not in ("post", "page", "attachment")]

            inventory = {
                "pages": len(pages) if isinstance(pages, list) else 0,
                "posts": len(posts) if isinstance(posts, list) else 0,
                "media": len(media) if isinstance(media, list) else 0,
                "users": len(users) if isinstance(users, list) else 0,
                "menus": len(menus) if isinstance(menus, list) else 0,
                "widgets": len(widgets) if isinstance(widgets, list) else 0,
                "categories": len(categories) if isinstance(categories, list) else 0,
                "tags": len(tags) if isinstance(tags, list) else 0,
                "templates": len(types) if isinstance(types, list) else 0,
                "shortcodes": len(shortcodes) if isinstance(shortcodes, list) else 0,
                "customPostTypes": len(custom_post_types),
                "plugins": len(plugins) if isinstance(plugins, list) else 0,
                "themes": len(themes) if isinstance(themes, list) else 0,
                "forms": len(forms_list) if isinstance(forms_list, list) else 0,
            }

            self._log_theme_operation("inventory_get", website_id, None, started_at, True)
            await self.db.commit()
            return inventory
        except WordPressAPIError as e:
            self._log_theme_operation("inventory_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress inventory failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()

    async def get_dashboard(self, website_id: uuid.UUID) -> Dict[str, Any]:
        website = await self.repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        client = await self._get_wp_client(website)
        started_at = datetime.utcnow()
        try:
            full_sync = await client.get_full_sync()
            inventory = await self.get_inventory(website_id)
            brand_assets = await client.get_brand_assets()
            screenshot_repo = WebsiteScreenshotRepository(self.db)
            latest_screenshot = await screenshot_repo.get_latest_by_website(website_id)

            dashboard = {
                "site": {
                    "name": full_sync.get("settings", {}).get("title", website.name),
                    "url": full_sync.get("settings", {}).get("url", website.url),
                    "home": full_sync.get("settings", {}).get("home", website.url),
                    "description": full_sync.get("settings", {}).get("description", ""),
                    "language": full_sync.get("settings", {}).get("language", "en_US"),
                    "timezone": full_sync.get("settings", {}).get("timezone", "UTC"),
                    "permalink": full_sync.get("settings", {}).get("permalink_structure", "/%postname%/"),
                },
                "wordpress": {
                    "version": full_sync.get("system", {}).get("wordpress_version", website.version or "unknown"),
                    "phpVersion": full_sync.get("system", {}).get("php_version", "unknown"),
                    "databaseVersion": full_sync.get("system", {}).get("database_version", "unknown"),
                    "dbEngine": full_sync.get("system", {}).get("database_engine", "MySQL"),
                    "restApi": full_sync.get("system", {}).get("rest_api_status") == "enabled",
                    "cron": full_sync.get("system", {}).get("cron_status") == "running",
                    "xmlrpc": full_sync.get("system", {}).get("xmlrpc_status") == "enabled",
                    "debug": full_sync.get("system", {}).get("debug_mode", False),
                    "maintenance": full_sync.get("system", {}).get("maintenance_mode", False),
                    "autoUpdates": full_sync.get("system", {}).get("automatic_updates", False),
                    "language": full_sync.get("system", {}).get("language", "en_US"),
                    "timezone": full_sync.get("system", {}).get("timezone", "UTC"),
                    "permalink": full_sync.get("system", {}).get("permalink_structure", "/%postname%/"),
                    "memoryLimit": full_sync.get("system", {}).get("memory_limit", "unknown"),
                    "diskUsage": full_sync.get("system", {}).get("disk_usage", 0),
                    "uptime": full_sync.get("system", {}).get("server_uptime", "unknown"),
                },
                "themes": full_sync.get("themes", []),
                "plugins": full_sync.get("plugins", []),
                "forms": full_sync.get("forms", {}).get("forms", []) if isinstance(full_sync.get("forms"), dict) else [],
                "pages": full_sync.get("pages", {}).get("pages", []) if isinstance(full_sync.get("pages"), dict) else [],
                "posts": full_sync.get("posts", {}).get("posts", []) if isinstance(full_sync.get("posts"), dict) else [],
                "media": full_sync.get("media", {}).get("media", []) if isinstance(full_sync.get("media"), dict) else [],
                "users": full_sync.get("users", {}).get("users", []) if isinstance(full_sync.get("users"), dict) else [],
                "menus": full_sync.get("menus", {}).get("menus", []) if isinstance(full_sync.get("menus"), dict) else [],
                "widgets": full_sync.get("widgets", {}).get("widgets", []) if isinstance(full_sync.get("widgets"), dict) else [],
                "categories": full_sync.get("categories", {}).get("categories", []) if isinstance(full_sync.get("categories"), dict) else [],
                "tags": full_sync.get("tags", {}).get("tags", []) if isinstance(full_sync.get("tags"), dict) else [],
                "types": full_sync.get("types", {}).get("types", []) if isinstance(full_sync.get("types"), dict) else [],
                "shortcodes": full_sync.get("shortcodes", {}).get("shortcodes", []) if isinstance(full_sync.get("shortcodes"), dict) else [],
                "inventory": inventory,
                "brand_assets": brand_assets,
                "security": full_sync.get("security", {}),
                "performance": full_sync.get("performance", {}),
                "server": full_sync.get("system", {}),
                "hosting": full_sync.get("system", {}),
                "dns": full_sync.get("system", {}),
                "ssl": full_sync.get("system", {}),
                "screenshot": {
                    "url": latest_screenshot.url if latest_screenshot else None,
                    "status": latest_screenshot.status if latest_screenshot else None,
                    "created_at": latest_screenshot.created_at.isoformat() if latest_screenshot else None,
                },
            }

            self._log_theme_operation("dashboard_get", website_id, None, started_at, True)
            await self.db.commit()
            return dashboard
        except WordPressAPIError as e:
            self._log_theme_operation("dashboard_get", website_id, None, started_at, False, str(e))
            raise AppException(
                message=f"WordPress dashboard failed: {e.message}",
                status_code=e.status_code,
                details=e.details,
            )
        finally:
            await client.close()
