from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
import uuid
from typing import Dict, Any, List
from pydantic import BaseModel

from app.core.database import get_db
from app.modules.website.schemas import (
    WebsiteCreate,
    WebsiteUpdate,
    WebsiteResponse,
    WebsiteScanHistoryResponse,
    WordPressPluginResponse,
    WordPressThemeResponse,
    WebsiteSSLResponse,
    HostingInformationResponse,
    WebsiteHealthResponse,
    WebsiteDNSResponse,
    WebsiteSecurityResponse,
)
from app.modules.website.service import WebsiteService
from app.modules.website.dependencies import get_website_service

router = APIRouter(prefix="/websites", tags=["websites"])


class PaginatedWebsiteResponse(BaseModel):
    items: List[WebsiteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


@router.post("/", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED)
async def register_website(
    website_in: WebsiteCreate,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.register_website(website_in)


@router.post("/register", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED)
async def register_website_alias(
    website_in: WebsiteCreate,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.register_website(website_in)


@router.get("/", response_model=PaginatedWebsiteResponse)
async def list_websites(
    page: int = 1,
    page_size: int = 10,
    service: WebsiteService = Depends(get_website_service),
):
    limit = page_size
    skip = (page - 1) * page_size
    items = await service.list_websites(skip=skip, limit=limit)
    total = await service.repo.count()
    return PaginatedWebsiteResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size if total > 0 else 1,
    )


@router.get("/{website_id}", response_model=WebsiteResponse)
async def get_website(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_website(website_id)


@router.put("/{website_id}", response_model=WebsiteResponse)
async def update_website(
    website_id: uuid.UUID,
    website_in: WebsiteUpdate,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.update_website(website_id, website_in)


@router.delete("/{website_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_website(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    await service.delete_website(website_id)


@router.post("/{website_id}/scan", response_model=Dict[str, Any])
async def run_scan(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.run_scan(website_id)


@router.get("/{website_id}/scan/{scan_id}", response_model=Dict[str, Any])
async def get_scan_status(
    website_id: uuid.UUID,
    scan_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_scan_status(website_id, scan_id)


@router.get("/{website_id}/plugins", response_model=List[WordPressPluginResponse])
async def get_plugins(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_plugins(website_id)


@router.get("/{website_id}/themes", response_model=List[WordPressThemeResponse])
async def get_themes(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_themes(website_id)


@router.get("/{website_id}/ssl", response_model=WebsiteSSLResponse)
async def get_ssl(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_ssl(website_id)


@router.get("/{website_id}/hosting", response_model=HostingInformationResponse)
async def get_hosting(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_hosting(website_id)


@router.get("/{website_id}/health", response_model=WebsiteHealthResponse)
async def get_health(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_health(website_id)


@router.get("/{website_id}/dns", response_model=WebsiteDNSResponse)
async def get_dns(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_dns(website_id)


@router.post("/{website_id}/screenshot", response_model=Dict[str, Any])
async def capture_screenshot(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.capture_screenshot(website_id)


@router.post("/{website_id}/diagnostics", response_model=Dict[str, Any])
async def run_diagnostics(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.run_scan(website_id)


@router.get("/{website_id}/screenshot", response_model=Dict[str, Any])
async def get_screenshot(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_screenshot(website_id)


@router.get("/{website_id}/scan-history", response_model=Dict[str, Any])
async def get_scan_history(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_scan_history(website_id)


@router.get("/{website_id}/plugin-scans", response_model=List[WordPressPluginResponse])
async def get_plugin_scans(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_plugins(website_id)


@router.get("/{website_id}/theme-scans", response_model=List[WordPressThemeResponse])
async def get_theme_scans(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_themes(website_id)


@router.get("/{website_id}/wordpress", response_model=Dict[str, Any])
async def get_wordpress_info(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_wordpress_info(website_id)


@router.get("/{website_id}/security", response_model=WebsiteSecurityResponse)
async def get_security(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_security(website_id)


@router.post("/{website_id}/sync-wordpress", response_model=Dict[str, Any])
async def sync_wordpress(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.sync_wordpress(website_id)


@router.get("/{website_id}/seo", response_model=Dict[str, Any])
async def get_seo(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_seo(website_id)


@router.get("/{website_id}/performance", response_model=Dict[str, Any])
async def get_performance(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_performance(website_id)


@router.get("/{website_id}/robots", response_model=Dict[str, Any])
async def get_robots(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_robots(website_id)


@router.get("/{website_id}/sitemap", response_model=Dict[str, Any])
async def get_sitemap(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_sitemap(website_id)


@router.get("/{website_id}/responsive", response_model=Dict[str, Any])
async def get_responsive(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_responsive(website_id)
