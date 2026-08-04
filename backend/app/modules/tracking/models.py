import enum
from datetime import datetime
from sqlalchemy import (
    String, Text, Integer, Float, Boolean, DateTime, Enum, ForeignKey, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid

from app.core.database import Base
from app.modules.website.models import Website


class TrackingProviderEnum(str, enum.Enum):
    google_analytics_4 = "google_analytics_4"
    google_tag_manager = "google_tag_manager"
    meta_pixel = "meta_pixel"
    google_ads = "google_ads"
    linkedin_insight = "linkedin_insight"
    microsoft_clarity = "microsoft_clarity"
    custom_javascript = "custom_javascript"
    google_search_console = "google_search_console"
    google_site_kit = "google_site_kit"
    monsterinsights = "monsterinsights"
    pixelyoursite = "pixelyoursite"
    wpcode = "wpcode"
    header_footer_code_manager = "header_footer_code_manager"
    manual_scripts = "manual_scripts"


class TrackingStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    error = "error"
    pending = "pending"


class VerificationStatusEnum(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    failed = "failed"
    warning = "warning"


class HealthStatusEnum(str, enum.Enum):
    healthy = "healthy"
    degraded = "degraded"
    unhealthy = "unhealthy"
    unknown = "unknown"


class ConsentStatusEnum(str, enum.Enum):
    accepted = "accepted"
    rejected = "rejected"
    customized = "customized"


class DeliveryStatusEnum(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    delivered = "delivered"
    failed = "failed"
    retrying = "retrying"


class EventTypeEnum(str, enum.Enum):
    page_view = "page_view"
    session_start = "session_start"
    cta_click = "cta_click"
    button_click = "button_click"
    form_start = "form_start"
    form_submit = "form_submit"
    phone_click = "phone_click"
    email_click = "email_click"
    whatsapp_click = "whatsapp_click"
    purchase = "purchase"
    download = "download"
    custom = "custom"


class TrackingScript(Base):
    __tablename__ = "tracking_scripts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[TrackingProviderEnum] = mapped_column(Enum(TrackingProviderEnum), nullable=False, index=True)
    tracking_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    status: Mapped[TrackingStatusEnum] = mapped_column(Enum(TrackingStatusEnum), default=TrackingStatusEnum.pending, index=True)
    verification_status: Mapped[VerificationStatusEnum] = mapped_column(Enum(VerificationStatusEnum), default=VerificationStatusEnum.pending, index=True)
    health_status: Mapped[HealthStatusEnum] = mapped_column(Enum(HealthStatusEnum), default=HealthStatusEnum.unknown, index=True)
    installation_method: Mapped[str | None] = mapped_column(String(100), nullable=True)
    detected_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    last_verified: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    verification_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    settings: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="tracking_scripts")

    __table_args__ = (
        Index("ix_tracking_scripts_website", "website_id"),
        Index("ix_tracking_scripts_provider", "provider"),
        Index("ix_tracking_scripts_tracking_id", "tracking_id"),
    )


class ConsentConfiguration(Base):
    __tablename__ = "consent_configurations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    cookie_banner_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    consent_mode: Mapped[str | None] = mapped_column(String(50), nullable=True)
    privacy_policy_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    terms_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cookie_categories: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    status: Mapped[ConsentStatusEnum] = mapped_column(Enum(ConsentStatusEnum), default=ConsentStatusEnum.rejected, index=True)
    verification_status: Mapped[VerificationStatusEnum] = mapped_column(Enum(VerificationStatusEnum), default=VerificationStatusEnum.pending, index=True)
    last_verified: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="consent_configs")

    __table_args__ = (
        Index("ix_consent_configs_website", "website_id"),
    )


class FormValidation(Base):
    __tablename__ = "form_validations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    form_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    form_name: Mapped[str] = mapped_column(String(255), nullable=False)
    plugin: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    validation_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    required_fields_present: Mapped[bool] = mapped_column(Boolean, default=False)
    email_validation: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_validation: Mapped[bool] = mapped_column(Boolean, default=False)
    empty_fields_check: Mapped[bool] = mapped_column(Boolean, default=False)
    spam_protection: Mapped[bool] = mapped_column(Boolean, default=False)
    captcha_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    recaptcha_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    hcaptcha_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    honeypot_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    duplicate_protection: Mapped[bool] = mapped_column(Boolean, default=False)
    file_upload_validation: Mapped[bool] = mapped_column(Boolean, default=False)
    required_checkbox: Mapped[bool] = mapped_column(Boolean, default=False)
    health_status: Mapped[HealthStatusEnum] = mapped_column(Enum(HealthStatusEnum), default=HealthStatusEnum.unknown, index=True)
    validation_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="form_validations")

    __table_args__ = (
        Index("ix_form_validations_website", "website_id"),
        Index("ix_form_validations_form", "form_id"),
        Index("ix_form_validations_plugin", "plugin"),
    )


