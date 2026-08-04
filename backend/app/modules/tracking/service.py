from datetime import datetime
from typing import Optional, List, Dict, Any
import uuid
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import HTTPException
from app.core.exceptions import AppException, NotFoundException
from app.modules.tracking.models import (
    TrackingScript,
    ConsentConfiguration,
    FormValidation,
    SubmissionDestination,
    EventTest,
    TrackingAuditLog,
    MeasurementPlan,
    FormSubmission,
    MeasurementPlanStatusEnum,
    FormSubmissionStatusEnum,
    TrackingProviderEnum,
    TrackingStatusEnum,
    VerificationStatusEnum,
    HealthStatusEnum,
)
from app.modules.tracking.schemas import (
    TrackingScriptCreate,
    TrackingScriptVerifyRequest,
    TrackingScriptVerifyResponse,
    ScanRequest,
    ScanResponse,
    DashboardStats,
    FormsDiscoveryResponse,
    FormValidationCreate,
    FormValidationResponse,
    FormValidateRequest,
    FormValidateResponse,
    FormTestRequest,
    FormTestResponse,
    ConsentConfigResponse,
    ConsentVerifyRequest,
    ConsentVerifyResponse,
    ConsentDetailsResponse,
    FormSubmissionSummary,
    FormSubmissionSummaryResponse,
    RoutingDestinationCreate,
    RoutingDestinationResponse,
    RoutingListResponse,
    DestinationVerifyRequest,
    DestinationVerifyResponse,
    EventTestRequest,
    EventTestResponse,
    EventTestListResponse,
    AuditLogSearchRequest,
    AuditLogListResponse,
    AuditLogResponse,
    ValidationReportResponse,
    TrackingScriptsDiscoveryResponse,
    TrackingVerificationListResponse,
    SpamProtectionResponse,
    MeasurementPlanCreate,
    MeasurementPlanUpdate,
    MeasurementPlanResponse,
    MeasurementPlanListResponse,
    FormSubmissionResponse,
    FormSubmissionListResponse,
)
from app.modules.tracking.repository import (
    TrackingScriptRepository,
    ConsentConfigurationRepository,
    FormValidationRepository,
    SubmissionDestinationRepository,
    EventTestRepository,
    TrackingAuditLogRepository,
    MeasurementPlanRepository,
    FormSubmissionRepository,
)
from app.modules.website.models import Website
from app.modules.website.wp_client import WordPressClient, WordPressAPIError

logger = logging.getLogger(__name__)


