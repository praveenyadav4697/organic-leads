from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, ConfigDict


class FoundationProject(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    domain: str
    url: str
    status: str
    verification_status: str
    verification_result: Optional[Dict[str, Any]] = None
    audit_status: str
    audit_result: Optional[Dict[str, Any]] = None
    inventory_result: Optional[Dict[str, Any]] = None
    backup_status: str
    backup_path: Optional[str] = None
    rollback_status: str
    rollback_result: Optional[Dict[str, Any]] = None
    approval_status: str
    approved_by: Optional[str] = None
    approval_notes: Optional[str] = None
    created_by: str
    updated_by: Optional[str] = None
    created_at: str
    updated_at: str


class FoundationProjectCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    domain: str
    url: str
    status: Optional[str] = "active"
    created_by: str


class FoundationProjectUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = None
    domain: Optional[str] = None
    url: Optional[str] = None
    status: Optional[str] = None
    verification_result: Optional[Dict[str, Any]] = None
    audit_result: Optional[Dict[str, Any]] = None
    inventory_result: Optional[Dict[str, Any]] = None
    backup_path: Optional[str] = None
    rollback_result: Optional[Dict[str, Any]] = None
    approved_by: Optional[str] = None
    approval_notes: Optional[str] = None
    updated_by: Optional[str] = None


class VerifyRequest(BaseModel):
    force: bool = False


class VerifyResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class InventoryRequest(BaseModel):
    scan_depth: int = 1


class InventoryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class AuditRequest(BaseModel):
    audit_type: str = "full"


class AuditResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class BackupRequest(BaseModel):
    include_media: bool = True
    include_database: bool = True


class BackupResponse(BaseModel):
    project_id: str
    status: str
    backup_path: str


class RollbackRequest(BaseModel):
    backup_path: str


class RollbackResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class ApproveRequest(BaseModel):
    approved: bool
    notes: Optional[str] = None


class ApproveResponse(BaseModel):
    project_id: str
    status: str
    approved_by: str


class PaginatedResponse(BaseModel):
    items: List[FoundationProject]
    total: int
    page: int
    page_size: int
    total_pages: int


# ---------------------------------------------------------------------------
# Discovery scan schemas
# ---------------------------------------------------------------------------


class ScanRequest(BaseModel):
    url: Optional[str] = None
    force: bool = False


class ScanResponse(BaseModel):
    project_id: str
    status: str
    scan_id: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class OverviewResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class SSLDiscoveryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class DNSDiscoveryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class SEODiscoveryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class SecurityDiscoveryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class PerformanceDiscoveryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class WordPressDiscoveryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class RobotsDiscoveryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class SitemapDiscoveryResponse(BaseModel):
    project_id: str
    status: str
    result: Dict[str, Any]


class ScreenshotResponse(BaseModel):
    project_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
