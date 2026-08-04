from fastapi import APIRouter, Depends, HTTPException, Query, status
from uuid import UUID
import uuid
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.core.exceptions import AppException
from app.modules.tracking.schemas import (
    TrackingScriptVerifyRequest,
    TrackingScriptVerifyResponse,
    ScanRequest,
    ScanResponse,
    DashboardStats,
    FormValidateRequest,
    FormValidateResponse,
    FormTestRequest,
    FormTestResponse,
    ConsentVerifyRequest,
    ConsentVerifyResponse,
    ConsentDetailsResponse,
    FormSubmissionSummaryResponse,
    DestinationVerifyRequest,
    DestinationVerifyResponse,
    EventTestRequest,
    EventTestResponse,
    AuditLogSearchRequest,
    AuditLogListResponse,
    AuditLogResponse,
    TrackingScriptsDiscoveryResponse,
    TrackingVerificationListResponse,
    SpamProtectionResponse,
    MeasurementPlanCreate,
    MeasurementPlanUpdate,
    MeasurementPlanResponse,
    MeasurementPlanListResponse,
    FormSubmissionListResponse,
)
from app.modules.tracking.service import TrackingService
from app.modules.tracking.dependencies import get_tracking_service

router = APIRouter(prefix="/tracking", tags=["tracking"])


