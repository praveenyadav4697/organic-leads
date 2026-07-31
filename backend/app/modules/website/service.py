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
)
from app.modules.website.schemas import (
    WebsiteCreate,
    WebsiteUpdate,
    WebsiteResponse,
    WordPressPluginResponse,
    WordPressThemeResponse,
    WebsiteSSLResponse,
    HostingInformationResponse,
    WebsiteHealthResponse,
    WebsiteDNSResponse,
    WebsiteSecurityResponse,
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
)
from app.modules.website.scanner import WebsiteScanner
from app.modules.website.screenshot import ScreenshotService, ScreenshotCaptureError
from app.modules.website.wp_client import WordPressClient, WordPressAPIError
import uuid


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
            "redirect_count": data.get("redirect_count", 0),
            "http_version": data.get("http_version"),
            "content_encoding": data.get("content_encoding"),
            "compression_enabled": data.get("compression_enabled", False),
            "final_url": data.get("final_url"),
            "status_code": data.get("status_code"),
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

    async def get_plugins(self, website_id: uuid.UUID) -> List[WordPressPluginResponse]:
        repo = WordPressPluginRepository(self.db)
        plugins = await repo.get_by_website(website_id)
        return [WordPressPluginResponse.model_validate(p) for p in plugins]

    async def get_themes(self, website_id: uuid.UUID) -> List[WordPressThemeResponse]:
        repo = WordPressThemeRepository(self.db)
        themes = await repo.get_by_website(website_id)
        return [WordPressThemeResponse.model_validate(t) for t in themes]

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
                "redirect_count": None,
                "http_version": None,
                "content_encoding": None,
                "compression_enabled": False,
                "final_url": None,
                "status_code": None,
                "not_publicly_available": True,
            }
        return {
            "response_time_ms": latest.response_time_ms,
            "ttfb_ms": latest.ttfb_ms,
            "redirect_count": latest.redirect_count,
            "http_version": latest.http_version,
            "content_encoding": latest.content_encoding,
            "compression_enabled": latest.compression_enabled,
            "final_url": latest.final_url,
            "status_code": latest.status_code,
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
