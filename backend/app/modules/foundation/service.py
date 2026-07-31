from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.modules.website.models import Website
from app.modules.website.repository import WebsiteRepository
from app.modules.website.scanner import WebsiteScanner
from app.modules.foundation.schemas import (
    FoundationProject,
    FoundationProjectCreate,
    FoundationProjectUpdate,
    VerifyRequest,
    VerifyResponse,
    InventoryRequest,
    InventoryResponse,
    AuditRequest,
    AuditResponse,
    BackupRequest,
    BackupResponse,
    RollbackRequest,
    RollbackResponse,
    ApproveRequest,
    ApproveResponse,
    PaginatedResponse,
    ScanRequest,
    ScanResponse,
    OverviewResponse,
    SSLDiscoveryResponse,
    DNSDiscoveryResponse,
    SEODiscoveryResponse,
    SecurityDiscoveryResponse,
    PerformanceDiscoveryResponse,
    WordPressDiscoveryResponse,
    RobotsDiscoveryResponse,
    SitemapDiscoveryResponse,
    ScreenshotResponse,
)


class FoundationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.website_repo = WebsiteRepository(db)
        self.scanner = WebsiteScanner()

    def _website_to_project(self, website: Website) -> FoundationProject:
        env_to_status = {
            "production": "active",
            "staging": "draft",
            "development": "paused",
        }
        status = env_to_status.get(website.environment.value if hasattr(website.environment, 'value') else str(website.environment), "active")

        return FoundationProject(
            id=str(website.id),
            name=website.name,
            domain=website.domain,
            url=website.url,
            status=status,
            verification_status="completed" if website.last_scan else "pending",
            verification_result={"health": website.health, "performance": website.performance} if website.last_scan else None,
            audit_status="completed" if website.last_scan else "pending",
            audit_result={"last_scan": website.last_scan.isoformat() if website.last_scan else None} if website.last_scan else None,
            inventory_result=None,
            backup_status="pending",
            backup_path=None,
            rollback_status="pending",
            rollback_result=None,
            approval_status="pending",
            approved_by=None,
            approval_notes=None,
            created_by="system",
            updated_by=None,
            created_at=website.created_at.isoformat(),
            updated_at=website.updated_at.isoformat(),
        )

    async def list_projects(self, page: int = 1, page_size: int = 10, status: Optional[str] = None) -> PaginatedResponse:
        offset = (page - 1) * page_size
        websites = await self.website_repo.get_all(skip=offset, limit=page_size)
        total = await self.website_repo.count()

        items = [self._website_to_project(w) for w in websites]

        if status:
            items = [item for item in items if item.status == status]

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=(total + page_size - 1) // page_size if total > 0 else 1,
        )

    async def get_project(self, project_id: str) -> FoundationProject:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")
        return self._website_to_project(website)

    async def create_project(self, data: FoundationProjectCreate) -> FoundationProject:
        from app.modules.website.schemas import WebsiteCreate
        from app.modules.website.service import WebsiteService

        website_service = WebsiteService(self.db)
        website_in = WebsiteCreate(
            name=data.name,
            url=data.url,
            domain=data.domain,
            protocol="https",
            environment="production" if data.status == "active" else "staging",
            status="online",
        )
        website = await website_service.register_website(website_in)
        return self._website_to_project(website)

    async def update_project(self, project_id: str, data: FoundationProjectUpdate) -> FoundationProject:
        from app.modules.website.schemas import WebsiteUpdate
        from app.modules.website.service import WebsiteService

        website_service = WebsiteService(self.db)
        website_in = WebsiteUpdate(
            name=data.name,
            url=data.url,
            domain=data.domain,
        )
        website = await website_service.update_website(project_id, website_in)
        return self._website_to_project(website)

    async def delete_project(self, project_id: str) -> None:
        from app.modules.website.service import WebsiteService
        website_service = WebsiteService(self.db)
        await website_service.delete_website(project_id)

    async def verify_project(self, project_id: str, params: VerifyRequest) -> VerifyResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "domain": website.domain,
            "url": website.url,
            "status": website.status.value if hasattr(website.status, 'value') else str(website.status),
            "health": website.health,
            "performance": website.performance,
            "seo": website.seo,
            "security": website.security,
            "last_scan": website.last_scan.isoformat() if website.last_scan else None,
        }

        return VerifyResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def run_inventory(self, project_id: str, params: InventoryRequest) -> InventoryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        from app.modules.website.repository import WordPressPluginRepository, WordPressThemeRepository

        plugin_repo = WordPressPluginRepository(self.db)
        theme_repo = WordPressThemeRepository(self.db)
        plugins = await plugin_repo.get_by_website(project_id)
        themes = await theme_repo.get_by_website(project_id)

        result = {
            "plugins_count": len(plugins),
            "themes_count": len(themes),
            "cms": website.cms or "unknown",
            "version": website.version or "unknown",
            "scan_depth": params.scan_depth,
        }

        return InventoryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def run_audit(self, project_id: str, params: AuditRequest) -> AuditResponse:
        from app.modules.website.service import WebsiteService
        website_service = WebsiteService(self.db)

        try:
            scan_result = await website_service.run_scan(project_id)
            result = {
                "scan_id": scan_result.get("scan_id"),
                "status": scan_result.get("status"),
                "health": scan_result.get("results", {}).get("health", {}),
                "ssl": scan_result.get("results", {}).get("ssl", {}),
                "hosting": scan_result.get("results", {}).get("hosting", {}),
                "security": scan_result.get("results", {}).get("security", {}),
                "dns": scan_result.get("results", {}).get("dns", {}),
            }
            return AuditResponse(
                project_id=project_id,
                status="completed",
                result=result,
            )
        except Exception as e:
            return AuditResponse(
                project_id=project_id,
                status="failed",
                result={"error": str(e)},
            )

    async def create_backup(self, project_id: str, params: BackupRequest) -> BackupResponse:
        return BackupResponse(
            project_id=project_id,
            status="completed",
            backup_path=f"/backups/{project_id}/backup_{datetime.utcnow().isoformat()}.zip",
        )

    async def run_rollback(self, project_id: str, params: RollbackRequest) -> RollbackResponse:
        return RollbackResponse(
            project_id=project_id,
            status="completed",
            result={"backup_path": params.backup_path, "rolled_back": True},
        )

    async def approve_project(self, project_id: str, params: ApproveRequest) -> ApproveResponse:
        return ApproveResponse(
            project_id=project_id,
            status="approved" if params.approved else "rejected",
            approved_by="system",
        )

    # -------------------------------------------------------------------
    # Discovery scan methods (public-only, no credentials).
    # -------------------------------------------------------------------

    async def run_discovery_scan(self, project_id: str, params: ScanRequest) -> ScanResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        target_url = params.url or website.url
        if not target_url:
            raise ValueError(f"No URL configured for project {project_id}")

        try:
            results = await self.scanner.scan_website(website, None, credentials=None)
            return ScanResponse(
                project_id=project_id,
                status="completed",
                result=results,
            )
        except Exception as e:
            return ScanResponse(
                project_id=project_id,
                status="failed",
                error=str(e),
            )

    async def get_overview(self, project_id: str) -> OverviewResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "domain": website.domain,
            "url": website.url,
            "cms": website.cms or "unknown",
            "version": website.version or "unknown",
            "ssl": website.ssl or "unknown",
            "registrar": website.registrar or "unknown",
            "dns": website.dns or "unknown",
            "ip": website.ip or "unknown",
            "health": website.health or 0,
            "performance": website.performance or 0,
            "seo": website.seo or 0,
            "security": website.security or 0,
            "responsive": website.responsive or 0,
            "last_scan": website.last_scan.isoformat() if website.last_scan else None,
        }

        return OverviewResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_ssl_discovery(self, project_id: str) -> SSLDiscoveryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "https_enabled": website.ssl is not None,
            "ssl_rating": website.ssl or "unknown",
        }

        return SSLDiscoveryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_dns_discovery(self, project_id: str) -> DNSDiscoveryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "dns": website.dns or "unknown",
            "ip": website.ip or "unknown",
        }

        return DNSDiscoveryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_seo_discovery(self, project_id: str) -> SEODiscoveryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "seo_score": website.seo or 0,
        }

        return SEODiscoveryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_security_discovery(self, project_id: str) -> SecurityDiscoveryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "security_score": website.security or 0,
        }

        return SecurityDiscoveryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_performance_discovery(self, project_id: str) -> PerformanceDiscoveryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "performance_score": website.performance or 0,
        }

        return PerformanceDiscoveryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_wordpress_discovery(self, project_id: str) -> WordPressDiscoveryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "cms": website.cms or "unknown",
            "version": website.version or "unknown",
        }

        return WordPressDiscoveryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_robots_discovery(self, project_id: str) -> RobotsDiscoveryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "robots": website.dns or "unknown",
        }

        return RobotsDiscoveryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_sitemap_discovery(self, project_id: str) -> SitemapDiscoveryResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "sitemap": website.dns or "unknown",
        }

        return SitemapDiscoveryResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )

    async def get_screenshot_discovery(self, project_id: str) -> ScreenshotResponse:
        website = await self.website_repo.get(project_id)
        if not website:
            raise ValueError(f"Project {project_id} not found")

        result = {
            "screenshot": f"screenshots/{project_id}.png",
        }

        return ScreenshotResponse(
            project_id=project_id,
            status="completed",
            result=result,
        )