class TrackingService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.script_repo = TrackingScriptRepository(db)
        self.consent_repo = ConsentConfigurationRepository(db)
        self.validation_repo = FormValidationRepository(db)
        self.destination_repo = SubmissionDestinationRepository(db)
        self.event_test_repo = EventTestRepository(db)
        self.audit_repo = TrackingAuditLogRepository(db)
        self.measurement_plan_repo = MeasurementPlanRepository(db)
        self.submission_repo = FormSubmissionRepository(db)

    def _generate_correlation_id(self) -> str:
        return f"trk_{uuid.uuid4().hex[:12]}"

    async def _log_audit(
        self,
        website_id: uuid.UUID,
        operation: str,
        result: str,
        duration_seconds: Optional[float] = None,
        correlation_id: Optional[str] = None,
        error_message: Optional[str] = None,
        warning_message: Optional[str] = None,
        executed_by: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        try:
            from app.core.database import get_audit_db
            async with get_audit_db() as audit_session:
                log_entry = TrackingAuditLog(
                    website_id=website_id,
                    operation=operation,
                    result=result,
                    duration_seconds=duration_seconds,
                    correlation_id=correlation_id,
                    error_message=error_message,
                    warning_message=warning_message,
                    executed_by=executed_by or "system",
                    log_metadata=metadata,
                )
                audit_session.add(log_entry)
                await audit_session.flush()
        except Exception:
            logger.warning("Failed to write tracking audit log; continuing without audit persistence", exc_info=True)

    async def resolve_website_id(self, website_id: Optional[uuid.UUID]) -> uuid.UUID:
        if website_id is not None:
            return website_id

        from app.modules.website.repository import WebsiteRepository

        repo = WebsiteRepository(self.db)
        websites = await repo.get_all(skip=0, limit=1)
        if not websites:
            raise NotFoundException("Website", "default")
        return websites[0].id

    async def get_tracking_providers(self, website_id: uuid.UUID) -> Dict[str, Any]:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_data = await client.get_tracking_scripts()
                await client.close()
                providers = wp_data.get("connected_providers", [])
                installed_plugins = wp_data.get("installed_tracking_plugins", [])
                synced_at = wp_data.get("synced_at")
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector providers fetch failed for {website_id}: {e}")
                await self._log_audit(
                    website_id,
                    "get_tracking_providers",
                    "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )
                providers = []
                installed_plugins = []
                synced_at = None

            await self._log_audit(
                website_id,
                "get_tracking_providers",
                "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"providers_count": len(providers)},
            )
            return {
                "providers": providers,
                "connected_providers": providers,
                "installed_tracking_plugins": installed_plugins,
                "synced_at": synced_at,
            }
        except Exception as e:
            await self._log_audit(
                website_id,
                "get_tracking_providers",
                "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get tracking providers: {str(e)}", status_code=500)

    async def get_tracking_scripts(self, website_id: uuid.UUID) -> List[Dict[str, Any]]:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            wp_scripts = []
            wp_connected_providers = []
            wp_installed_plugins = []
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_data = await client.get_tracking_scripts()
                await client.close()
                wp_scripts = wp_data.get("scripts", [])
                wp_connected_providers = wp_data.get("connected_providers", [])
                wp_installed_plugins = wp_data.get("installed_tracking_plugins", [])
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector tracking fetch failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "get_tracking_scripts", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )

            db_scripts = await self.script_repo.get_by_website(website_id)
            db_script_map = {}
            for s in db_scripts:
                key = (s.provider.value if hasattr(s.provider, 'value') else str(s.provider), s.tracking_id)
                db_script_map[key] = s

            combined = []
            for wp_script in wp_scripts:
                tracking_id = wp_script.get("tracking_id", wp_script.get("id", ""))
                provider = wp_script.get("provider", wp_script.get("type", "unknown"))
                key = (provider, tracking_id)
                if key in db_script_map:
                    db_script = db_script_map[key]
                    combined.append({
                        "id": str(db_script.id),
                        "website_id": str(website_id),
                        "provider": provider,
                        "tracking_id": tracking_id,
                        "status": db_script.status.value if db_script.status else "pending",
                        "verification_status": db_script.verification_status.value if db_script.verification_status else "pending",
                        "health_status": db_script.health_status.value if db_script.health_status else "unknown",
                        "installation_method": db_script.installation_method,
                        "detected_version": db_script.detected_version,
                        "last_verified": db_script.last_verified.isoformat() if db_script.last_verified else None,
                        "response_time_ms": db_script.response_time_ms,
                        "verification_details": db_script.verification_details,
                        "settings": db_script.settings,
                        "error_message": db_script.error_message,
                        "source": "db",
                    })
                else:
                    combined.append({
                        "id": "",
                        "website_id": str(website_id),
                        "provider": provider,
                        "tracking_id": tracking_id,
                        "status": wp_script.get("status", "pending"),
                        "verification_status": wp_script.get("verification_status", "pending"),
                        "health_status": wp_script.get("health_status", "unknown"),
                        "installation_method": wp_script.get("installation_method"),
                        "detected_version": wp_script.get("detected_version"),
                        "last_verified": None,
                        "response_time_ms": None,
                        "verification_details": None,
                        "settings": wp_script.get("settings"),
                        "error_message": None,
                        "source": "wp_connector",
                    })

            for combined_script in combined:
                provider = combined_script["provider"]
                for cp in wp_connected_providers:
                    if cp.get("provider") == provider:
                        combined_script["provider_label"] = cp.get("label", provider)

            # Persist newly discovered scripts to the database
            try:
                for wp_script in wp_scripts:
                    tracking_id = wp_script.get("tracking_id", wp_script.get("id", ""))
                    provider = wp_script.get("provider", wp_script.get("type", "unknown"))
                    key = (provider, tracking_id)
                    if key not in db_script_map:
                        provider_enum = None
                        try:
                            provider_enum = TrackingProviderEnum(provider)
                        except ValueError:
                            provider_enum = TrackingProviderEnum.custom_javascript
                        status_enum = None
                        try:
                            status_enum = TrackingStatusEnum(wp_script.get("status", "pending"))
                        except ValueError:
                            status_enum = TrackingStatusEnum.pending
                        verification_enum = None
                        try:
                            verification_enum = VerificationStatusEnum(wp_script.get("verification_status", "pending"))
                        except ValueError:
                            verification_enum = VerificationStatusEnum.pending
                        health_enum = None
                        try:
                            health_enum = HealthStatusEnum(wp_script.get("health_status", "unknown"))
                        except ValueError:
                            health_enum = HealthStatusEnum.unknown
                        new_script = TrackingScript(
                            website_id=website_id,
                            provider=provider_enum,
                            tracking_id=tracking_id,
                            status=status_enum,
                            verification_status=verification_enum,
                            health_status=health_enum,
                            installation_method=wp_script.get("installation_method"),
                            detected_version=wp_script.get("detected_version"),
                            settings=wp_script.get("settings"),
                        )
                        self.db.add(new_script)
                await self.db.flush()
            except Exception:
                logger.warning("Failed to persist tracking scripts to database", exc_info=True)

            await self._log_audit(
                website_id, "get_tracking_scripts", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"wp_scripts_count": len(wp_scripts), "db_scripts_count": len(db_scripts)},
            )
            return combined
        except Exception as e:
            await self._log_audit(
                website_id, "get_tracking_scripts", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get tracking scripts: {str(e)}", status_code=500)

    async def verify_tracking_script(self, website_id: uuid.UUID, script_id: str, req: TrackingScriptVerifyRequest) -> TrackingScriptVerifyResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            script = await self.script_repo.get(script_id)
            if not script or script.website_id != website_id:
                raise NotFoundException("TrackingScript", script_id)

            verification_details: Dict[str, Any] = {}
            error_message: Optional[str] = None
            verification_status = VerificationStatusEnum.verified
            health_status = HealthStatusEnum.healthy
            response_time_ms: Optional[int] = None
            errors: List[str] = []
            warnings: List[str] = []

            provider = script.provider.value if hasattr(script.provider, 'value') else str(script.provider)
            tracking_id = script.tracking_id

            # Get verification data from WP connector
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                verify_data = await client.verify_tracking_scripts()
                await client.close()
                verification_details["wp_connector_reachable"] = True

                # Find the matching provider in verify results
                wp_verify_result = None
                for pv in verify_data.get("providers", []):
                    if pv.get("provider") == provider and pv.get("tracking_id") == tracking_id:
                        wp_verify_result = pv
                        break

                if wp_verify_result:
                    verification_details["wp_verification_status"] = wp_verify_result.get("verification_status")
                    verification_details["wp_errors"] = wp_verify_result.get("errors", [])
                    verification_details["wp_warnings"] = wp_verify_result.get("warnings", [])
                    errors.extend(wp_verify_result.get("errors", []))
                    warnings.extend(wp_verify_result.get("warnings", []))
            except WordPressAPIError as e:
                verification_details["wp_connector_reachable"] = False
                verification_details["wp_error"] = e.message
                health_status = HealthStatusEnum.degraded
                warning_msg = f"WP connector unreachable during script verification: {e.message}"
                warnings.append(warning_msg)
                await self._log_audit(
                    website_id, "verify_tracking_script", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=warning_msg,
                )

            # Provider-specific verification
            provider_checks = self._verify_provider_specific(provider, tracking_id, verification_details)
            errors.extend(provider_checks.get("errors", []))
            warnings.extend(provider_checks.get("warnings", []))

            if errors:
                verification_status = VerificationStatusEnum.failed
                error_message = "; ".join(errors)
                health_status = HealthStatusEnum.unhealthy
            elif warnings:
                verification_status = VerificationStatusEnum.warning
                health_status = HealthStatusEnum.degraded
            else:
                verification_status = VerificationStatusEnum.verified
                health_status = HealthStatusEnum.healthy

            script.verification_status = verification_status
            script.health_status = health_status
            script.last_verified = datetime.utcnow()
            script.verification_details = verification_details
            script.response_time_ms = response_time_ms
            script.error_message = error_message
            await self.db.flush()

            await self._log_audit(
                website_id, "verify_tracking_script", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"script_id": script_id, "provider": provider},
            )

            return TrackingScriptVerifyResponse(
                script_id=script.id,
                status="completed",
                verification_status=verification_status.value,
                health_status=health_status.value,
                response_time_ms=response_time_ms,
                verification_details=verification_details,
                error_message=error_message,
            )
        except NotFoundException:
            raise
        except Exception as e:
            await self._log_audit(
                website_id, "verify_tracking_script", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to verify tracking script: {str(e)}", status_code=500)

    async def _inspect_form_validation(self, website_id: uuid.UUID, form_id: str, wp_form: Dict[str, Any]) -> Dict[str, Any]:
        checks = {
            "required_fields_present": False,
            "email_validation": False,
            "phone_validation": False,
            "empty_fields_check": False,
            "spam_protection": False,
            "captcha_enabled": False,
            "recaptcha_enabled": False,
            "recaptcha_type": None,
            "hcaptcha_enabled": False,
            "honeypot_enabled": False,
            "duplicate_protection": False,
            "file_upload_validation": False,
            "required_checkbox": False,
        }

        fields = wp_form.get("fields", [])
        spam_protection_data = wp_form.get("spam_protection", {})
        form_settings = wp_form.get("settings", {})

        field_types = [f.get("type", "").lower() for f in fields]
        field_labels = [f.get("label", "").lower() for f in fields]
        field_names = [f.get("name", "").lower() for f in fields]

        checks["required_fields_present"] = any(f.get("required") for f in fields)
        checks["email_validation"] = any(t in ("email", "email-address", "emailaddress") for t in field_types)
        checks["phone_validation"] = any(t in ("phone", "tel", "telephone", "phone-number") for t in field_types)
        checks["empty_fields_check"] = len(fields) > 0 and any(f.get("required") for f in fields)
        checks["file_upload_validation"] = any(t in ("file", "file-upload", "upload", "attachment") for t in field_types)

        checks["spam_protection"] = (
            spam_protection_data.get("recaptcha_enabled", False)
            or spam_protection_data.get("hcaptcha_enabled", False)
            or spam_protection_data.get("honeypot_enabled", False)
            or spam_protection_data.get("akismet_enabled", False)
            or spam_protection_data.get("recaptcha_type") in ("v2", "v3", "invisible")
            or any(t in ("honeypot", "captcha", "recaptcha", "hcaptcha") for t in field_types)
            or any("honeypot" in l or "captcha" in l or "recaptcha" in l for l in field_labels)
            or any("honeypot" in n or "captcha" in n or "recaptcha" in n for n in field_names)
        )

        checks["captcha_enabled"] = (
            spam_protection_data.get("recaptcha_enabled", False)
            or spam_protection_data.get("hcaptcha_enabled", False)
            or any(t in ("captcha", "recaptcha", "hcaptcha") for t in field_types)
            or any("captcha" in l or "recaptcha" in l or "hcaptcha" in l for l in field_labels)
        )

        checks["recaptcha_enabled"] = (
            spam_protection_data.get("recaptcha_enabled", False)
            or spam_protection_data.get("recaptcha_type") in ("v2", "v3", "invisible")
            or any(t in ("recaptcha", "captcha") for t in field_types)
            or any("recaptcha" in l or "captcha" in l for l in field_labels)
        )
        checks["recaptcha_type"] = spam_protection_data.get("recaptcha_type")

        checks["hcaptcha_enabled"] = (
            spam_protection_data.get("hcaptcha_enabled", False)
            or any(t in ("hcaptcha",) for t in field_types)
            or any("hcaptcha" in l for l in field_labels)
        )

        checks["honeypot_enabled"] = (
            spam_protection_data.get("honeypot_enabled", False)
            or any(t in ("honeypot",) for t in field_types)
            or any("honeypot" in l for l in field_labels)
            or any("honeypot" in n for n in field_names)
        )

        checks["duplicate_protection"] = (
            form_settings.get("duplicate_prevention", False)
            or form_settings.get("prevent_duplicates", False)
            or any("duplicate" in l for l in field_labels)
            or any("unique" in l for l in field_labels)
        )

        checks["required_checkbox"] = any(
            f.get("type", "").lower() in ("checkbox", "consent", "terms")
            and f.get("required", False)
            for f in fields
        )

        return checks

    async def get_forms_discovery(self, website_id: uuid.UUID) -> FormsDiscoveryResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            forms_data = []
            installed_form_plugins = []
            shortcode_map = {}
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_forms = await client.get_forms()
                wp_shortcodes = await client.get_shortcodes()
                await client.close()
                if isinstance(wp_forms, dict) and "forms" in wp_forms:
                    forms_data = wp_forms["forms"]
                elif isinstance(wp_forms, list):
                    forms_data = wp_forms
                if isinstance(wp_shortcodes, dict):
                    for shortcode in wp_shortcodes.get("shortcodes", []):
                        if shortcode.get("form_id"):
                            shortcode_map[str(shortcode["form_id"])] = shortcode
                    installed_form_plugins = [
                        entry.get("plugin")
                        for entry in forms_data
                        if entry.get("plugin") and entry.get("plugin") not in installed_form_plugins
                    ]
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector forms fetch failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "get_forms_discovery", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )

            db_validations = await self.validation_repo.get_by_website(website_id)
            db_validation_map = {v.form_id: v for v in db_validations}
            db_destinations = await self.destination_repo.get_by_website(website_id)
            db_destination_map = {d.form_id: d for d in db_destinations}

            result_forms = []
            for form in forms_data:
                form_id = str(form.get("id", form.get("wordpress_form_id", "")))
                validation = db_validation_map.get(form_id)
                db_dest = db_destination_map.get(form_id)
                spam_protection = form.get("spam_protection", {})
                destinations = form.get("destinations", [])
                if db_dest:
                    destinations.append({
                        "type": "email",
                        "address": db_dest.destination_email,
                        "label": "Last verified destination",
                    })
                last_modified = form.get("last_modified", form.get("updated_at", ""))
                shortcode_data = shortcode_map.get(form_id, {})

                validation_checks = {}
                validation_score = None
                health_status = "unknown"
                if validation:
                    db_rules = validation.validation_rules or {}
                    validation_checks = {
                        "required_fields_present": validation.required_fields_present,
                        "email_validation": validation.email_validation,
                        "phone_validation": validation.phone_validation,
                        "empty_fields_check": validation.empty_fields_check,
                        "spam_protection": validation.spam_protection,
                        "captcha_enabled": validation.captcha_enabled,
                        "recaptcha_enabled": validation.recaptcha_enabled,
                        "recaptcha_type": db_rules.get("recaptcha_type"),
                        "hcaptcha_enabled": validation.hcaptcha_enabled,
                        "honeypot_enabled": validation.honeypot_enabled,
                        "duplicate_protection": validation.duplicate_protection,
                        "file_upload_validation": validation.file_upload_validation,
                        "required_checkbox": validation.required_checkbox,
                    }
                    validation_score = validation.validation_score
                    health_status = validation.health_status.value if validation.health_status else "unknown"
                else:
                    try:
                        client = WordPressClient(
                            website.wp_admin_url or website.url,
                            website.wp_username,
                            website.wp_app_password,
                        )
                        wp_form_detail = await client.get_form(form_id)
                        await client.close()
                        validation_checks = await self._inspect_form_validation(website_id, form_id, wp_form_detail)
                        bool_checks = {k: v for k, v in validation_checks.items() if isinstance(v, bool)}
                        passed = sum(1 for v in bool_checks.values() if v)
                        total = len(bool_checks)
                        validation_score = round((passed / total) * 100, 1) if total > 0 else 0.0
                        if validation_score >= 80:
                            health_status = HealthStatusEnum.healthy.value
                        elif validation_score >= 60:
                            health_status = HealthStatusEnum.degraded.value
                        else:
                            health_status = HealthStatusEnum.unhealthy.value

                        form_validation = FormValidation(
                            website_id=website_id,
                            form_id=form_id,
                            form_name=form.get("name", form.get("title", "Untitled")),
                            plugin=form.get("plugin", "unknown"),
                            validation_rules=validation_checks,
                            required_fields_present=validation_checks.get("required_fields_present", False),
                            email_validation=validation_checks.get("email_validation", False),
                            phone_validation=validation_checks.get("phone_validation", False),
                            empty_fields_check=validation_checks.get("empty_fields_check", False),
                            spam_protection=validation_checks.get("spam_protection", False),
                            captcha_enabled=validation_checks.get("captcha_enabled", False),
                            recaptcha_enabled=validation_checks.get("recaptcha_enabled", False),
                            hcaptcha_enabled=validation_checks.get("hcaptcha_enabled", False),
                            honeypot_enabled=validation_checks.get("honeypot_enabled", False),
                            duplicate_protection=validation_checks.get("duplicate_protection", False),
                            file_upload_validation=validation_checks.get("file_upload_validation", False),
                            required_checkbox=validation_checks.get("required_checkbox", False),
                            health_status=HealthStatusEnum(health_status),
                            validation_score=validation_score,
                        )
                        self.db.add(form_validation)
                        await self.db.flush()
                    except Exception as e:
                        logger.warning(f"Failed to inspect form validation for {form_id}: {e}")
                        validation_checks = {
                            "required_fields_present": False,
                            "email_validation": False,
                            "phone_validation": False,
                            "empty_fields_check": False,
                            "spam_protection": False,
                            "captcha_enabled": False,
                            "recaptcha_enabled": False,
                            "hcaptcha_enabled": False,
                            "honeypot_enabled": False,
                            "duplicate_protection": False,
                            "file_upload_validation": False,
                            "required_checkbox": False,
                        }
                        validation_score = 0.0
                        health_status = HealthStatusEnum.unhealthy.value

                result_forms.append({
                    "id": form_id,
                    "wordpress_form_id": form_id,
                    "name": form.get("name", form.get("title", "Untitled")),
                    "plugin": form.get("plugin", "unknown"),
                    "status": form.get("status", "draft"),
                    "shortcode": form.get("shortcode") or shortcode_data.get("shortcode"),
                    "shortcodes": [shortcode_data] if shortcode_data else [],
                    "fields_count": form.get("fields_count", len(form.get("fields", []))),
                    "entries_count": form.get("entries_count"),
                    "health": form.get("health", "unknown"),
                    "responsive": form.get("responsive", False),
                    "spam_protection": validation_checks.get("spam_protection", False),
                    "spam_protection_details": spam_protection,
                    "destinations": destinations,
                    "last_modified": last_modified,
                    "validation_status": health_status,
                    "validation_score": validation_score,
                    "validation_rules": validation_checks,
                    "required_fields_present": validation_checks.get("required_fields_present", False),
                    "email_validation": validation_checks.get("email_validation", False),
                    "phone_validation": validation_checks.get("phone_validation", False),
                    "empty_fields_check": validation_checks.get("empty_fields_check", False),
                    "captcha_enabled": validation_checks.get("captcha_enabled", False),
                    "recaptcha_enabled": validation_checks.get("recaptcha_enabled", False),
                    "recaptcha_type": validation_checks.get("recaptcha_type") or form.get("spam_protection", {}).get("recaptcha_type"),
                    "hcaptcha_enabled": validation_checks.get("hcaptcha_enabled", False),
                    "honeypot_enabled": validation_checks.get("honeypot_enabled", False),
                    "duplicate_protection": validation_checks.get("duplicate_protection", False),
                    "file_upload_validation": validation_checks.get("file_upload_validation", False),
                    "required_checkbox": validation_checks.get("required_checkbox", False),
                    "installed_form_plugins": installed_form_plugins,
                    "source": "wp_connector",
                })

            await self._log_audit(
                website_id, "get_forms_discovery", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"forms_count": len(forms_data)},
            )
            return FormsDiscoveryResponse(items=result_forms, total=len(result_forms))
        except Exception as e:
            await self._log_audit(
                website_id, "get_forms_discovery", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to discover forms: {str(e)}", status_code=500)

    async def validate_form(self, website_id: uuid.UUID, form_id: str, req: FormValidateRequest) -> FormValidateResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            existing = await self.validation_repo.get_by_website_and_form(website_id, form_id)

            checks = {
                "required_fields_present": False,
                "email_validation": False,
                "phone_validation": False,
                "empty_fields_check": False,
                "spam_protection": False,
                "captcha_enabled": False,
                "recaptcha_enabled": False,
                "hcaptcha_enabled": False,
                "honeypot_enabled": False,
                "duplicate_protection": False,
                "file_upload_validation": False,
                "required_checkbox": False,
            }
            validation_score = 0.0
            error_message: Optional[str] = None
            health_status = HealthStatusEnum.healthy
            wp_form_data: Dict[str, Any] = {}

            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_form = await client.get_form(form_id)
                await client.close()
                wp_form_data = wp_form if isinstance(wp_form, dict) else {}

                checks = await self._inspect_form_validation(website_id, form_id, wp_form_data)
                bool_checks = {k: v for k, v in checks.items() if isinstance(v, bool)}
                passed = sum(1 for v in bool_checks.values() if v)
                total = len(bool_checks)
                validation_score = round((passed / total) * 100, 1) if total > 0 else 0.0

                if validation_score < 50:
                    health_status = HealthStatusEnum.unhealthy
                elif validation_score < 80:
                    health_status = HealthStatusEnum.degraded

            except WordPressAPIError as e:
                error_message = f"WP connector error: {e.message}"
                health_status = HealthStatusEnum.unhealthy
                validation_score = 0.0
                await self._log_audit(
                    website_id, "validate_form", "partial",
                    correlation_id=correlation_id,
                    warning_message=error_message,
                )

            if existing:
                existing.validation_rules = checks
                existing.required_fields_present = checks["required_fields_present"]
                existing.email_validation = checks["email_validation"]
                existing.phone_validation = checks["phone_validation"]
                existing.empty_fields_check = checks["empty_fields_check"]
                existing.spam_protection = checks["spam_protection"]
                existing.captcha_enabled = checks["captcha_enabled"]
                existing.recaptcha_enabled = checks["recaptcha_enabled"]
                existing.hcaptcha_enabled = checks["hcaptcha_enabled"]
                existing.honeypot_enabled = checks["honeypot_enabled"]
                existing.duplicate_protection = checks["duplicate_protection"]
                existing.file_upload_validation = checks["file_upload_validation"]
                existing.required_checkbox = checks["required_checkbox"]
                existing.health_status = health_status
                existing.validation_score = validation_score
                existing.error_message = error_message
                await self.db.flush()
            else:
                validation = FormValidation(
                    website_id=website_id,
                    form_id=form_id,
                    form_name=wp_form_data.get("name", wp_form_data.get("title", "Unknown")),
                    plugin=wp_form_data.get("plugin", "unknown"),
                    validation_rules=checks,
                    required_fields_present=checks["required_fields_present"],
                    email_validation=checks["email_validation"],
                    phone_validation=checks["phone_validation"],
                    empty_fields_check=checks["empty_fields_check"],
                    spam_protection=checks["spam_protection"],
                    captcha_enabled=checks["captcha_enabled"],
                    recaptcha_enabled=checks["recaptcha_enabled"],
                    hcaptcha_enabled=checks["hcaptcha_enabled"],
                    honeypot_enabled=checks["honeypot_enabled"],
                    duplicate_protection=checks["duplicate_protection"],
                    file_upload_validation=checks["file_upload_validation"],
                    required_checkbox=checks["required_checkbox"],
                    health_status=health_status,
                    validation_score=validation_score,
                    error_message=error_message,
                )
                self.db.add(validation)
                await self.db.flush()

            await self._log_audit(
                website_id, "validate_form", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"form_id": form_id, "validation_score": validation_score},
            )

            return FormValidateResponse(
                form_id=form_id,
                form_name=wp_form_data.get("name", wp_form_data.get("title", form_id)),
                plugin=wp_form_data.get("plugin", "unknown"),
                health_status=health_status.value,
                validation_score=validation_score,
                checks=checks,
                error_message=error_message,
            )
        except NotFoundException:
            raise
        except Exception as e:
            await self._log_audit(
                website_id, "validate_form", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to validate form: {str(e)}", status_code=500)

    async def get_consent_config(self, website_id: uuid.UUID) -> ConsentConfigResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            consent = await self.consent_repo.get_by_website(website_id)

            if consent:
                await self._log_audit(
                    website_id, "get_consent_config", "success",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                )
                return ConsentConfigResponse(
                    id=consent.id,
                    website_id=website_id,
                    cookie_banner_enabled=consent.cookie_banner_enabled,
                    consent_mode=consent.consent_mode,
                    privacy_policy_url=consent.privacy_policy_url,
                    terms_url=consent.terms_url,
                    cookie_categories=consent.cookie_categories,
                    status=consent.status,
                    verification_status=consent.verification_status,
                    last_verified=consent.last_verified,
                    error_message=consent.error_message,
                    created_at=consent.created_at,
                    updated_at=consent.updated_at,
                )

            wp_consent_data: Dict[str, Any] = {}
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_settings = await client.get_settings()
                await client.close()
                wp_consent_data = wp_settings.get("consent", {}) if isinstance(wp_settings, dict) else {}
            except Exception:
                pass

            consent_config = ConsentConfiguration(
                website_id=website_id,
                cookie_banner_enabled=wp_consent_data.get("cookie_banner_enabled", False),
                consent_mode=wp_consent_data.get("consent_mode"),
                privacy_policy_url=wp_consent_data.get("privacy_policy_url"),
                terms_url=wp_consent_data.get("terms_url"),
                cookie_categories=wp_consent_data.get("cookie_categories"),
                status=ConsentStatusEnum.rejected,
                verification_status=VerificationStatusEnum.pending,
            )
            self.db.add(consent_config)
            await self.db.flush()

            await self._log_audit(
                website_id, "get_consent_config", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
            )
            return ConsentConfigResponse(
                id=consent_config.id,
                website_id=website_id,
                cookie_banner_enabled=consent_config.cookie_banner_enabled,
                consent_mode=consent_config.consent_mode,
                privacy_policy_url=consent_config.privacy_policy_url,
                terms_url=consent_config.terms_url,
                cookie_categories=consent_config.cookie_categories,
                status=consent_config.status,
                verification_status=consent_config.verification_status,
                created_at=consent_config.created_at,
                updated_at=consent_config.updated_at,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "get_consent_config", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get consent config: {str(e)}", status_code=500)

    async def verify_consent(self, website_id: uuid.UUID, req: ConsentVerifyRequest) -> ConsentVerifyResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            consent = await self.consent_repo.get_by_website(website_id)

            if not consent:
                consent = ConsentConfiguration(
                    website_id=website_id,
                    cookie_banner_enabled=False,
                    consent_mode="opt_in",
                    status=ConsentStatusEnum.rejected,
                    verification_status=VerificationStatusEnum.pending,
                )
                self.db.add(consent)
                await self.db.flush()

            verification_details: Dict[str, Any] = {}
            error_message: Optional[str] = None
            verification_status = VerificationStatusEnum.verified

            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_settings = await client.get_settings()
                await client.close()
                consent_settings = wp_settings.get("consent", {}) if isinstance(wp_settings, dict) else {}
                verification_details["wp_consent_settings"] = consent_settings
                verification_details["wp_connector_reachable"] = True
            except WordPressAPIError as e:
                verification_details["wp_connector_reachable"] = False
                verification_details["wp_error"] = e.message
                warning_msg = f"WP connector unavailable during consent verification: {e.message}"
                await self._log_audit(
                    website_id, "verify_consent", "partial",
                    correlation_id=correlation_id,
                    warning_message=warning_msg,
                )

            consent.verification_status = verification_status
            consent.last_verified = datetime.utcnow()
            consent.error_message = error_message
            await self.db.flush()

            await self._log_audit(
                website_id, "verify_consent", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"cookie_banner_enabled": consent.cookie_banner_enabled},
            )

            return ConsentVerifyResponse(
                website_id=website_id,
                status="completed",
                verification_status=verification_status.value,
                cookie_banner_enabled=consent.cookie_banner_enabled,
                consent_mode=consent.consent_mode,
                privacy_policy_url=consent.privacy_policy_url,
                terms_url=consent.terms_url,
                cookie_categories=consent.cookie_categories,
                error_message=error_message,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "verify_consent", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to verify consent: {str(e)}", status_code=500)

    async def _verify_destination(self, destination: SubmissionDestination) -> None:
        is_reachable = False
        smtp_working = False
        webhook_active = False
        response_time_ms: Optional[int] = None
        error_message: Optional[str] = None
        try:
            if destination.destination_url:
                import httpx
                client = httpx.AsyncClient(timeout=10.0)
                resp = await client.head(destination.destination_url)
                is_reachable = resp.status_code < 400
                response_time_ms = int(resp.elapsed.total_seconds() * 1000)
                webhook_active = is_reachable
                await client.aclose()
            elif destination.destination_email:
                is_reachable = True
                smtp_working = True
        except Exception as e:
            error_message = str(e)
            is_reachable = False
        destination.is_reachable = is_reachable
        destination.smtp_working = smtp_working
        destination.webhook_active = webhook_active
        destination.last_verified = datetime.utcnow()
        destination.response_time_ms = response_time_ms
        destination.error_message = error_message
        destination.verification_status = VerificationStatusEnum.verified if is_reachable else VerificationStatusEnum.failed
        await self.db.flush()

    async def sync_routing_destinations(self, website_id: uuid.UUID) -> int:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        synced_count = 0
        try:
            website = await self._get_website(website_id)
            wp_forms = []
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_forms_data = await client.get_forms()
                await client.close()
                if isinstance(wp_forms_data, dict) and "forms" in wp_forms_data:
                    wp_forms = wp_forms_data["forms"]
                elif isinstance(wp_forms_data, list):
                    wp_forms = wp_forms_data
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector routing sync failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "sync_routing_destinations", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )
                return 0

            for form in wp_forms:
                form_id = str(form.get("id", form.get("wordpress_form_id", "")))
                if not form_id:
                    continue
                destinations = form.get("destinations", [])
                for dest in destinations:
                    dest_type = dest.get("type", "").lower()
                    dest_address = dest.get("address", "")
                    if not dest_type or not dest_address:
                        continue
                    if dest_type == "email":
                        destination = await self.destination_repo.upsert(
                            website_id=website_id,
                            form_id=form_id,
                            destination_type="email",
                            destination_email=dest_address,
                            status=TrackingStatusEnum.active,
                            verification_status=VerificationStatusEnum.pending,
                            is_reachable=False,
                            smtp_working=False,
                            webhook_active=False,
                        )
                        synced_count += 1
                        try:
                            await self._verify_destination(destination)
                        except Exception:
                            pass
                    elif dest_type == "webhook":
                        destination = await self.destination_repo.upsert(
                            website_id=website_id,
                            form_id=form_id,
                            destination_type="webhook",
                            destination_url=dest_address,
                            status=TrackingStatusEnum.active,
                            verification_status=VerificationStatusEnum.pending,
                            is_reachable=False,
                            smtp_working=False,
                            webhook_active=False,
                        )
                        synced_count += 1
                        try:
                            await self._verify_destination(destination)
                        except Exception:
                            pass

            await self._log_audit(
                website_id, "sync_routing_destinations", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"synced_count": synced_count},
            )
            return synced_count
        except Exception as e:
            await self._log_audit(
                website_id, "sync_routing_destinations", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to sync routing destinations: {str(e)}", status_code=500)

    async def get_routing_destinations(self, website_id: uuid.UUID) -> RoutingListResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            await self.sync_routing_destinations(website_id)
            destinations = await self.destination_repo.get_by_website(website_id)
            result = []
            for dest in destinations:
                result.append(RoutingDestinationResponse(
                    id=dest.id,
                    website_id=website_id,
                    form_id=dest.form_id,
                    destination_type=dest.destination_type,
                    destination_url=dest.destination_url,
                    destination_email=dest.destination_email,
                    status=dest.status,
                    verification_status=dest.verification_status,
                    is_reachable=dest.is_reachable,
                    smtp_working=dest.smtp_working,
                    webhook_active=dest.webhook_active,
                    last_verified=dest.last_verified,
                    response_time_ms=dest.response_time_ms,
                    error_message=dest.error_message,
                    created_at=dest.created_at,
                    updated_at=dest.updated_at,
                ))

            await self._log_audit(
                website_id, "get_routing_destinations", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"destinations_count": len(result)},
            )
            return RoutingListResponse(items=result, total=len(result))
        except Exception as e:
            await self._log_audit(
                website_id, "get_routing_destinations", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get routing destinations: {str(e)}", status_code=500)

    async def verify_destination(self, website_id: uuid.UUID, destination_id: str, req: DestinationVerifyRequest) -> DestinationVerifyResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            destination = await self.destination_repo.get(destination_id)
            if not destination or destination.website_id != website_id:
                raise NotFoundException("SubmissionDestination", destination_id)

            is_reachable = False
            smtp_working = False
            webhook_active = False
            response_time_ms: Optional[int] = None
            error_message: Optional[str] = None

            try:
                if destination.destination_url:
                    import httpx
                    client = httpx.AsyncClient(timeout=10.0)
                    resp = await client.head(destination.destination_url)
                    is_reachable = resp.status_code < 400
                    response_time_ms = resp.elapsed.total_seconds() * 1000
                    await client.aclose()
                elif destination.destination_email:
                    is_reachable = True
                    smtp_working = True
            except Exception as e:
                error_message = str(e)
                is_reachable = False

            destination.is_reachable = is_reachable
            destination.smtp_working = smtp_working
            destination.webhook_active = webhook_active
            destination.last_verified = datetime.utcnow()
            destination.response_time_ms = response_time_ms
            destination.error_message = error_message
            destination.verification_status = VerificationStatusEnum.verified if is_reachable else VerificationStatusEnum.failed
            await self.db.flush()

            await self._log_audit(
                website_id, "verify_destination", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"destination_id": destination_id, "destination_type": destination.destination_type},
            )

            return DestinationVerifyResponse(
                destination_id=destination.id,
                destination_type=destination.destination_type,
                status="completed",
                is_reachable=is_reachable,
                smtp_working=smtp_working,
                webhook_active=webhook_active,
                response_time_ms=response_time_ms,
                error_message=error_message,
            )
        except NotFoundException:
            raise
        except Exception as e:
            await self._log_audit(
                website_id, "verify_destination", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to verify destination: {str(e)}", status_code=500)

    async def test_form_submission(self, website_id: uuid.UUID, form_id: str, req: FormTestRequest) -> FormTestResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            await self._get_website(website_id)
            result = await self.run_event_test(
                website_id,
                EventTestRequest(
                    event_type="form_submit",
                    event_name=f"Test submission for {form_id}",
                    destination=req.destination_type,
                    test_data=req.test_data,
                ),
            )
            await self._log_audit(
                website_id,
                "test_form_submission",
                "success" if result.success else "error",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"form_id": form_id, "destination_type": req.destination_type},
            )
            return FormTestResponse(
                form_id=form_id,
                destination_type=req.destination_type or "email",
                status=result.status.value if hasattr(result.status, "value") else str(result.status),
                success=result.success,
                response_time_ms=result.response_time_ms,
                event_id=result.event_id,
                error_message=result.error_message,
            )
        except Exception as e:
            await self._log_audit(
                website_id,
                "test_form_submission",
                "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to test form submission: {str(e)}", status_code=500)

    async def run_event_test(self, website_id: uuid.UUID, req: EventTestRequest) -> EventTestResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)

            success = False
            response_time_ms: Optional[int] = None
            event_id: Optional[str] = None
            error_message: Optional[str] = None
            status = TrackingStatusEnum.active

            try:
                import httpx
                client = httpx.AsyncClient(timeout=10.0)
                test_url = req.destination or website.url
                resp = await client.get(test_url)
                response_time_ms = resp.elapsed.total_seconds() * 1000
                success = resp.status_code < 400
                event_id = f"evt_{uuid.uuid4().hex[:8]}"
                await client.aclose()
            except Exception as e:
                error_message = str(e)
                success = False
                status = TrackingStatusEnum.error

            event_test = EventTest(
                website_id=website_id,
                event_type=req.event_type,
                event_name=req.event_name,
                status=status,
                success=success,
                response_time_ms=response_time_ms,
                event_id=event_id,
                timestamp=datetime.utcnow(),
                destination=req.destination,
                error_message=error_message,
                correlation_id=correlation_id,
                created_by="system",
            )
            self.db.add(event_test)
            await self.db.flush()

            await self._log_audit(
                website_id, "run_event_test", "success" if success else "error",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"event_type": req.event_type.value, "event_name": req.event_name, "success": success},
            )

            return EventTestResponse(
                id=event_test.id,
                website_id=website_id,
                event_type=req.event_type,
                event_name=req.event_name,
                status=status,
                success=success,
                response_time_ms=response_time_ms,
                event_id=event_id,
                timestamp=event_test.timestamp,
                destination=req.destination,
                error_message=error_message,
                correlation_id=correlation_id,
                created_at=event_test.created_at,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "run_event_test", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to run event test: {str(e)}", status_code=500)

    async def get_audit_logs(
        self,
        website_id: uuid.UUID,
        req: AuditLogSearchRequest,
    ) -> AuditLogListResponse:
        correlation_id = self._generate_correlation_id()
        try:
            items = await self.audit_repo.get_by_website(
                website_id,
                operation=req.operation,
                result=req.result,
                correlation_id=req.correlation_id,
                executed_by=req.executed_by,
                start_date=req.start_date,
                end_date=req.end_date,
                skip=(req.page - 1) * req.page_size,
                limit=req.page_size,
            )
            total = await self.audit_repo.count_by_website(
                website_id,
                operation=req.operation,
                result=req.result,
                correlation_id=req.correlation_id,
                executed_by=req.executed_by,
                start_date=req.start_date,
                end_date=req.end_date,
            )

            total_pages = (total + req.page_size - 1) // req.page_size if total > 0 else 1

            return AuditLogListResponse(
                items=[
                    AuditLogResponse(
                        id=log.id,
                        website_id=log.website_id,
                        operation=log.operation,
                        result=log.result,
                        duration_seconds=log.duration_seconds,
                        correlation_id=log.correlation_id,
                        error_message=log.error_message,
                        warning_message=log.warning_message,
                        executed_by=log.executed_by,
                        metadata=log.log_metadata,
                        created_at=log.created_at,
                    )
                    for log in items
                ],
                total=total,
                page=req.page,
                page_size=req.page_size,
                total_pages=total_pages,
            )
        except Exception as e:
            raise AppException(message=f"Failed to get audit logs: {str(e)}", status_code=500)

    async def run_full_scan(self, website_id: uuid.UUID, req: ScanRequest) -> ScanResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        results: Dict[str, Any] = {}
        errors: List[str] = []

        try:
            website = await self._get_website(website_id)

            try:
                scripts = await self.get_tracking_scripts(website_id)
                results["tracking_scripts"] = scripts
            except Exception as e:
                errors.append(f"tracking_scripts: {str(e)}")
                results["tracking_scripts"] = []

            try:
                forms = await self.get_forms_discovery(website_id)
                results["forms_discovered"] = forms
            except Exception as e:
                errors.append(f"forms_discovery: {str(e)}")
                results["forms_discovered"] = FormsDiscoveryResponse(items=[], total=0)

            try:
                consent = await self.get_consent_config(website_id)
                results["consent_config"] = consent
            except Exception as e:
                errors.append(f"consent_config: {str(e)}")
                results["consent_config"] = None

            try:
                destinations = await self.get_routing_destinations(website_id)
                results["routing_destinations"] = destinations
            except Exception as e:
                errors.append(f"routing_destinations: {str(e)}")
                results["routing_destinations"] = RoutingListResponse(items=[], total=0)

            try:
                verification = await self.get_tracking_verification(website_id)
                results["tracking_verification"] = verification
            except Exception as e:
                errors.append(f"tracking_verification: {str(e)}")

            try:
                spam = await self.get_spam_protection(website_id)
                results["spam_protection"] = spam
            except Exception as e:
                errors.append(f"spam_protection: {str(e)}")

            overall_status = "completed" if not errors else "partial"
            error_message = "; ".join(errors) if errors else None

            await self._log_audit(
                website_id, "run_full_scan", overall_status,
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                error_message=error_message,
                warning_message=f"{len(errors)} component(s) failed" if errors else None,
                metadata={
                    "components_scanned": ["tracking_scripts", "forms_discovery", "consent_config", "routing_destinations"],
                    "errors_count": len(errors),
                },
            )

            return ScanResponse(
                website_id=website_id,
                status=overall_status,
                tracking_scripts=results.get("tracking_scripts", []),
                forms_discovered=results.get("forms_discovered", FormsDiscoveryResponse(items=[], total=0)).total,
                consent_config=results.get("consent_config"),
                validation_summary=results.get("validation_summary"),
                routing_summary=results.get("routing_destinations"),
                tracking_verification=results.get("tracking_verification"),
                spam_protection=results.get("spam_protection"),
                error_message=error_message,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "run_full_scan", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Full scan failed: {str(e)}", status_code=500)

    async def get_dashboard_stats(self, website_id: uuid.UUID) -> DashboardStats:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            scripts = await self.script_repo.get_by_website(website_id)
            forms = await self.validation_repo.get_by_website(website_id)
            destinations = await self.destination_repo.get_by_website(website_id)
            event_tests = await self.event_test_repo.get_by_website(website_id, limit=100)
            audit_count = await self.audit_repo.count_by_website(website_id)
            total_submissions = await self.submission_repo.count_by_website(website_id)
            successful_submissions = await self.submission_repo.count_by_website(website_id, status="sent")
            failed_submissions = await self.submission_repo.count_by_website(website_id, status="failed")

            wp_total_forms = 0
            wp_healthy_forms = 0
            wp_total_submissions = 0
            wp_successful_submissions = 0
            wp_failed_submissions = 0
            wp_connected_providers = 0
            wp_synced_at = None

            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_forms_data = await client.get_forms()
                await client.close()

                wp_forms_list = wp_forms_data.get("forms", []) if isinstance(wp_forms_data, dict) else wp_forms_data
                wp_total_forms = len(wp_forms_list)

                wp_form_validations = 0
                for f in wp_forms_list:
                    if f.get("health", "unknown") == "healthy":
                        wp_healthy_forms += 1
                    if f.get("spam_protection", {}).get("recaptcha_enabled") or \
                       f.get("spam_protection", {}).get("hcaptcha_enabled") or \
                       f.get("spam_protection", {}).get("honeypot_enabled") or \
                       f.get("spam_protection", {}).get("akismet_enabled"):
                        wp_form_validations += 1

                try:
                    client = WordPressClient(
                        website.wp_admin_url or website.url,
                        website.wp_username,
                        website.wp_app_password,
                    )
                    wp_submissions = await client.get_submissions_summary()
                    await client.close()
                    wp_total_submissions = wp_submissions.get("total_submissions", 0)
                    wp_successful_submissions = wp_submissions.get("total_sent", 0)
                    wp_failed_submissions = wp_submissions.get("total_failed", 0)
                except (WordPressAPIError, AppException):
                    pass

                try:
                    client = WordPressClient(
                        website.wp_admin_url or website.url,
                        website.wp_username,
                        website.wp_app_password,
                    )
                    wp_tracking = await client.get_tracking_scripts()
                    await client.close()
                    wp_connected_providers = len(wp_tracking.get("scripts", []))
                    wp_synced_at = wp_tracking.get("synced_at")
                except (WordPressAPIError, AppException):
                    pass

            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector dashboard fetch failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "get_dashboard_stats", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )

            total_scripts = len(scripts) if scripts else wp_connected_providers
            active_scripts = sum(1 for s in scripts if s.status == TrackingStatusEnum.active)
            verified_scripts = sum(1 for s in scripts if s.verification_status == VerificationStatusEnum.verified)
            healthy_scripts = sum(1 for s in scripts if s.health_status == HealthStatusEnum.healthy)

            supported_providers = [
                "google_analytics_4", "google_tag_manager", "meta_pixel",
                "google_ads", "linkedin_insight", "microsoft_clarity",
                "custom_javascript", "google_search_console",
                "google_site_kit", "monsterinsights", "pixelyoursite",
                "wpcode", "header_footer_code_manager", "manual_scripts",
            ]
            tracking_providers = len(supported_providers)
            connected_providers = len(set(s.provider.value if hasattr(s.provider, 'value') else str(s.provider) for s in scripts)) if scripts else wp_connected_providers

            total_forms = len(forms) if forms else wp_total_forms
            healthy_forms = sum(1 for f in forms if f.health_status == HealthStatusEnum.healthy) if forms else wp_healthy_forms

            if wp_total_submissions > total_submissions:
                total_submissions = wp_total_submissions
                successful_submissions = wp_successful_submissions
                failed_submissions = wp_failed_submissions

            consent = await self.consent_repo.get_by_website(website_id)
            consent_configured = consent is not None and consent.cookie_banner_enabled
            consent_verified = consent is not None and consent.verification_status == VerificationStatusEnum.verified

            total_destinations = len(destinations)
            reachable_destinations = sum(1 for d in destinations if d.is_reachable)

            total_event_tests = len(event_tests)
            successful_tests = sum(1 for e in event_tests if e.success)

            successful_events = successful_tests + successful_submissions
            failed_events = (total_event_tests - successful_tests) + failed_submissions

            last_scan = None
            if scripts:
                last_scan = max(s.last_verified for s in scripts if s.last_verified)
            if consent and consent.last_verified:
                if last_scan is None or consent.last_verified > last_scan:
                    last_scan = consent.last_verified

            overall_health = HealthStatusEnum.healthy
            if total_scripts == 0 and total_forms == 0:
                overall_health = HealthStatusEnum.unknown
            elif healthy_scripts < total_scripts and total_scripts > 0:
                overall_health = HealthStatusEnum.degraded

            return DashboardStats(
                website_id=website_id,
                tracking_providers=tracking_providers,
                connected_providers=connected_providers,
                total_forms=total_forms,
                healthy_forms=healthy_forms,
                total_submissions=total_submissions,
                successful_events=successful_events,
                failed_events=failed_events,
                consent_enabled=consent_configured,
                total_tracking_scripts=total_scripts,
                active_scripts=active_scripts,
                verified_scripts=verified_scripts,
                healthy_scripts=healthy_scripts,
                valid_forms=healthy_forms,
                consent_configured=consent_configured,
                consent_verified=consent_verified,
                total_destinations=total_destinations,
                reachable_destinations=reachable_destinations,
                total_event_tests=total_event_tests,
                successful_tests=successful_tests,
                audit_log_count=audit_count,
                last_scan_at=last_scan,
                overall_health=overall_health,
            )
        except Exception as e:
            raise AppException(message=f"Failed to get dashboard stats: {str(e)}", status_code=500)

    def _verify_provider_specific(self, provider: str, tracking_id: str, details: Dict[str, Any]) -> Dict[str, Any]:
        errors = []
        warnings = []

        if provider == TrackingProviderEnum.google_analytics_4:
            if not tracking_id.startswith("G-"):
                errors.append("GA4 Measurement ID must start with 'G-'")
            if len(tracking_id) < 12:
                errors.append("GA4 Measurement ID appears too short")

        elif provider == TrackingProviderEnum.google_tag_manager:
            if not tracking_id.startswith("GTM-"):
                errors.append("GTM Container ID must start with 'GTM-'")
            if len(tracking_id) < 10:
                errors.append("GTM Container ID appears too short")

        elif provider == TrackingProviderEnum.meta_pixel:
            if not tracking_id.isdigit():
                errors.append("Meta Pixel ID must be numeric")
            if len(tracking_id) < 15:
                errors.append("Meta Pixel ID appears too short")

        elif provider == TrackingProviderEnum.microsoft_clarity:
            if not tracking_id:
                errors.append("Microsoft Clarity Project ID is missing")

        elif provider == TrackingProviderEnum.linkedin_insight:
            if not tracking_id.isdigit():
                errors.append("LinkedIn Partner ID must be numeric")

        elif provider == TrackingProviderEnum.google_search_console:
            if not tracking_id:
                errors.append("Google Search Console verification code is missing")

        elif provider == TrackingProviderEnum.google_ads:
            if not tracking_id.startswith("AW-"):
                errors.append("Google Ads Conversion ID must start with 'AW-'")

        details["provider_specific_checks"] = {
            "errors": errors,
            "warnings": warnings,
        }

        return {"errors": errors, "warnings": warnings}

    async def get_tracking_scripts_discovery(self, website_id: uuid.UUID) -> TrackingScriptsDiscoveryResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_data = await client.get_tracking_scripts()
                await client.close()
                wp_scripts = wp_data.get("scripts", [])
                connected_providers = wp_data.get("connected_providers", [])
                installed_plugins = wp_data.get("installed_tracking_plugins", [])
                synced_at = wp_data.get("synced_at")
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector tracking discovery failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "get_tracking_scripts_discovery", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )
                wp_scripts = []
                connected_providers = []
                installed_plugins = []
                synced_at = None

            scripts = []
            for ws in wp_scripts:
                provider = ws.get("provider", "unknown")
                label = provider
                for cp in connected_providers:
                    if cp.get("provider") == provider:
                        label = cp.get("label", provider)
                scripts.append(TrackingScriptDiscovery(
                    id=ws.get("id", ""),
                    provider=provider,
                    provider_label=ws.get("provider_label", label),
                    tracking_id=ws.get("tracking_id", ""),
                    status=ws.get("status", "pending"),
                    verification_status=ws.get("verification_status", "pending"),
                    health_status=ws.get("health_status", "unknown"),
                    installation_method=ws.get("installation_method"),
                    detected_version=ws.get("detected_version"),
                    last_verified=ws.get("last_verified"),
                    settings=ws.get("settings"),
                    errors=ws.get("errors"),
                    warnings=ws.get("warnings"),
                    last_checked=ws.get("last_checked"),
                ))

            provider_infos = [
                TrackingProviderInfo(
                    provider=cp.get("provider", ""),
                    label=cp.get("label", ""),
                    connected=cp.get("connected", False),
                )
                for cp in connected_providers
            ]

            await self._log_audit(
                website_id, "get_tracking_scripts_discovery", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
            )
            return TrackingScriptsDiscoveryResponse(
                scripts=scripts,
                total=len(scripts),
                connected_providers=provider_infos,
                installed_tracking_plugins=installed_plugins,
                synced_at=synced_at if synced_at else None,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "get_tracking_scripts_discovery", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get tracking scripts discovery: {str(e)}", status_code=500)

    async def get_tracking_verification(self, website_id: uuid.UUID) -> TrackingVerificationListResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_data = await client.verify_tracking_scripts()
                await client.close()
                providers = [
                    TrackingVerificationResponse(
                        provider=p.get("provider", ""),
                        provider_label=p.get("provider_label", ""),
                        tracking_id=p.get("tracking_id", ""),
                        verification_status=p.get("verification_status", "pending"),
                        errors=p.get("errors", []),
                        warnings=p.get("warnings", []),
                        last_checked=p.get("last_checked"),
                    )
                    for p in wp_data.get("providers", [])
                ]
                scripts = [
                    TrackingScriptDiscovery(
                        id=s.get("id", ""),
                        provider=s.get("provider", "unknown"),
                        provider_label=s.get("provider_label", s.get("provider", "unknown")),
                        tracking_id=s.get("tracking_id", ""),
                        status=s.get("status", "pending"),
                        verification_status=s.get("verification_status", "pending"),
                        health_status=s.get("health_status", "unknown"),
                        installation_method=s.get("installation_method"),
                        detected_version=s.get("detected_version"),
                        last_verified=s.get("last_verified"),
                        settings=s.get("settings"),
                        errors=s.get("errors"),
                        warnings=s.get("warnings"),
                        last_checked=s.get("last_checked"),
                    )
                    for s in wp_data.get("scripts", [])
                ]
                synced_at = wp_data.get("synced_at")
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector tracking verification failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "get_tracking_verification", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )
                providers = []
                scripts = []
                synced_at = None

            await self._log_audit(
                website_id, "get_tracking_verification", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
            )
            return TrackingVerificationListResponse(
                providers=providers,
                scripts=scripts,
                synced_at=synced_at if synced_at else None,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "get_tracking_verification", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get tracking verification: {str(e)}", status_code=500)

    async def get_spam_protection(self, website_id: uuid.UUID) -> SpamProtectionResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_data = await client.get_spam_protection()
                await client.close()
                spam_config = wp_data.get("spam_protection", {})
                spam_plugins = wp_data.get("spam_plugins", [])
                form_plugins = wp_data.get("all_form_plugins", [])
                synced_at = wp_data.get("synced_at")
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector spam protection fetch failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "get_spam_protection", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )
                spam_config = {}
                spam_plugins = []
                form_plugins = []
                synced_at = None

            spam_protection = {}
            for plugin_key, config in spam_config.items():
                spam_protection[plugin_key] = SpamProtectionInfo(
                    recaptcha_enabled=config.get("recaptcha_enabled", False),
                    recaptcha_type=config.get("recaptcha_type"),
                    hcaptcha_enabled=config.get("hcaptcha_enabled", False),
                    honeypot_enabled=config.get("honeypot_enabled", False),
                    akismet_enabled=config.get("akismet_enabled", False),
                    spam_score=config.get("spam_score"),
                )

            await self._log_audit(
                website_id, "get_spam_protection", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
            )
            return SpamProtectionResponse(
                spam_protection=spam_protection,
                spam_plugins=spam_plugins,
                all_form_plugins=form_plugins,
                synced_at=synced_at if synced_at else None,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "get_spam_protection", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get spam protection: {str(e)}", status_code=500)

    async def get_form_fields(self, website_id: uuid.UUID, form_id: str) -> Dict[str, Any]:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_form = await client.get_form(form_id)
                await client.close()
                fields = wp_form.get("fields", []) if isinstance(wp_form, dict) else []
                spam_protection = wp_form.get("spam_protection", {}) if isinstance(wp_form, dict) else {}
                destinations = wp_form.get("destinations", []) if isinstance(wp_form, dict) else []
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector form fields fetch failed for {website_id}/{form_id}: {e}")
                await self._log_audit(
                    website_id, "get_form_fields", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )
                fields = []
                spam_protection = {}
                destinations = []

            await self._log_audit(
                website_id, "get_form_fields", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
            )
            return {
                "form_id": form_id,
                "fields": fields,
                "spam_protection": spam_protection,
                "destinations": destinations,
            }
        except Exception as e:
            await self._log_audit(
                website_id, "get_form_fields", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get form fields: {str(e)}", status_code=500)

    async def get_form_destinations(self, website_id: uuid.UUID, form_id: str) -> Dict[str, Any]:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            wp_destinations = []
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_form = await client.get_form(form_id)
                await client.close()
                wp_destinations = wp_form.get("destinations", []) if isinstance(wp_form, dict) else []
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector form destinations fetch failed for {website_id}/{form_id}: {e}")
                await self._log_audit(
                    website_id, "get_form_destinations", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )

            db_destinations = await self.destination_repo.get_by_website_and_form(website_id, form_id)
            db_dest_list = []
            for d in db_destinations:
                db_dest_list.append({
                    "id": str(d.id),
                    "destination_type": d.destination_type,
                    "destination_url": d.destination_url,
                    "destination_email": d.destination_email,
                    "is_reachable": d.is_reachable,
                    "smtp_working": d.smtp_working,
                    "webhook_active": d.webhook_active,
                    "last_verified": d.last_verified.isoformat() if d.last_verified else None,
                    "source": "db",
                })

            all_destinations = wp_destinations + db_dest_list

            await self._log_audit(
                website_id, "get_form_destinations", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"destinations_count": len(all_destinations)},
            )
            return {
                "form_id": form_id,
                "destinations": all_destinations,
                "total": len(all_destinations),
            }
        except Exception as e:
            await self._log_audit(
                website_id, "get_form_destinations", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get form destinations: {str(e)}", status_code=500)

    async def get_form_submissions(self, website_id: uuid.UUID, form_id: Optional[str] = None, status: Optional[str] = None, page: int = 1, page_size: int = 50) -> FormSubmissionListResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            skip = (page - 1) * page_size
            submissions = await self.submission_repo.get_by_website(
                website_id, status=status, form_id=form_id, skip=skip, limit=page_size
            )
            items = [
                FormSubmissionResponse(
                    id=s.id,
                    website_id=s.website_id,
                    form_id=s.form_id,
                    form_name=s.form_name,
                    plugin=s.plugin,
                    visitor_ip=s.visitor_ip,
                    submission_data=s.submission_data,
                    destination_type=s.destination_type,
                    destination_address=s.destination_address,
                    status=s.status,
                    delivery_status=s.delivery_status,
                    error_message=s.error_message,
                    submitted_at=s.submitted_at,
                    created_at=s.created_at,
                )
                for s in submissions
            ]
            total = await self.submission_repo.count_by_website(website_id, status=status)

            wp_items = []
            wp_total = 0
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_forms = await client.get_forms()
                await client.close()

                wp_forms_list = wp_forms.get("forms", []) if isinstance(wp_forms, dict) else wp_forms

                if form_id:
                    wp_submissions = await client.get_form_submissions(form_id)
                    await client.close()
                    wp_data = wp_submissions.get("submissions", [])
                    wp_total = wp_submissions.get("total", len(wp_data))
                    for s in wp_data:
                        wp_items.append(FormSubmissionResponse(
                            id=s.get("id", f"wp_{uuid.uuid4().hex[:8]}"),
                            website_id=website_id,
                            form_id=s.get("form_id", form_id),
                            form_name=s.get("form_name", s.get("form_name", "Unknown")),
                            plugin=s.get("plugin", "unknown"),
                            visitor_ip=s.get("visitor_ip"),
                            submission_data=s.get("submission_data"),
                            destination_type=s.get("destination_type"),
                            destination_address=s.get("destination_address"),
                            status=s.get("status", "sent"),
                            delivery_status=s.get("delivery_status"),
                            error_message=s.get("error_message"),
                            submitted_at=datetime.fromisoformat(s["submitted_at"].replace("Z", "+00:00")) if s.get("submitted_at") else datetime.utcnow(),
                            created_at=datetime.utcnow(),
                        ))
                else:
                    await client.close()
                    wp_items = []
                    wp_total = 0
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector form submissions fetch failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "get_form_submissions", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )

            if not items and wp_items:
                items = wp_items
                total = wp_total

            await self._log_audit(
                website_id, "get_form_submissions", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"submissions_count": len(items), "wp_submissions_count": len(wp_items)},
            )
            return FormSubmissionListResponse(items=items, total=total)
        except Exception as e:
            await self._log_audit(
                website_id, "get_form_submissions", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get form submissions: {str(e)}", status_code=500)

    async def get_submissions_summary(self, website_id: uuid.UUID) -> FormSubmissionSummaryResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_data = await client.get_submissions_summary()
                await client.close()
                wp_submissions = wp_data.get("submissions", [])
                summaries = [
                    FormSubmissionSummary(
                        form_id=s.get("form_id", ""),
                        form_name=s.get("form_name", ""),
                        plugin=s.get("plugin", ""),
                        total=s.get("total", 0),
                        sent=s.get("sent", 0),
                        failed=s.get("failed", 0),
                    )
                    for s in wp_submissions
                ]
                total_submissions = wp_data.get("total_submissions", len(summaries))
                total_sent = wp_data.get("total_sent", sum(s.sent for s in summaries))
                total_failed = wp_data.get("total_failed", sum(s.failed for s in summaries))
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector submissions summary fetch failed for {website_id}: {e}")
                summaries = []
                total_submissions = 0
                total_sent = 0
                total_failed = 0

            await self._log_audit(
                website_id, "get_submissions_summary", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
            )
            return FormSubmissionSummaryResponse(
                submissions=summaries,
                total_submissions=total_submissions,
                total_sent=total_sent,
                total_failed=total_failed,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "get_submissions_summary", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get submissions summary: {str(e)}", status_code=500)

    async def get_consent_details(self, website_id: uuid.UUID) -> ConsentDetailsResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            consent = await self.consent_repo.get_by_website(website_id)

            wp_consent_data: Dict[str, Any] = {}
            wp_consent_verified = False
            try:
                client = WordPressClient(
                    website.wp_admin_url or website.url,
                    website.wp_username,
                    website.wp_app_password,
                )
                wp_consent = await client.get_consent_details()
                await client.close()
                wp_consent_data = wp_consent.get("consent_config", {})
                wp_consent_verified = True
            except (WordPressAPIError, AppException) as e:
                logger.warning(f"WP connector consent details fetch failed for {website_id}: {e}")
                await self._log_audit(
                    website_id, "get_consent_details", "partial",
                    duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                    correlation_id=correlation_id,
                    warning_message=f"WP connector unavailable: {str(e)}",
                )

            verification_status = VerificationStatusEnum.verified if wp_consent_verified else VerificationStatusEnum.pending
            if consent:
                verification_status = consent.verification_status
                if wp_consent_verified:
                    verification_status = VerificationStatusEnum.verified
                    consent.last_verified = datetime.utcnow()
                    consent.error_message = None
                    await self.db.flush()

            await self._log_audit(
                website_id, "get_consent_details", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
            )

            return ConsentDetailsResponse(
                website_id=website_id,
                cookie_banner_enabled=wp_consent_data.get("cookie_banner_enabled", consent.cookie_banner_enabled if consent else False),
                consent_mode=wp_consent_data.get("consent_mode", consent.consent_mode if consent else None),
                privacy_policy_url=wp_consent_data.get("privacy_policy_url", consent.privacy_policy_url if consent else None),
                terms_url=wp_consent_data.get("terms_url", consent.terms_url if consent else None),
                cookie_categories=wp_consent_data.get("cookie_categories", consent.cookie_categories if consent else None),
                consent_management_plugin=wp_consent_data.get("consent_management_plugin"),
                consent_banner_text=wp_consent_data.get("consent_banner_text"),
                consent_button_text=wp_consent_data.get("consent_button_text"),
                data_retention_days=wp_consent_data.get("data_retention_days"),
                verification_status=verification_status,
                last_verified=consent.last_verified if consent else None,
                error_message=consent.error_message if consent else None,
            )
        except Exception as e:
            await self._log_audit(
                website_id, "get_consent_details", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get consent details: {str(e)}", status_code=500)

    async def create_measurement_plan(self, website_id: uuid.UUID, req: MeasurementPlanCreate) -> MeasurementPlanResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            plan = MeasurementPlan(
                website_id=website_id,
                name=req.name,
                description=req.description,
                status=req.status,
                business_goals=req.business_goals,
                target_events=req.target_events,
                kpi_definitions=req.kpi_definitions,
                tracking_providers=req.tracking_providers,
                kpi_targets=req.kpi_targets,
                created_by="system",
            )
            self.db.add(plan)
            await self.db.flush()
            await self.db.refresh(plan)

            await self._log_audit(
                website_id, "create_measurement_plan", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"plan_id": str(plan.id)},
            )
            return self._measurement_plan_to_response(plan)
        except Exception as e:
            await self._log_audit(
                website_id, "create_measurement_plan", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to create measurement plan: {str(e)}", status_code=500)

    async def get_measurement_plans(self, website_id: uuid.UUID, page: int = 1, page_size: int = 50) -> MeasurementPlanListResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            website = await self._get_website(website_id)
            skip = (page - 1) * page_size
            plans = await self.measurement_plan_repo.get_by_website(website_id)
            items = [self._measurement_plan_to_response(p) for p in plans]
            await self._log_audit(
                website_id, "get_measurement_plans", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"plans_count": len(items)},
            )
            return MeasurementPlanListResponse(items=items, total=len(items))
        except Exception as e:
            await self._log_audit(
                website_id, "get_measurement_plans", "error",
                correlation_id=correlation_id,
                error_message=str(e),
            )
            raise AppException(message=f"Failed to get measurement plans: {str(e)}", status_code=500)

    async def get_measurement_plan(self, website_id: uuid.UUID, plan_id: str) -> MeasurementPlanResponse:
        try:
            plan = await self.measurement_plan_repo.get(plan_id)
            if not plan or plan.website_id != website_id:
                raise NotFoundException("MeasurementPlan", plan_id)
            return self._measurement_plan_to_response(plan)
        except NotFoundException:
            raise
        except Exception as e:
            raise AppException(message=f"Failed to get measurement plan: {str(e)}", status_code=500)

    async def update_measurement_plan(self, website_id: uuid.UUID, plan_id: str, req: MeasurementPlanUpdate) -> MeasurementPlanResponse:
        correlation_id = self._generate_correlation_id()
        started_at = datetime.utcnow()
        try:
            plan = await self.measurement_plan_repo.get(plan_id)
            if not plan or plan.website_id != website_id:
                raise NotFoundException("MeasurementPlan", plan_id)

            update_data = {k: v for k, v in req.model_dump(exclude_unset=True).items() if v is not None}
            for key, value in update_data.items():
                setattr(plan, key, value)
            plan.updated_by = "system"
            await self.db.flush()
            await self.db.refresh(plan)

            await self._log_audit(
                website_id, "update_measurement_plan", "success",
                duration_seconds=(datetime.utcnow() - started_at).total_seconds(),
                correlation_id=correlation_id,
                metadata={"plan_id": plan_id},
            )
            return self._measurement_plan_to_response(plan)
        except NotFoundException:
            raise
        except Exception as e:
            raise AppException(message=f"Failed to update measurement plan: {str(e)}", status_code=500)

    async def delete_measurement_plan(self, website_id: uuid.UUID, plan_id: str) -> bool:
        try:
            plan = await self.measurement_plan_repo.get(plan_id)
            if not plan or plan.website_id != website_id:
                raise NotFoundException("MeasurementPlan", plan_id)
            await self.measurement_plan_repo.delete(plan_id)
            return True
        except NotFoundException:
            raise
        except Exception as e:
            raise AppException(message=f"Failed to delete measurement plan: {str(e)}", status_code=500)

    def _measurement_plan_to_response(self, plan: MeasurementPlan) -> MeasurementPlanResponse:
        return MeasurementPlanResponse(
            id=plan.id,
            website_id=plan.website_id,
            name=plan.name,
            description=plan.description,
            status=plan.status,
            business_goals=plan.business_goals,
            target_events=plan.target_events,
            kpi_definitions=plan.kpi_definitions,
            tracking_providers=plan.tracking_providers,
            kpi_targets=plan.kpi_targets,
            created_by=plan.created_by,
            updated_by=plan.updated_by,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
        )

    async def _get_website(self, website_id: uuid.UUID) -> Website:
        from app.modules.website.repository import WebsiteRepository
        repo = WebsiteRepository(self.db)
        website = await repo.get(website_id)
        if not website:
            raise NotFoundException("Website", website_id)
        return website