async def resolve_path_website_id(website_id: str, service: TrackingService) -> UUID:
    if website_id == "default":
        return await service.resolve_website_id(None)
    try:
        return UUID(website_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid website id") from exc


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_api(
    website_id: Optional[UUID] = Query(default=None),
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await service.resolve_website_id(website_id)
    return await service.get_dashboard_stats(resolved_id)


@router.get("/providers")
async def get_tracking_providers_api(
    website_id: Optional[UUID] = Query(default=None),
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await service.resolve_website_id(website_id)
    return await service.get_tracking_providers(resolved_id)


@router.get("/forms")
async def get_tracking_forms_api(
    website_id: Optional[UUID] = Query(default=None),
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await service.resolve_website_id(website_id)
    result = await service.get_forms_discovery(resolved_id)
    return {"items": result.items, "total": result.total}


@router.get("/submissions", response_model=FormSubmissionListResponse)
async def get_tracking_submissions_api(
    website_id: Optional[UUID] = Query(default=None),
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await service.resolve_website_id(website_id)
    return await service.get_form_submissions(resolved_id, form_id=None, status=status, page=page, page_size=page_size)


@router.get("/verification", response_model=TrackingVerificationListResponse)
async def get_tracking_verification_api(
    website_id: Optional[UUID] = Query(default=None),
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await service.resolve_website_id(website_id)
    return await service.get_tracking_verification(resolved_id)


@router.get("/consent", response_model=ConsentVerifyResponse)
async def get_consent_api(
    website_id: Optional[UUID] = Query(default=None),
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await service.resolve_website_id(website_id)
    return await service.get_consent_config(resolved_id)


@router.get("/spam", response_model=SpamProtectionResponse)
async def get_spam_api(
    website_id: Optional[UUID] = Query(default=None),
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await service.resolve_website_id(website_id)
    return await service.get_spam_protection(resolved_id)


@router.get("/{website_id}/scripts", response_model=List[Dict[str, Any]])
async def get_tracking_scripts(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_tracking_scripts(resolved_id)


@router.post("/{website_id}/scripts/{script_id}/verify", response_model=TrackingScriptVerifyResponse)
async def verify_tracking_script(
    website_id: str,
    script_id: str,
    req: TrackingScriptVerifyRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.verify_tracking_script(resolved_id, script_id, req)


@router.get("/{website_id}/forms", response_model=Dict[str, Any])
async def get_forms_discovery(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    result = await service.get_forms_discovery(resolved_id)
    return {"items": result.items, "total": result.total}


@router.post("/{website_id}/forms/{form_id}/validate", response_model=FormValidateResponse)
async def validate_form(
    website_id: str,
    form_id: str,
    req: FormValidateRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.validate_form(resolved_id, form_id, req)


@router.post("/{website_id}/forms/{form_id}/test", response_model=FormTestResponse)
async def test_submission(
    website_id: str,
    form_id: str,
    req: FormTestRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.test_form_submission(resolved_id, form_id, req)


@router.get("/{website_id}/consent", response_model=ConsentVerifyResponse)
async def get_consent_config(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_consent_config(resolved_id)


@router.get("/{website_id}/consent/details", response_model=ConsentDetailsResponse)
async def get_consent_details(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_consent_details(resolved_id)


@router.post("/{website_id}/consent/verify", response_model=ConsentVerifyResponse)
async def verify_consent(
    website_id: str,
    req: ConsentVerifyRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.verify_consent(resolved_id, req)


@router.get("/{website_id}/routing", response_model=Dict[str, Any])
async def get_routing_destinations(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    result = await service.get_routing_destinations(resolved_id)
    return {"items": result.items, "total": result.total}


@router.post("/{website_id}/routing/refresh")
async def refresh_routing_destinations(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    synced_count = await service.sync_routing_destinations(resolved_id)
    result = await service.get_routing_destinations(resolved_id)
    return {"synced_count": synced_count, "items": result.items, "total": result.total}


@router.post("/{website_id}/routing/{destination_id}/verify", response_model=DestinationVerifyResponse)
async def verify_destination(
    website_id: str,
    destination_id: str,
    req: DestinationVerifyRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.verify_destination(resolved_id, destination_id, req)


@router.post("/{website_id}/events/test", response_model=EventTestResponse)
async def run_event_test(
    website_id: str,
    req: EventTestRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.run_event_test(resolved_id, req)


@router.get("/{website_id}/audit-logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    website_id: str,
    operation: Optional[str] = None,
    result: Optional[str] = None,
    correlation_id: Optional[str] = None,
    executed_by: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    from datetime import datetime
    search_req = AuditLogSearchRequest(
        operation=operation,
        result=result,
        correlation_id=correlation_id,
        executed_by=executed_by,
        start_date=datetime.fromisoformat(start_date) if start_date else None,
        end_date=datetime.fromisoformat(end_date) if end_date else None,
        page=page,
        page_size=page_size,
    )
    return await service.get_audit_logs(resolved_id, search_req)


@router.post("/{website_id}/scan", response_model=ScanResponse)
async def run_full_scan(
    website_id: str,
    req: ScanRequest,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.run_full_scan(resolved_id, req)


@router.get("/{website_id}/dashboard", response_model=DashboardStats)
async def get_dashboard(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_dashboard_stats(resolved_id)


@router.get("/{website_id}/tracking-scripts/discovery", response_model=TrackingScriptsDiscoveryResponse)
async def get_tracking_scripts_discovery(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_tracking_scripts_discovery(resolved_id)


@router.get("/{website_id}/tracking-scripts/verify", response_model=TrackingVerificationListResponse)
async def get_tracking_verification(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_tracking_verification(resolved_id)


@router.get("/{website_id}/spam-protection", response_model=SpamProtectionResponse)
async def get_spam_protection(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_spam_protection(resolved_id)


@router.get("/{website_id}/forms/{form_id}/fields")
async def get_form_fields(
    website_id: str,
    form_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_form_fields(resolved_id, form_id)


@router.get("/{website_id}/forms/{form_id}/destinations")
async def get_form_destinations(
    website_id: str,
    form_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_form_destinations(resolved_id, form_id)


@router.get("/{website_id}/forms/{form_id}/submissions", response_model=FormSubmissionListResponse)
async def get_form_submissions(
    website_id: str,
    form_id: str,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_form_submissions(resolved_id, form_id, status=status, page=page, page_size=page_size)


@router.get("/{website_id}/submissions", response_model=FormSubmissionListResponse)
async def get_all_form_submissions(
    website_id: str,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 50,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_form_submissions(resolved_id, form_id=None, status=status, page=page, page_size=page_size)


@router.get("/{website_id}/submissions/summary", response_model=FormSubmissionSummaryResponse)
async def get_submissions_summary(
    website_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_submissions_summary(resolved_id)


@router.get("/{website_id}/measurement-plans", response_model=MeasurementPlanListResponse)
async def get_measurement_plans(
    website_id: str,
    page: int = 1,
    page_size: int = 50,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_measurement_plans(resolved_id, page=page, page_size=page_size)


@router.post("/{website_id}/measurement-plans", response_model=MeasurementPlanResponse)
async def create_measurement_plan(
    website_id: str,
    req: MeasurementPlanCreate,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.create_measurement_plan(resolved_id, req)


@router.get("/{website_id}/measurement-plans/{plan_id}", response_model=MeasurementPlanResponse)
async def get_measurement_plan(
    website_id: str,
    plan_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.get_measurement_plan(resolved_id, plan_id)


@router.put("/{website_id}/measurement-plans/{plan_id}", response_model=MeasurementPlanResponse)
async def update_measurement_plan(
    website_id: str,
    plan_id: str,
    req: MeasurementPlanUpdate,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return await service.update_measurement_plan(resolved_id, plan_id, req)


@router.delete("/{website_id}/measurement-plans/{plan_id}")
async def delete_measurement_plan(
    website_id: UUID,
    plan_id: str,
    service: TrackingService = Depends(get_tracking_service),
):
    resolved_id = await resolve_path_website_id(website_id, service)
    return {"deleted": await service.delete_measurement_plan(resolved_id, plan_id)}