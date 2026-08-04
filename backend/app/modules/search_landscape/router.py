"""HTTP API for the F03 Search Landscape Knowledge repository."""
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.search_landscape.schemas import (
    AlgorithmUpdateResponse,
    ApprovalRequest,
    KnowledgeItemResponse,
    KnowledgeSourceResponse,
    KnowledgeVersionResponse,
    OverviewResponse,
    SearchOperatorResponse,
    SerpFeatureResponse,
    SyncLogResponse,
    SyncRequest,
)
from app.modules.search_landscape.service import SearchLandscapeService

router = APIRouter(prefix="/search-landscape", tags=["search-landscape"])


def get_search_landscape_service(
    db: AsyncSession = Depends(get_db),
) -> SearchLandscapeService:
    return SearchLandscapeService(db)


@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    return await service.get_overview()


@router.get("/serp-features", response_model=List[SerpFeatureResponse])
async def list_serp_features(
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    return await service.list_serp_features()


@router.get("/algorithms", response_model=List[AlgorithmUpdateResponse])
async def list_algorithms(
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    return await service.list_algorithms()


@router.get("/operators", response_model=List[SearchOperatorResponse])
async def list_operators(
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    return await service.list_operators()


@router.get("/knowledge", response_model=List[KnowledgeItemResponse])
async def list_knowledge(
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    return await service.list_knowledge()


@router.get("/documentation", response_model=List[KnowledgeSourceResponse])
async def list_documentation(
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    return await service.list_documentation()


@router.get("/versions", response_model=List[KnowledgeVersionResponse])
async def list_versions(
    limit: int = 200,
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    return await service.list_versions(limit=limit)


@router.get("/sync-logs", response_model=List[SyncLogResponse])
async def list_sync_logs(
    limit: int = 100,
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    return await service.list_sync_logs(limit=limit)


@router.post("/sync", response_model=SyncLogResponse)
async def run_sync(
    body: SyncRequest | None = None,
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    triggered_by = body.triggered_by if body else "system"
    return await service.run_sync(triggered_by=triggered_by)


@router.post("/{entity_type}/{entity_id}/approve")
async def approve_item(
    entity_type: str,
    entity_id: UUID,
    body: ApprovalRequest | None = None,
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    approved_by = body.approved_by if body else "system"
    return await service.approve(
        entity_type, entity_id, approved=True, approved_by=approved_by
    )


@router.post("/{entity_type}/{entity_id}/reject")
async def reject_item(
    entity_type: str,
    entity_id: UUID,
    body: ApprovalRequest | None = None,
    service: SearchLandscapeService = Depends(get_search_landscape_service),
):
    approved_by = body.approved_by if body else "system"
    return await service.approve(
        entity_type, entity_id, approved=False, approved_by=approved_by
    )