class SubmissionDestination(Base):
    __tablename__ = "submission_destinations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    form_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    destination_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    destination_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    destination_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[TrackingStatusEnum] = mapped_column(Enum(TrackingStatusEnum), default=TrackingStatusEnum.pending, index=True)
    verification_status: Mapped[VerificationStatusEnum] = mapped_column(Enum(VerificationStatusEnum), default=VerificationStatusEnum.pending, index=True)
    is_reachable: Mapped[bool] = mapped_column(Boolean, default=False)
    smtp_working: Mapped[bool] = mapped_column(Boolean, default=False)
    webhook_active: Mapped[bool] = mapped_column(Boolean, default=False)
    last_verified: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="submission_destinations")

    __table_args__ = (
        Index("ix_sub_destinations_website", "website_id"),
        Index("ix_sub_destinations_form", "form_id"),
        Index("ix_sub_destinations_type", "destination_type"),
    )


class EventTest(Base):
    __tablename__ = "event_tests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[EventTypeEnum] = mapped_column(Enum(EventTypeEnum), nullable=False, index=True)
    event_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[TrackingStatusEnum] = mapped_column(Enum(TrackingStatusEnum), default=TrackingStatusEnum.pending, index=True)
    success: Mapped[bool] = mapped_column(Boolean, default=False)
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    event_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    destination: Mapped[str | None] = mapped_column(String(500), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    correlation_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    created_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="event_tests")

    __table_args__ = (
        Index("ix_event_tests_website", "website_id"),
        Index("ix_event_tests_type", "event_type"),
        Index("ix_event_tests_correlation", "correlation_id"),
    )


class TrackingAuditLog(Base):
    __tablename__ = "tracking_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    operation: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    result: Mapped[str] = mapped_column(String(20), nullable=False)
    duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    correlation_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    warning_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    log_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_logs_website", "website_id"),
        Index("ix_audit_logs_operation", "operation"),
        Index("ix_audit_logs_correlation", "correlation_id"),
        Index("ix_audit_logs_created", "created_at"),
    )


class MeasurementPlanStatusEnum(str, enum.Enum):
    draft = "draft"
    active = "active"
    completed = "completed"
    archived = "archived"


class MeasurementPlan(Base):
    __tablename__ = "measurement_plans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[MeasurementPlanStatusEnum] = mapped_column(Enum(MeasurementPlanStatusEnum), default=MeasurementPlanStatusEnum.draft, index=True)
    business_goals: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    target_events: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    kpi_definitions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    tracking_providers: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    kpi_targets: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="measurement_plans")

    __table_args__ = (
        Index("ix_measurement_plans_website", "website_id"),
        Index("ix_measurement_plans_status", "status"),
    )


class FormSubmissionStatusEnum(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    delivered = "delivered"
    failed = "failed"
    spamming = "spamming"


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    website_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("websites.id", ondelete="CASCADE"), nullable=False, index=True)
    form_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    form_name: Mapped[str] = mapped_column(String(255), nullable=False)
    plugin: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    visitor_ip: Mapped[str | None] = mapped_column(String(50), nullable=True)
    visitor_user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    submission_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    destination_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    destination_address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[FormSubmissionStatusEnum] = mapped_column(Enum(FormSubmissionStatusEnum), default=FormSubmissionStatusEnum.pending, index=True)
    delivery_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    website: Mapped["Website"] = relationship("Website", back_populates="form_submissions")

    __table_args__ = (
        Index("ix_form_submissions_website", "website_id"),
        Index("ix_form_submissions_form", "form_id"),
        Index("ix_form_submissions_status", "status"),
        Index("ix_form_submissions_submitted", "submitted_at"),
    )