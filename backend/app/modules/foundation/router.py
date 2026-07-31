from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.modules.foundation.schemas import (
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
from app.modules.foundation.service import FoundationService
from app.modules.website.dependencies import get_website_service

router = APIRouter(prefix="/foundation", tags=["foundation"])


def get_foundation_service(db: AsyncSession = Depends(get_db)) -> FoundationService:
    return FoundationService(db)


@router.get("/projects", response_model=PaginatedResponse)
async def list_projects(
    page: int = 1,
    page_size: int = 10,
    status: Optional[str] = None,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.list_projects(page=page, page_size=page_size, status=status)


@router.get("/projects/{project_id}", response_model=dict)
async def get_project(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_project(project_id)


@router.post("/projects", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_project(
    data: FoundationProjectCreate,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.create_project(data)


@router.put("/projects/{project_id}", response_model=dict)
async def update_project(
    project_id: str,
    data: FoundationProjectUpdate,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.update_project(project_id, data)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    await service.delete_project(project_id)


@router.post("/projects/{project_id}/verify", response_model=VerifyResponse)
async def verify_project(
    project_id: str,
    params: VerifyRequest,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.verify_project(project_id, params)


@router.post("/projects/{project_id}/inventory", response_model=InventoryResponse)
async def run_inventory(
    project_id: str,
    params: InventoryRequest,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.run_inventory(project_id, params)


@router.post("/projects/{project_id}/audit", response_model=AuditResponse)
async def run_audit(
    project_id: str,
    params: AuditRequest,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.run_audit(project_id, params)


@router.post("/projects/{project_id}/backup", response_model=BackupResponse)
async def create_backup(
    project_id: str,
    params: BackupRequest,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.create_backup(project_id, params)


@router.post("/projects/{project_id}/rollback", response_model=RollbackResponse)
async def run_rollback(
    project_id: str,
    params: RollbackRequest,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.run_rollback(project_id, params)


@router.post("/projects/{project_id}/approve", response_model=ApproveResponse)
async def approve_project(
    project_id: str,
    params: ApproveRequest,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.approve_project(project_id, params)


# ---------------------------------------------------------------------------
# Discovery scan endpoints (public-only, no credentials required).
# ---------------------------------------------------------------------------


@router.post("/projects/{project_id}/scan", response_model=ScanResponse)
async def run_discovery_scan(
    project_id: str,
    params: ScanRequest,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.run_discovery_scan(project_id, params)


@router.post("/projects/{project_id}/scan/full", response_model=ScanResponse)
async def run_full_discovery_scan(
    project_id: str,
    params: ScanRequest,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.run_discovery_scan(project_id, params)


@router.get("/projects/{project_id}/overview", response_model=OverviewResponse)
async def get_overview(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_overview(project_id)


@router.get("/projects/{project_id}/ssl", response_model=SSLDiscoveryResponse)
async def get_ssl_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_ssl_discovery(project_id)


@router.get("/projects/{project_id}/dns", response_model=DNSDiscoveryResponse)
async def get_dns_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_dns_discovery(project_id)


@router.get("/projects/{project_id}/seo", response_model=SEODiscoveryResponse)
async def get_seo_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_seo_discovery(project_id)


@router.get("/projects/{project_id}/security", response_model=SecurityDiscoveryResponse)
async def get_security_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_security_discovery(project_id)


@router.get("/projects/{project_id}/performance", response_model=PerformanceDiscoveryResponse)
async def get_performance_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_performance_discovery(project_id)


@router.get("/projects/{project_id}/wordpress", response_model=WordPressDiscoveryResponse)
async def get_wordpress_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_wordpress_discovery(project_id)


@router.get("/projects/{project_id}/robots", response_model=RobotsDiscoveryResponse)
async def get_robots_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_robots_discovery(project_id)


@router.get("/projects/{project_id}/sitemap", response_model=SitemapDiscoveryResponse)
async def get_sitemap_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_sitemap_discovery(project_id)


@router.get("/projects/{project_id}/screenshot", response_model=ScreenshotResponse)
async def get_screenshot_discovery(
    project_id: str,
    service: FoundationService = Depends(get_foundation_service),
):
    return await service.get_screenshot_discovery(project_id)
