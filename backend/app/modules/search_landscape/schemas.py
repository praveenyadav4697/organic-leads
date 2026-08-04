"""Pydantic schemas for the F03 Search Landscape Knowledge module."""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# SERP features
# ---------------------------------------------------------------------------


class SerpFeatureResponse(ORMModel):
    id: UUID
    name: str
    description: str
    supported: bool
    documentation_url: Optional[str] = None
    search_engines: Optional[List[str]] = None
    markets: Optional[List[str]] = None
    devices: Optional[List[str]] = None
    version: str
    source: Optional[str] = None
    status: str
    approval_status: str
    updated_at: datetime


# ---------------------------------------------------------------------------
# Algorithm updates
# ---------------------------------------------------------------------------


class AlgorithmUpdateResponse(ORMModel):
    id: UUID
    name: str
    release_date: Optional[datetime] = None
    status: str
    summary: str
    priority: str
    documentation_url: Optional[str] = None
    version: str
    source: Optional[str] = None
    item_status: str
    approval_status: str
    updated_at: datetime


# ---------------------------------------------------------------------------
# Search operators
# ---------------------------------------------------------------------------


class SearchOperatorResponse(ORMModel):
    id: UUID
    operator: str
    purpose: str
    example: Optional[str] = None
    supported: bool
    search_engines: Optional[List[str]] = None
    notes: Optional[str] = None
    version: str
    source: Optional[str] = None
    status: str
    approval_status: str
    updated_at: datetime


# ---------------------------------------------------------------------------
# Knowledge items
# ---------------------------------------------------------------------------


class KnowledgeItemResponse(ORMModel):
    id: UUID
    category: str
    title: str
    content: str
    summary: Optional[str] = None
    references: Optional[Dict[str, Any]] = None
    priority: str
    requires_approval: bool
    version: str
    source: Optional[str] = None
    status: str
    approval_status: str
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Knowledge versions
# ---------------------------------------------------------------------------


class KnowledgeVersionResponse(ORMModel):
    id: UUID
    entity_type: str
    entity_id: UUID
    version: int
    change_summary: Optional[str] = None
    snapshot: Optional[Dict[str, Any]] = None
    status: str
    approval_status: str
    source: Optional[str] = None
    created_at: datetime


# ---------------------------------------------------------------------------
# Knowledge sources (documentation)
# ---------------------------------------------------------------------------


class KnowledgeSourceResponse(ORMModel):
    id: UUID
    name: str
    url: str
    category: Optional[str] = None
    status: str
    version: str
    last_synced: Optional[datetime] = None
    last_reviewed: Optional[datetime] = None
    retry_count: int
    error: Optional[str] = None
    correlation_id: Optional[str] = None
    last_fetched_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Sync history
# ---------------------------------------------------------------------------


class SyncLogResponse(ORMModel):
    id: UUID
    correlation_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    retry_count: int
    error: Optional[str] = None
    items_created: int
    items_updated: int
    details: Optional[Dict[str, Any]] = None
    triggered_by: Optional[str] = None


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------


class OverviewResponse(BaseModel):
    knowledge_version: Optional[str] = None
    last_sync: Optional[datetime] = None
    last_update: Optional[datetime] = None
    total_search_rules: int = 0
    total_serp_features: int = 0
    supported_engines: List[str] = []
    algorithm_updates: int = 0
    pending_approvals: int = 0
    sources: int = 0
    markets: List[str] = []
    devices: List[str] = []


# ---------------------------------------------------------------------------
# Requests
# ---------------------------------------------------------------------------


class SyncRequest(BaseModel):
    triggered_by: Optional[str] = "system"


class ApprovalRequest(BaseModel):
    approved_by: Optional[str] = "system"
