"""FastAPI router for the Search Console module.

Endpoints are split into:
  1. Frontend contract routes — property-scoped CRUD + sub-resources
     (matching ``frontend/src/modules/search-console/services.ts``).
  2. Task-specified top-level routes — connect, verify, sync, status, etc.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Annotated, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, Request, Body

from app.core.config import settings
from app.modules.search_console.schemas import (
    SearchConsolePropertyCreate,
    SearchConsolePropertyResponse,
    SearchConsolePropertyUpdate,
    UrlInspectionRequest,
    UrlInspectionResponse,
    SitemapEntry,
    SitemapCreate,
    ManualAction,
    CrawlError,
    SearchEnhancement,
    PerformanceResponse,
    SyncRequest,
    SyncResponse,
    StatusResponse,
    OAuthCallbackResponse,
    PaginatedResponse,
    PerformanceRow,
    ConnectRequest,
    VerifyRequest,
    AlertActionRequest,
)
from app.modules.search_console.service import SearchConsoleService
from app.modules.search_console.dependencies import get_search_console_service
from app.modules.search_console.exceptions import (
    PropertyNotFoundException,
    PropertyNotConnectedException,
    GoogleOAuthException,
    SyncFailedException,
    VerificationFailedException,
    SearchConsoleException,
)
from app.modules.search_console.google_client import GoogleOAuthClient
from app.modules.search_console.models import ConnectionStatusEnum
from app.modules.search_console.validators import validate_site_url

router = APIRouter(prefix="/search-console", tags=["search-console"])


# ── OAuth ───────────────────────────────────────────────────────────────────

@router.get("/oauth/authorize")
async def oauth_authorize(
    state: str = Query(..., description="Encoded state (typically the property site_url)"),
    redirect_uri: Optional[str] = Query(None),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Redirect the user to Google's OAuth consent screen."""
    auth_url = service.get_oauth_authorization_url(state, redirect_uri)
    return {"authorization_url": auth_url, "state": state}


