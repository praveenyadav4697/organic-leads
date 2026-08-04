from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update, delete
from app.shared.repositories.base_repository import BaseRepository
from app.modules.tracking.models import (
    TrackingScript,
    ConsentConfiguration,
    FormValidation,
    SubmissionDestination,
    EventTest,
    TrackingAuditLog,
    MeasurementPlan,
    FormSubmission,
)
from app.modules.tracking.schemas import (
    TrackingScriptCreate,
    TrackingScriptVerifyRequest,
    ConsentVerifyRequest,
    FormValidateRequest,
    RoutingDestinationCreate,
    DestinationVerifyRequest,
    EventTestRequest,
    AuditLogSearchRequest,
    MeasurementPlanCreate,
    MeasurementPlanUpdate,
)


class TrackingScriptRepository(BaseRepository[TrackingScript]):
    def __init__(self, db: AsyncSession):
        super().__init__(TrackingScript, db)

    async def get_by_website(self, website_id: Any) -> List[TrackingScript]:
        result = await self.db.execute(
            select(TrackingScript).where(TrackingScript.website_id == website_id)
        )
        return result.scalars().all()

    async def get_by_website_and_provider(
        self, website_id: Any, provider: str
    ) -> Optional[TrackingScript]:
        result = await self.db.execute(
            select(TrackingScript)
            .where(TrackingScript.website_id == website_id)
            .where(TrackingScript.provider == provider)
        )
        return result.scalar_one_or_none()

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(
            delete(TrackingScript).where(TrackingScript.website_id == website_id)
        )

    async def update_verification(
        self, script_id: Any, verification_status: str, health_status: str, details: Optional[Dict[str, Any]] = None, error_message: Optional[str] = None
    ) -> Optional[TrackingScript]:
        update_data = {
            "verification_status": verification_status,
            "health_status": health_status,
            "last_verified": func.now(),
        }
        if details is not None:
            update_data["verification_details"] = details
        if error_message is not None:
            update_data["error_message"] = error_message
        return await self.update(script_id, update_data)


class ConsentConfigurationRepository(BaseRepository[ConsentConfiguration]):
    def __init__(self, db: AsyncSession):
        super().__init__(ConsentConfiguration, db)

    async def get_by_website(self, website_id: Any) -> Optional[ConsentConfiguration]:
        result = await self.db.execute(
            select(ConsentConfiguration).where(ConsentConfiguration.website_id == website_id)
        )
        return result.scalar_one_or_none()

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(
            delete(ConsentConfiguration).where(ConsentConfiguration.website_id == website_id)
        )


class FormValidationRepository(BaseRepository[FormValidation]):
    def __init__(self, db: AsyncSession):
        super().__init__(FormValidation, db)

    async def get_by_website(self, website_id: Any) -> List[FormValidation]:
        result = await self.db.execute(
            select(FormValidation).where(FormValidation.website_id == website_id)
        )
        return result.scalars().all()

    async def get_by_website_and_form(self, website_id: Any, form_id: str) -> Optional[FormValidation]:
        result = await self.db.execute(
            select(FormValidation)
            .where(FormValidation.website_id == website_id)
            .where(FormValidation.form_id == form_id)
        )
        return result.scalar_one_or_none()

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(
            delete(FormValidation).where(FormValidation.website_id == website_id)
        )


class SubmissionDestinationRepository(BaseRepository[SubmissionDestination]):
    def __init__(self, db: AsyncSession):
        super().__init__(SubmissionDestination, db)

    async def get_by_website(self, website_id: Any) -> List[SubmissionDestination]:
        result = await self.db.execute(
            select(SubmissionDestination).where(SubmissionDestination.website_id == website_id)
        )
        return result.scalars().all()

    async def get_by_website_and_form(self, website_id: Any, form_id: str) -> List[SubmissionDestination]:
        result = await self.db.execute(
            select(SubmissionDestination)
            .where(SubmissionDestination.website_id == website_id)
            .where(SubmissionDestination.form_id == form_id)
        )
        return result.scalars().all()

    async def find_existing(
        self, website_id: Any, form_id: str, destination_type: str, destination_email: Optional[str] = None, destination_url: Optional[str] = None
    ) -> Optional[SubmissionDestination]:
        result = await self.db.execute(
            select(SubmissionDestination)
            .where(SubmissionDestination.website_id == website_id)
            .where(SubmissionDestination.form_id == form_id)
            .where(SubmissionDestination.destination_type == destination_type)
        )
        dest = result.scalar_one_or_none()
        if not dest:
            return None
        if destination_email and dest.destination_email == destination_email:
            return dest
        if destination_url and dest.destination_url == destination_url:
            return dest
        return None

    async def upsert(
        self, website_id: Any, form_id: str, destination_type: str, destination_email: Optional[str] = None, destination_url: Optional[str] = None, **kwargs
    ) -> SubmissionDestination:
        existing = await self.find_existing(website_id, form_id, destination_type, destination_email, destination_url)
        if existing:
            update_data = {
                "destination_email": destination_email or existing.destination_email,
                "destination_url": destination_url or existing.destination_url,
                "status": kwargs.get("status", existing.status),
                "verification_status": kwargs.get("verification_status", existing.verification_status),
                "is_reachable": kwargs.get("is_reachable", existing.is_reachable),
                "smtp_working": kwargs.get("smtp_working", existing.smtp_working),
                "webhook_active": kwargs.get("webhook_active", existing.webhook_active),
                "last_verified": kwargs.get("last_verified", existing.last_verified),
                "response_time_ms": kwargs.get("response_time_ms", existing.response_time_ms),
                "error_message": kwargs.get("error_message", existing.error_message),
            }
            return await self.update(existing.id, update_data)
        return await self.create({
            "website_id": website_id,
            "form_id": form_id,
            "destination_type": destination_type,
            "destination_email": destination_email,
            "destination_url": destination_url,
            **kwargs,
        })

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(
            delete(SubmissionDestination).where(SubmissionDestination.website_id == website_id)
        )


