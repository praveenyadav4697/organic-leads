from datetime import datetime, timezone
from typing import List, Optional, Annotated
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.onpage_seo.service import OnPageSEOService
from app.modules.onpage_seo.dependencies import get_onpage_seo_service
from app.modules.onpage_seo.schemas import (
    SEOPageResponse,
    SEOPageCreate,
    SEOPageUpdate,
    SEOAuditFindingResponse,
    SEOKeywordResponse,
    SEMetaTagResponse,
    SEHeadingResponse,
    SEContentResponse,
    SEImageResponse,
    SEInternalLinkResponse,
    SEExternalLinkResponse,
    SECanonicalResponse,
    SERobotsResponse,
    SESitemapResponse,
    SESchemaResponse,
    SEAnswerReadinessResponse,
    SERecommendationResponse,
    SEOHistoryEntry,
    SEOLogsEntry,
    PaginatedResponse,
    SEOScanRequest,
    SEOScanResponse,
    SEOExportResponse,
    BulkOptimizationRequest,
    BulkOptimizationResult,
    ApprovalRequest,
    ApprovalResponse,
    SEOFilters,
)
from app.modules.onpage_seo.exceptions import (
    PageNotFoundException,
    OnPageSEOException,
    AnalysisFailedException,
)

router = APIRouter(prefix="/onpage", tags=["onpage-seo"])


# --- Overview -----------------------------------------------------------

@router.get("/overview")
async def get_overview(
    website: Optional[str] = Query(None, description="Filter by website ID"),
    page: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    seo_score_min: Optional[float] = Query(None),
    seo_score_max: Optional[float] = Query(None),
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    template: Optional[str] = Query(None),
    language: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None),
    schema_type: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    if not website:
        raise OnPageSEOException("website parameter is required", status_code=422)
    filters = {
        k: v for k, v in {
            "page": page,
            "category": category,
            "seo_score_min": seo_score_min,
            "seo_score_max": seo_score_max,
            "status": status,
            "severity": severity,
            "keyword": keyword,
            "template": template,
            "language": language,
            "content_type": content_type,
            "schema_type": schema_type,
            "date_from": date_from,
            "date_to": date_to,
        }.items() if v is not None
    }
    return await service.get_overview(website, filters)


# --- Pages (CRUD) -------------------------------------------------------