@router.get("/oauth/callback")
async def oauth_callback(
    code: str = Query(...),
    state: str = Query(...),
    request: Request = None,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Handle the OAuth callback from Google."""
    redirect_uri = str(request.url).split("?")[0] if request else settings.GOOGLE_REDIRECT_URI
    result = await service.handle_oauth_callback(code, state, redirect_uri)
    return result


@router.get("/oauth/status")
async def oauth_status(
    property_id: str = Query(...),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Check OAuth / credential status for a property."""
    return await service.get_status(property_id)


# ── Connect (top-level) ────────────────────────────────────────────────────

@router.post("/connect")
async def connect_property(
    payload: ConnectRequest,
    request: Request = None,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Connect a new Search Console property and return the OAuth URL."""
    from app.modules.search_console.models import ConnectionStatusEnum

    # ``validate_site_url`` runs again inside ``create_property`` for defense
    # in depth, but we call it here too so the failure message is consistent
    # and we can build the auth-URL with the canonical site_url.
    site_url = validate_site_url(payload.site_url)
    property_id = payload.property_id or site_url
    property_name = payload.property_name or site_url

    create_data = {
        "property_id": property_id,
        "property_name": property_name,
        "property_type": payload.property_type,
        "site_url": site_url,
        "permission_level": payload.permission_level,
        "site_ownership": payload.site_ownership,
        "verification_method": payload.verification_method,
        "connection_status": ConnectionStatusEnum.pending,
        "created_by": payload.created_by,
    }

    prop = await service.create_property(create_data)

    base_url = str(request.url).split("?")[0]
    redirect_uri = base_url.replace("/connect", "/oauth/callback") if request else None
    auth_url = service.get_oauth_authorization_url(site_url, redirect_uri)

    return {
        "property_id": str(prop.id),
        "property_name": prop.property_name,
        "site_url": prop.site_url,
        "connection_status": prop.connection_status.value,
        "authorization_url": auth_url,
        "state": site_url,
    }


# ── Verify ─────────────────────────────────────────────────────────────────

@router.post("/verify")
async def verify_property_route(
    payload: VerifyRequest,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Verify a property's ownership."""
    return await service.verify_property(payload.property_id, payload.verification_method.value)


# ── Sync ───────────────────────────────────────────────────────────────────

@router.post("/sync")
async def sync_property_route(
    payload: Optional[SyncRequest] = Body(None),
    background_tasks: BackgroundTasks = None,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Trigger a synchronization for a property.

    Accepts an optional JSON body (``property_id`` + ``sync_type`` +
    ``force``). The body is otherwise optional — an empty body defaults
    to a ``full`` sync, with ``property_id`` then taken from the
    ``property_id`` query string.
    """
    sync_type = payload.sync_type if payload else "full"
    force = payload.force if payload else False
    property_id = payload.property_id if payload else None
    if not property_id:
        raise SearchConsoleException(
            "property_id is required (provide it in the JSON body or ?property_id=…)",
            status_code=422,
        )
    return await service.sync_property(property_id, sync_type, force)


# ── Inspect ────────────────────────────────────────────────────────────────

@router.post("/inspect")
async def inspect_url_route(
    payload: UrlInspectionRequest,
    property_id: str = Query(..., description="Property ID or site_url"),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Inspect a URL on Google's index."""
    result = await service.inspect_url(property_id, payload.inspected_url)
    return result


# ── Status ─────────────────────────────────────────────────────────────────

@router.get("/status")
async def get_status_route(
    property_id: str = Query(..., description="Property ID or site_url"),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Get the overall status of a property."""
    return await service.get_status(property_id)


# ── Properties (CRUD — frontend contract) ──────────────────────────────────

@router.post("/properties", status_code=status.HTTP_201_CREATED)
async def create_property_route(
    payload: SearchConsolePropertyCreate,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    prop = await service.create_property(payload.model_dump())
    return prop


@router.get("/properties")
async def list_properties_route(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    connection_status: Optional[str] = Query(None),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    skip = (page - 1) * page_size
    items, total = await service.get_properties(skip=skip, limit=page_size, connection_status=connection_status)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/properties/{property_id}")
async def get_property_route(
    property_id: str,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    prop = await service.get_property(property_id)
    return prop


@router.put("/properties/{property_id}")
async def update_property_route(
    property_id: str,
    payload: SearchConsolePropertyUpdate,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    prop = await service.update_property(property_id, payload.model_dump(exclude_unset=True))
    return prop


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property_route(
    property_id: str,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    await service.delete_property(property_id)
    return None


# ── Property-scoped sub-resources ───────────────────────────────────────────

@router.post("/properties/{property_id}/inspect")
async def inspect_url_property_route(
    property_id: str,
    payload: UrlInspectionRequest,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    result = await service.inspect_url(property_id, payload.inspected_url)
    return result


@router.get("/properties/{property_id}/inspections")
async def list_inspections_route(
    property_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    skip = (page - 1) * page_size
    items, total = await service.get_url_inspections(property_id, skip=skip, limit=page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/properties/{property_id}/sitemaps")
async def list_sitemaps_route(
    property_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    skip = (page - 1) * page_size
    items, total = await service.get_sitemaps(property_id, skip=skip, limit=page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/properties/{property_id}/sitemaps", status_code=status.HTTP_201_CREATED)
async def add_sitemap_route(
    property_id: str,
    payload: SitemapCreate,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    result = await service.add_sitemap(property_id, payload.model_dump())
    return result


@router.get("/properties/{property_id}/manual-actions")
async def list_manual_actions_route(
    property_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    skip = (page - 1) * page_size
    items, total = await service.get_manual_actions(property_id, skip=skip, limit=page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/properties/{property_id}/crawl-errors")
async def list_crawl_errors_route(
    property_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    error_type: Optional[str] = Query(None),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    skip = (page - 1) * page_size
    items, total = await service.get_crawl_errors(property_id, skip=skip, limit=page_size, error_type=error_type)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/properties/{property_id}/enhancements")
async def list_enhancements_route(
    property_id: str,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    return await service.get_enhancements(property_id)


@router.get("/properties/{property_id}/performance")
async def get_performance_route(
    property_id: str,
    start_date: str = Query(..., description="Start date in YYYY-MM-DD format"),
    end_date: str = Query(..., description="End date in YYYY-MM-DD format"),
    dimensions: Optional[List[str]] = Query(None),
    metrics: Optional[List[str]] = Query(None),
    row_limit: int = Query(1000, ge=1, le=25000),
    start_row: int = Query(0, ge=0),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    return await service.get_performance(
        property_id, start_date, end_date, dimensions, row_limit, start_row
    )


@router.get("/properties/{property_id}/queries")
async def get_queries_route(
    property_id: str,
    start_date: str = Query(...),
    end_date: str = Query(...),
    row_limit: int = Query(1000, ge=1, le=25000),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    return await service.get_search_queries(property_id, start_date, end_date, row_limit)


@router.get("/properties/{property_id}/pages")
async def get_pages_route(
    property_id: str,
    start_date: str = Query(...),
    end_date: str = Query(...),
    row_limit: int = Query(1000, ge=1, le=25000),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    return await service.get_pages(property_id, start_date, end_date, row_limit)


@router.get("/properties/{property_id}/devices")
async def get_devices_route(
    property_id: str,
    start_date: str = Query(...),
    end_date: str = Query(...),
    row_limit: int = Query(100, ge=1, le=1000),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    return await service.get_devices(property_id, start_date, end_date, row_limit)


@router.get("/properties/{property_id}/countries")
async def get_countries_route(
    property_id: str,
    start_date: str = Query(...),
    end_date: str = Query(...),
    row_limit: int = Query(100, ge=1, le=1000),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    return await service.get_countries(property_id, start_date, end_date, row_limit)


@router.get("/properties/{property_id}/security")
async def get_security_route(
    property_id: str,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    return await service.get_security_issues(property_id)


@router.get("/properties/{property_id}/audit-logs")
async def list_audit_logs_route(
    property_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    skip = (page - 1) * page_size
    items, total = await service.get_audit_logs(property_id, skip=skip, limit=page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/properties/{property_id}/sync-jobs")
async def list_sync_jobs_route(
    property_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    skip = (page - 1) * page_size
    items, total = await service.get_sync_jobs(property_id, skip=skip, limit=page_size, status=status)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.post("/properties/{property_id}/sync")
async def sync_property_detail_route(
    property_id: str,
    payload: Optional[SyncRequest] = None,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    sync_type = payload.sync_type if payload else "full"
    force = payload.force if payload else False
    return await service.sync_property(property_id, sync_type, force)


@router.post("/properties/{property_id}/revoke")
async def revoke_credentials_route(
    property_id: str,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    prop = await service.get_property(property_id)
    success = await service.revoke_credentials(prop.id)
    return {"property_id": str(prop.id), "revoked": success}


# ── Incremental sync ────────────────────────────────────────────────────────

@router.post("/properties/{property_id}/sync/incremental")
async def sync_incremental_route(
    property_id: str,
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Incremental sync — fetch only data that changed since the last sync."""
    return await service.sync_property_incremental(property_id)


# ── Parallel sync (multiple properties) ─────────────────────────────────────

@router.post("/sync-all")
async def sync_all_route(
    payload: dict = Body(default=None),
):
    """Trigger a parallel sync for the given property IDs (or all connected).

    Body: ``{"property_ids": ["..."], "sync_type": "full"}`` — when
    ``property_ids`` is omitted, every connected property is synced.
    """
    from app.modules.search_console.scheduler import sync_properties_parallel

    property_ids = (payload or {}).get("property_ids") or None
    sync_type = (payload or {}).get("sync_type", "full")

    if property_ids:
        return await sync_properties_parallel(property_ids, sync_type)
    from app.modules.search_console.scheduler import sync_all_connected_properties
    return await sync_all_connected_properties()


# ── Monitoring ──────────────────────────────────────────────────────────────

@router.get("/metrics")
async def search_console_metrics_route(
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Execution statistics for Search Console sync jobs."""
    return await service.get_sync_stats()


@router.get("/health")
async def search_console_health_route(
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Module health probe."""
    return await service.get_module_health()


@router.get("/jobs")
async def search_console_jobs_route():
    """List the module's registered APScheduler jobs."""
    from app.core.scheduler import get_scheduled_jobs

    jobs = get_scheduled_jobs()
    return {
        "jobs": [j for j in jobs if j["id"].startswith("search-console")],
        "total": len([j for j in jobs if j["id"].startswith("search-console")]),
    }


# ── Alerts ──────────────────────────────────────────────────────────────────

@router.get("/alerts")
async def list_alerts_route(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None, description="open | acknowledged | resolved"),
    alert_type: Optional[str] = Query(None, description="sync_failed | sync_dead_job | credential_expiring | credential_revoked | data_stale"),
    property_id: Optional[str] = Query(None),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """List monitoring alerts with optional filters."""
    skip = (page - 1) * page_size
    items, total = await service.list_alerts(
        skip=skip, limit=page_size, status=status, alert_type=alert_type, property_id=property_id
    )
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/alerts/stats")
async def alert_stats_route(
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Aggregate alert counts by status and type."""
    return await service.get_alert_stats()


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert_route(
    alert_id: uuid.UUID,
    payload: AlertActionRequest = Body(default=AlertActionRequest()),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Acknowledge an alert (stops it counting as open)."""
    return await service.acknowledge_alert(alert_id, actor=payload.actor)


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert_route(
    alert_id: uuid.UUID,
    payload: AlertActionRequest = Body(default=AlertActionRequest()),
    service: SearchConsoleService = Depends(get_search_console_service),
):
    """Resolve an alert (issue considered fixed)."""
    return await service.resolve_alert(alert_id, actor=payload.actor)