class EventTestRepository(BaseRepository[EventTest]):
    def __init__(self, db: AsyncSession):
        super().__init__(EventTest, db)

    async def get_by_website(self, website_id: Any, limit: int = 50) -> List[EventTest]:
        result = await self.db.execute(
            select(EventTest)
            .where(EventTest.website_id == website_id)
            .order_by(EventTest.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(
            delete(EventTest).where(EventTest.website_id == website_id)
        )


class TrackingAuditLogRepository(BaseRepository[TrackingAuditLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(TrackingAuditLog, db)

    async def get_by_website(
        self,
        website_id: Any,
        operation: Optional[str] = None,
        result: Optional[str] = None,
        correlation_id: Optional[str] = None,
        executed_by: Optional[str] = None,
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[TrackingAuditLog]:
        query = select(TrackingAuditLog).where(TrackingAuditLog.website_id == website_id)
        if operation:
            query = query.where(TrackingAuditLog.operation == operation)
        if result:
            query = query.where(TrackingAuditLog.result == result)
        if correlation_id:
            query = query.where(TrackingAuditLog.correlation_id == correlation_id)
        if executed_by:
            query = query.where(TrackingAuditLog.executed_by == executed_by)
        if start_date:
            query = query.where(TrackingAuditLog.created_at >= start_date)
        if end_date:
            query = query.where(TrackingAuditLog.created_at <= end_date)
        query = query.order_by(TrackingAuditLog.created_at.desc()).offset(skip).limit(limit)
        result_obj = await self.db.execute(query)
        return result_obj.scalars().all()

    async def count_by_website(
        self,
        website_id: Any,
        operation: Optional[str] = None,
        result: Optional[str] = None,
        correlation_id: Optional[str] = None,
        executed_by: Optional[str] = None,
        start_date: Optional[Any] = None,
        end_date: Optional[Any] = None,
    ) -> int:
        query = select(func.count()).select_from(TrackingAuditLog).where(TrackingAuditLog.website_id == website_id)
        if operation:
            query = query.where(TrackingAuditLog.operation == operation)
        if result:
            query = query.where(TrackingAuditLog.result == result)
        if correlation_id:
            query = query.where(TrackingAuditLog.correlation_id == correlation_id)
        if executed_by:
            query = query.where(TrackingAuditLog.executed_by == executed_by)
        if start_date:
            query = query.where(TrackingAuditLog.created_at >= start_date)
        if end_date:
            query = query.where(TrackingAuditLog.created_at <= end_date)
        count_result = await self.db.execute(query)
        return count_result.scalar_one()

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(
            delete(TrackingAuditLog).where(TrackingAuditLog.website_id == website_id)
        )


class MeasurementPlanRepository(BaseRepository[MeasurementPlan]):
    def __init__(self, db: AsyncSession):
        super().__init__(MeasurementPlan, db)

    async def get_by_website(self, website_id: Any) -> List[MeasurementPlan]:
        result = await self.db.execute(
            select(MeasurementPlan)
            .where(MeasurementPlan.website_id == website_id)
            .order_by(MeasurementPlan.created_at.desc())
        )
        return result.scalars().all()

    async def get_active(self, website_id: Any) -> Optional[MeasurementPlan]:
        result = await self.db.execute(
            select(MeasurementPlan)
            .where(MeasurementPlan.website_id == website_id)
            .where(MeasurementPlan.status == "active")
            .order_by(MeasurementPlan.created_at.desc())
        )
        return result.scalar_one_or_none()


class FormSubmissionRepository(BaseRepository[FormSubmission]):
    def __init__(self, db: AsyncSession):
        super().__init__(FormSubmission, db)

    async def get_by_website(
        self,
        website_id: Any,
        status: Optional[str] = None,
        form_id: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[FormSubmission]:
        query = select(FormSubmission).where(FormSubmission.website_id == website_id)
        if status:
            query = query.where(FormSubmission.status == status)
        if form_id:
            query = query.where(FormSubmission.form_id == form_id)
        query = query.order_by(FormSubmission.submitted_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_by_website(
        self,
        website_id: Any,
        status: Optional[str] = None,
    ) -> int:
        query = select(func.count()).select_from(FormSubmission).where(FormSubmission.website_id == website_id)
        if status:
            query = query.where(FormSubmission.status == status)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def delete_by_website(self, website_id: Any) -> None:
        await self.db.execute(
            delete(FormSubmission).where(FormSubmission.website_id == website_id)
        )