from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from uuid import UUID
import uuid
from typing import Dict, Any, List
from pydantic import BaseModel

from app.core.database import get_db
from app.core.exceptions import AppException
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
    ThemeActivateRequest,
    ThemeUpdateRequest,
    PluginActivateRequest,
    PluginDeactivateRequest,
    PluginUpdateRequest,
    PluginRollbackRequest,
    PluginAutoUpdateRequest,
    PluginInstallRepoRequest,
    PluginLogResponse,
    FormCreateRequest,
    FormUpdateRequest,
    FormPublishRequest,
    FormUnpublishRequest,
    FormDuplicateRequest,
    FormLogResponse,
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


@router.post("", response_model=WebsiteResponse, status_code=status.HTTP_201_CREATED)
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


@router.get("", response_model=PaginatedWebsiteResponse)
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


@router.get("/{website_id}/themes", response_model=List[Dict[str, Any]])
async def get_themes(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_themes(website_id)


@router.get("/{website_id}/themes/{slug}", response_model=Dict[str, Any])
async def get_theme(
    website_id: uuid.UUID,
    slug: str,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_theme(website_id, slug)


@router.post("/{website_id}/themes/install", response_model=Dict[str, Any])
async def install_theme(
    website_id: uuid.UUID,
    theme_file: UploadFile = File(...),
    service: WebsiteService = Depends(get_website_service),
):
    if not theme_file.filename or not theme_file.filename.lower().endswith(".zip"):
        raise AppException(
            message="Invalid file type. Only .zip files are accepted",
            status_code=422,
        )
    file_content = await theme_file.read()
    return await service.install_theme(website_id, file_content, theme_file.filename)


@router.post("/{website_id}/themes/activate", response_model=Dict[str, Any])
async def activate_theme(
    website_id: uuid.UUID,
    body: ThemeActivateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.activate_theme(website_id, body.slug)


@router.delete("/{website_id}/themes/{slug}", response_model=Dict[str, Any])
async def delete_theme(
    website_id: uuid.UUID,
    slug: str,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.delete_theme(website_id, slug)


@router.post("/{website_id}/themes/update", response_model=Dict[str, Any])
async def update_theme(
    website_id: uuid.UUID,
    body: ThemeUpdateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.update_theme(website_id, body.slug)


@router.get("/{website_id}/plugins", response_model=List[Dict[str, Any]])
async def get_plugins(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_plugins(website_id)


@router.get("/{website_id}/plugins/{slug}", response_model=Dict[str, Any])
async def get_plugin(
    website_id: uuid.UUID,
    slug: str,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_plugin(website_id, slug)


@router.post("/{website_id}/plugins/install", response_model=Dict[str, Any])
async def install_plugin_from_repo(
    website_id: uuid.UUID,
    body: PluginInstallRepoRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.install_plugin_from_repo(website_id, body.slug)


@router.post("/{website_id}/plugins/upload", response_model=Dict[str, Any])
async def upload_plugin(
    website_id: uuid.UUID,
    plugin_file: UploadFile = File(...),
    service: WebsiteService = Depends(get_website_service),
):
    if not plugin_file.filename or not plugin_file.filename.lower().endswith(".zip"):
        raise AppException(
            message="Invalid file type. Only .zip files are accepted",
            status_code=422,
        )
    file_content = await plugin_file.read()
    return await service.upload_plugin(website_id, file_content, plugin_file.filename)


@router.post("/{website_id}/plugins/activate", response_model=Dict[str, Any])
async def activate_plugin(
    website_id: uuid.UUID,
    body: PluginActivateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.activate_plugin(website_id, body.slug)


@router.post("/{website_id}/plugins/deactivate", response_model=Dict[str, Any])
async def deactivate_plugin(
    website_id: uuid.UUID,
    body: PluginDeactivateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.deactivate_plugin(website_id, body.slug)


@router.delete("/{website_id}/plugins/{slug}", response_model=Dict[str, Any])
async def delete_plugin(
    website_id: uuid.UUID,
    slug: str,
    force: bool = False,
    delete_files: bool = False,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.delete_plugin(website_id, slug, force, delete_files)


@router.post("/{website_id}/plugins/update", response_model=Dict[str, Any])
async def update_plugin(
    website_id: uuid.UUID,
    body: PluginUpdateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.update_plugin(website_id, body.slug)


@router.post("/{website_id}/plugins/rollback", response_model=Dict[str, Any])
async def rollback_plugin(
    website_id: uuid.UUID,
    body: PluginRollbackRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.rollback_plugin(website_id, body.slug, body.version)


@router.post("/{website_id}/plugins/auto-update", response_model=Dict[str, Any])
async def set_plugin_auto_update(
    website_id: uuid.UUID,
    body: PluginAutoUpdateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.set_plugin_auto_update(website_id, body.slug, body.enabled)


@router.get("/{website_id}/plugins/search", response_model=Dict[str, Any])
async def search_plugins(
    website_id: uuid.UUID,
    query: str,
    per_page: int = 10,
    page: int = 1,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.search_plugins(website_id, query, per_page, page)


@router.get("/{website_id}/plugins/health", response_model=Dict[str, Any])
async def get_plugins_health(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_plugins_health(website_id)


@router.get("/{website_id}/plugins/security", response_model=List[Dict[str, Any]])
async def get_plugins_security(
    website_id: uuid.UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_plugins_security(website_id)


@router.get("/{website_id}/plugin-logs", response_model=List[PluginLogResponse])
async def get_plugin_logs(
    website_id: uuid.UUID,
    limit: int = 50,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_plugin_logs(website_id, limit)


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


@router.get("/{website_id}/plugin-scans", response_model=List[Dict[str, Any]])
async def get_plugin_scans(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_plugins(website_id)


@router.get("/{website_id}/theme-scans", response_model=List[Dict[str, Any]])
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



# ===========================================================================
# Connector Plugin - Full Website Management Endpoints
# ===========================================================================


@router.get("/{website_id}/system", response_model=Dict[str, Any])
async def get_system(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_system(website_id)


@router.get("/{website_id}/site-health", response_model=Dict[str, Any])
async def get_site_health(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_site_health(website_id)


@router.get("/{website_id}/server", response_model=Dict[str, Any])
async def get_server(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_server(website_id)


@router.get("/{website_id}/database", response_model=Dict[str, Any])
async def get_database(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_database(website_id)


@router.get("/{website_id}/forms", response_model=Dict[str, Any])
async def get_forms(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_forms(website_id)


@router.get("/{website_id}/forms/{form_id}", response_model=Dict[str, Any])
async def get_form(
    website_id: UUID,
    form_id: str,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_form(website_id, form_id)


@router.post("/{website_id}/forms", response_model=Dict[str, Any])
async def create_form(
    website_id: UUID,
    body: FormCreateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.create_form(website_id, body.model_dump())


@router.put("/{website_id}/forms/{form_id}", response_model=Dict[str, Any])
async def update_form(
    website_id: UUID,
    form_id: str,
    body: FormUpdateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.update_form(website_id, form_id, body.model_dump(exclude_unset=True))


@router.delete("/{website_id}/forms/{form_id}", response_model=Dict[str, Any])
async def delete_form(
    website_id: UUID,
    form_id: str,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.delete_form(website_id, form_id)


@router.post("/{website_id}/forms/publish", response_model=Dict[str, Any])
async def publish_form(
    website_id: UUID,
    body: FormPublishRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.publish_form(website_id, body.form_id)


@router.post("/{website_id}/forms/unpublish", response_model=Dict[str, Any])
async def unpublish_form(
    website_id: UUID,
    body: FormUnpublishRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.unpublish_form(website_id, body.form_id)


@router.post("/{website_id}/forms/duplicate", response_model=Dict[str, Any])
async def duplicate_form(
    website_id: UUID,
    body: FormDuplicateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.duplicate_form(website_id, body.form_id)


@router.post("/{website_id}/forms/preview", response_model=Dict[str, Any])
async def preview_form(
    website_id: UUID,
    body: FormDuplicateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.preview_form(website_id, body.form_id)


@router.get("/{website_id}/forms/health", response_model=Dict[str, Any])
async def get_forms_health(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_forms_health(website_id)


@router.get("/{website_id}/form-logs", response_model=List[FormLogResponse])
async def get_form_logs(
    website_id: UUID,
    limit: int = 50,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_form_logs(website_id, limit)


@router.get("/{website_id}/pages", response_model=Dict[str, Any])
async def get_pages(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_pages(website_id)


@router.get("/{website_id}/posts", response_model=Dict[str, Any])
async def get_posts(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_posts(website_id)


@router.get("/{website_id}/media", response_model=Dict[str, Any])
async def get_media(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_media(website_id)


@router.get("/{website_id}/users", response_model=Dict[str, Any])
async def get_users(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_users(website_id)


@router.get("/{website_id}/menus", response_model=Dict[str, Any])
async def get_menus(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_menus(website_id)


@router.get("/{website_id}/widgets", response_model=Dict[str, Any])
async def get_widgets(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_widgets(website_id)


@router.get("/{website_id}/logs", response_model=Dict[str, Any])
async def get_logs(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_logs(website_id)


@router.get("/{website_id}/backup", response_model=Dict[str, Any])
async def get_backup(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_backup(website_id)


@router.post("/{website_id}/screenshot/generate", response_model=Dict[str, Any])
async def generate_screenshot(
    website_id: UUID,
    body: ThemeActivateRequest,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.generate_screenshot(website_id, body.slug)


@router.get("/{website_id}/full-sync", response_model=Dict[str, Any])
async def get_full_sync(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_full_sync(website_id)


@router.get("/{website_id}/settings", response_model=Dict[str, Any])
async def get_settings(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_settings(website_id)


@router.get("/{website_id}/categories", response_model=Dict[str, Any])
async def get_categories(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_categories(website_id)


@router.get("/{website_id}/tags", response_model=Dict[str, Any])
async def get_tags(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_tags(website_id)


@router.get("/{website_id}/types", response_model=Dict[str, Any])
async def get_types(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_types(website_id)


@router.get("/{website_id}/shortcodes", response_model=Dict[str, Any])
async def get_shortcodes(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_shortcodes(website_id)


@router.get("/{website_id}/brand-assets", response_model=Dict[str, Any])
async def get_brand_assets(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_brand_assets(website_id)


@router.get("/{website_id}/inventory", response_model=Dict[str, Any])
async def get_inventory(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_inventory(website_id)


@router.get("/{website_id}/dashboard", response_model=Dict[str, Any])
async def get_dashboard(
    website_id: UUID,
    service: WebsiteService = Depends(get_website_service),
):
    return await service.get_dashboard(website_id)