@router.post("/pages", status_code=status.HTTP_201_CREATED)
async def create_page(
    payload: SEOPageCreate,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    return await service.create_page(payload.model_dump())


@router.get("/pages")
async def list_pages(
    website: str = Query(..., description="Website ID"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    sort_by: str = Query("seo_score"),
    sort_order: str = Query("desc"),
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    skip = (page - 1) * page_size
    items, total = await service.get_pages(
        website, skip=skip, limit=page_size,
        status=status, sort_by=sort_by, sort_order=sort_order,
    )
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("/pages/{page_id}")
async def get_page_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    return await service.get_page(page_id)


@router.put("/pages/{page_id}")
async def update_page_route(
    page_id: str,
    payload: SEOPageUpdate,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    return await service.update_page(page_id, payload.model_dump(exclude_unset=True))


@router.delete("/pages/{page_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_page_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    await service.delete_page(page_id)
    return None


# --- Audit --------------------------------------------------------------

@router.post("/pages/{page_id}/audit")
async def run_audit_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    return await service.run_audit(page_id)


@router.get("/pages/{page_id}/audit")
async def get_audit_route(
    page_id: str,
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    skip = (page - 1) * page_size
    page_obj = await service.get_page(page_id)
    items, total = await service.finding_repo.get_by_page(
        page_obj.id, skip=skip, limit=page_size,
        severity=severity, status=status, category=category,
    )
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# --- Keywords -----------------------------------------------------------

@router.get("/pages/{page_id}/keywords")
async def get_keywords_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    return await service.keyword_repo.get_by_page(page.id)


# --- Meta Tags ----------------------------------------------------------

@router.get("/pages/{page_id}/meta")
async def get_meta_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    return await service.meta_tag_repo.get_by_page(page.id)


# --- Headings -----------------------------------------------------------

@router.get("/pages/{page_id}/headings")
async def get_headings_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    return await service.heading_repo.get_by_page(page.id)


# --- Content ------------------------------------------------------------

@router.get("/pages/{page_id}/content")
async def get_content_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    result = await service.content_repo.get_by_page(page.id)
    return result


# --- Images -------------------------------------------------------------

@router.get("/pages/{page_id}/images")
async def get_images_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    return await service.image_repo.get_by_page(page.id)


# --- Internal Links -----------------------------------------------------

@router.get("/pages/{page_id}/internal-links")
async def get_internal_links_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    return await service.internal_link_repo.get_by_page(page.id)


# --- External Links -----------------------------------------------------

@router.get("/pages/{page_id}/external-links")
async def get_external_links_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    return await service.external_link_repo.get_by_page(page.id)


# --- Canonical ----------------------------------------------------------

@router.get("/pages/{page_id}/canonical")
async def get_canonical_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    result = await service.canonical_repo.get_by_page(page.id)
    return result


# --- Robots -------------------------------------------------------------

@router.get("/pages/{page_id}/robots")
async def get_robots_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    result = await service.robots_repo.get_by_page(page.id)
    return result


# --- Sitemap ------------------------------------------------------------

@router.get("/pages/{page_id}/sitemap")
async def get_sitemap_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    result = await service.sitemap_repo.get_by_page(page.id)
    return result


# --- Schema -------------------------------------------------------------

@router.get("/pages/{page_id}/schema")
async def get_schema_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    return await service.schema_repo.get_by_page(page.id)


# --- Answer Readiness ---------------------------------------------------

@router.get("/pages/{page_id}/answer-readiness")
async def get_answer_readiness_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    result = await service.answer_readiness_repo.get_by_page(page.id)
    return result


# --- Recommendations ----------------------------------------------------

@router.get("/pages/{page_id}/recommendations")
async def get_recommendations_route(
    page_id: str,
    status: Optional[str] = Query(None),
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    page = await service.get_page(page_id)
    return await service.recommendation_repo.get_by_page(page.id, status)


@router.put("/recommendations/{recommendation_id}")
async def update_recommendation_route(
    recommendation_id: str,
    payload: dict,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    return await service.update_recommendation(recommendation_id, payload)


# --- Scan ---------------------------------------------------------------

@router.post("/scan", status_code=status.HTTP_202_ACCEPTED)
async def run_scan(
    payload: SEOScanRequest,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    scan_id = f"scan-{uuid4().hex[:8]}"
    started_at = datetime.now(timezone.utc)

    # Resolve targets: explicit page IDs/URLs first, otherwise every page under the website.
    targets: list[str] = []
    if payload.pages:
        targets = list(payload.pages)
    else:
        pages, _ = await service.page_repo.get_by_website(payload.website_id)
        targets = [str(p.id) for p in pages]

    results: list[dict] = []
    issues_found = 0
    for page_id in targets:
        try:
            result = await service.run_audit(page_id)
            results.append({"page_id": page_id, "status": "completed", **result})
            issues_found += result.get("findings_count", 0)
        except PageNotFoundException as e:
            results.append({"page_id": page_id, "status": "failed", "error": str(e)})
        except Exception as e:
            results.append({"page_id": page_id, "status": "failed", "error": str(e)})

    completed = sum(1 for r in results if r.get("status") == "completed")
    return {
        "scan_id": scan_id,
        "status": "completed" if completed == len(results) else "partial",
        "started_at": started_at.isoformat(),
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "pages_scanned": completed,
        "issues_found": issues_found,
        "results": results,
    }


# --- Verify Fixes -------------------------------------------------------

@router.post("/pages/{page_id}/verify")
async def verify_fixes_route(
    page_id: str,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    return await service.verify_fixes(page_id)


# --- Bulk Operations ----------------------------------------------------

@router.post("/bulk-optimize")
async def bulk_optimize_route(
    payload: BulkOptimizationRequest,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    return await service.bulk_optimize(payload.page_ids, payload.action, payload.data)


@router.post("/pages/{page_id}/approve")
async def approve_changes_route(
    page_id: str,
    payload: ApprovalRequest,
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    action = payload.action
    item_ids = payload.items or []
    counts = {"approved": 0, "rejected": 0, "completed": 0}

    for rec_id in item_ids:
        try:
            if action == "approve":
                await service.update_recommendation(rec_id, {"status": "approved"})
                counts["approved"] += 1
            elif action == "reject":
                await service.update_recommendation(rec_id, {"status": "rejected"})
                counts["rejected"] += 1
            elif action == "mark_complete":
                await service.update_recommendation(rec_id, {"status": "completed"})
                counts["completed"] += 1
        except Exception:
            # Skip individual failures; the frontend sees the totals.
            continue

    return counts


# --- Export -------------------------------------------------------------

@router.post("/pages/{page_id}/export")
async def export_data_route(
    page_id: str,
    format: str = Query("csv"),
    scope: Optional[str] = Query(None),
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    from datetime import timedelta

    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    return {
        "download_url": f"/api/v1/onpage/pages/{page_id}/export/{format}",
        "format": format,
        "expires_at": expires_at.isoformat(),
    }


# --- History ------------------------------------------------------------

@router.get("/pages/{page_id}/history")
async def get_history_route(
    page_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    skip = (page - 1) * page_size
    page_obj = await service.get_page(page_id)
    items, total = await service.history_repo.get_by_page(page_obj.id, skip, page_size)
    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


# --- Logs ---------------------------------------------------------------

@router.get("/logs")
async def get_logs_route(
    page_id: Optional[str] = Query(None),
    website: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    service: OnPageSEOService = Depends(get_onpage_seo_service),
):
    skip = (page - 1) * page_size

    if page_id:
        page_obj = await service.get_page(page_id)
        items, total = await service.logs_repo.get_by_page(page_obj.id, skip, page_size, log_type=type)
    elif website:
        items, total = await service.logs_repo.get_by_website(website, skip, page_size, log_type=type)
    else:
        return {"items": [], "total": 0, "page": 1, "page_size": page_size, "total_pages": 0}

    total_pages = (total + page_size - 1) // page_size if page_size > 0 else 0
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }