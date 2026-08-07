"""Search Console service — orchestrates the Google OAuth flow and API calls,
persisting results via the repository layer.

Follows the same dependency pattern as ``website/service.py``:
    service = SearchConsoleService(db: AsyncSession)
"""
from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("app.modules.search_console.service")

from app.core.config import settings
from app.core.cache import cache
from app.core.metrics import registry
from app.shared.utils.encryption import encrypt_value, decrypt_value
from app.modules.search_console.models import (
    SearchConsoleProperty,
    SearchConsoleCredential,
    UrlInspectionResult,
    SearchConsoleSitemap,
    SearchConsoleManualAction,
    SearchConsoleCrawlError,
    SearchConsoleEnhancement,
    SearchConsolePerformanceReport,
    SearchConsoleAuditLog,
    SearchConsoleSyncJob,
    SearchConsoleAlert,
    ConnectionStatusEnum,
    SyncStatusEnum,
    PropertyTypeEnum,
    PermissionLevelEnum,
    SiteOwnershipEnum,
    VerificationMethodEnum,
    AlertTypeEnum,
    AlertSeverityEnum,
    AlertStatusEnum,
)
from app.modules.search_console.repository import (
    SearchConsolePropertyRepository,
    SearchConsoleCredentialRepository,
    UrlInspectionResultRepository,
    SearchConsoleSitemapRepository,
    SearchConsoleManualActionRepository,
    SearchConsoleCrawlErrorRepository,
    SearchConsoleEnhancementRepository,
    SearchConsolePerformanceReportRepository,
    SearchConsoleAuditLogRepository,
    SearchConsoleSyncJobRepository,
    SearchConsoleAlertRepository,
)
from app.modules.search_console.google_client import (
    GoogleOAuthClient,
    SearchConsoleApiClient,
)
from app.modules.search_console.exceptions import (
    PropertyNotFoundException,
    PropertyNotConnectedException,
    GoogleOAuthException,
    SyncFailedException,
    VerificationFailedException,
    SearchConsoleException,
)
from app.modules.search_console.validators import validate_property_url, validate_site_url


class SearchConsoleService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.property_repo = SearchConsolePropertyRepository(db)
        self.credential_repo = SearchConsoleCredentialRepository(db)
        self.inspection_repo = UrlInspectionResultRepository(db)
        self.sitemap_repo = SearchConsoleSitemapRepository(db)
        self.manual_action_repo = SearchConsoleManualActionRepository(db)
        self.crawl_error_repo = SearchConsoleCrawlErrorRepository(db)
        self.enhancement_repo = SearchConsoleEnhancementRepository(db)
        self.performance_repo = SearchConsolePerformanceReportRepository(db)
        self.audit_log_repo = SearchConsoleAuditLogRepository(db)
        self.sync_job_repo = SearchConsoleSyncJobRepository(db)
        self.alert_repo = SearchConsoleAlertRepository(db)
        self._oauth_client: Optional[GoogleOAuthClient] = None
        self._api_client: Optional[SearchConsoleApiClient] = None

    # --- OAuth ---------------------------------------------------------------

    @property
    def oauth_client(self) -> GoogleOAuthClient:
        if self._oauth_client is None:
            self._oauth_client = GoogleOAuthClient()
        return self._oauth_client

    @property
    def api_client(self) -> SearchConsoleApiClient:
        if self._api_client is None:
            self._api_client = SearchConsoleApiClient()
        return self._api_client

    async def aclose_clients(self) -> None:
        if self._oauth_client is not None:
            await self._oauth_client.aclose()
            self._oauth_client = None
        if self._api_client is not None:
            await self._api_client.aclose()
            self._api_client = None

    # --- Audit logging -------------------------------------------------------

    async def _log_audit(
        self,
        action: str,
        actor: str = "system",
        status: str = "success",
        details: Optional[Dict[str, Any]] = None,
        property_id: Optional[uuid.UUID] = None,
    ) -> None:
        await self.audit_log_repo.create({
            "property_id": property_id,
            "action": action,
            "actor": actor,
            "status": status,
            "details": details or {},
        })
        await self.db.commit()

    # --- Property CRUD -------------------------------------------------------

    async def create_property(
        self,
        property_data: Dict[str, Any],
        actor: str = "system",
    ) -> SearchConsoleProperty:
        site_url = validate_site_url(property_data["site_url"])
        existing = await self.property_repo.get_by_site_url(site_url)
        if existing:
            raise SearchConsoleException(
                f"Property already exists for site_url: {site_url}",
                status_code=409,
            )

        obj_in = {
            "property_id": property_data["property_id"],
            "property_name": property_data["property_name"],
            "property_type": property_data["property_type"],
            "site_url": site_url,
            "permission_level": property_data.get("permission_level", PermissionLevelEnum.site_owner),
            "site_ownership": property_data.get("site_ownership", SiteOwnershipEnum.unverified),
            "verification_method": property_data.get("verification_method"),
            "connection_status": property_data.get("connection_status", ConnectionStatusEnum.pending),
            "is_verified": False,
            "created_by": property_data.get("created_by", actor),
        }
        prop = await self.property_repo.create(obj_in)
        await self.db.commit()
        await self.db.refresh(prop)
        await self._log_audit("property_created", actor, "success", {"property_id": str(prop.id)}, prop.id)
        return prop

    async def get_property(self, property_id: str) -> SearchConsoleProperty:
        prop = await self.property_repo.get_by_property_id_or_site_url(property_id)
        if prop is None:
            try:
                prop = await self.property_repo.get(uuid.UUID(property_id))
            except (ValueError, TypeError):
                pass
        if prop is None:
            raise PropertyNotFoundException(property_id)
        return prop

    async def get_properties(
        self,
        skip: int = 0,
        limit: int = 100,
        connection_status: Optional[str] = None,
    ) -> Tuple[List[SearchConsoleProperty], int]:
        return await self.property_repo.list_paginated(skip=skip, limit=limit, connection_status=connection_status)

    async def update_property(
        self,
        property_id: str,
        update_data: Dict[str, Any],
        actor: str = "system",
    ) -> SearchConsoleProperty:
        prop = await self.get_property(property_id)
        update_dict = {k: v for k, v in update_data.items() if v is not None}
        if "site_url" in update_dict:
            update_dict["site_url"] = validate_site_url(update_dict["site_url"])
        await self.property_repo.update(prop.id, update_dict)
        await self.db.commit()
        await self.db.refresh(prop)
        await self._log_audit("property_updated", actor, "success", {"fields": list(update_dict.keys())}, prop.id)
        return prop

    async def delete_property(self, property_id: str, actor: str = "system") -> bool:
        prop = await self.get_property(property_id)
        await self.property_repo.delete(prop.id)
        await self.db.commit()
        await self._log_audit("property_deleted", actor, "success", {"property_id": str(prop.id)}, None)
        return True

    # --- OAuth flow ----------------------------------------------------------

    def get_oauth_authorization_url(self, state: str, redirect_uri: Optional[str] = None) -> str:
        return self.oauth_client.get_authorization_url(state, redirect_uri)

    async def handle_oauth_callback(
        self,
        code: str,
        state: str,
        redirect_uri: Optional[str] = None,
        actor: str = "system",
    ) -> Dict[str, Any]:
        tokens = await self.oauth_client.exchange_code_for_tokens(code, redirect_uri)

        site_url = state  # state encodes the property site_url
        prop = await self.property_repo.get_by_site_url(site_url)
        if prop is None:
            raise PropertyNotFoundException(site_url)

        await self._store_credentials(prop.id, tokens)
        prop.connection_status = ConnectionStatusEnum.connected
        prop.is_verified = True
        prop.verified_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(prop)
        await self._log_audit("oauth_callback", actor, "success", {"property_id": str(prop.id)}, prop.id)

        return {
            "property_id": str(prop.id),
            "property_name": prop.property_name,
            "site_url": prop.site_url,
            "connection_status": prop.connection_status.value,
            "is_verified": prop.is_verified,
            "verified_at": prop.verified_at.isoformat() if prop.verified_at else None,
        }

    async def _store_credentials(self, property_id: uuid.UUID, tokens: Dict[str, Any]) -> None:
        encrypted_access = encrypt_value(tokens["access_token"]) if tokens.get("access_token") else None
        encrypted_refresh = encrypt_value(tokens["refresh_token"]) if tokens.get("refresh_token") else None

        existing = await self.credential_repo.get_by_property(property_id)
        if existing:
            existing.encrypted_access_token = encrypted_access
            existing.encrypted_refresh_token = encrypted_refresh
            existing.token_type = tokens.get("token_type", "Bearer")
            existing.scope = tokens.get("scope")
            existing.expires_at = tokens.get("expires_at")
            existing.refresh_expires_at = tokens.get("refresh_expires_at")
            existing.is_revoked = False
            existing.token_version = (existing.token_version or 0) + 1
            await self.db.commit()
            await self.db.refresh(existing)
        else:
            await self.credential_repo.create({
                "property_id": property_id,
                "encrypted_access_token": encrypted_access,
                "encrypted_refresh_token": encrypted_refresh,
                "token_type": tokens.get("token_type", "Bearer"),
                "scope": tokens.get("scope"),
                "expires_at": tokens.get("expires_at"),
                "refresh_expires_at": tokens.get("refresh_expires_at"),
            })
            await self.db.commit()

    async def _get_valid_access_token(self, property_id: uuid.UUID) -> str:
        """Return a valid (non-expired) access token, refreshing if necessary."""
        cred = await self.credential_repo.get_active_by_property(property_id)
        if cred is None:
            raise PropertyNotConnectedException(property_id)

        if self.oauth_client.token_needs_rotation(cred.expires_at):
            if cred.encrypted_refresh_token and not cred.is_revoked:
                try:
                    refresh_token = decrypt_value(cred.encrypted_refresh_token)
                    tokens = await self.oauth_client.refresh_access_token(refresh_token)
                    await self._store_credentials(property_id, tokens)
                    if tokens.get("access_token"):
                        return tokens["access_token"]
                except GoogleOAuthException:
                    pass

        if cred.encrypted_access_token:
            access_token = decrypt_value(cred.encrypted_access_token)
            if GoogleOAuthClient.validate_credentials(access_token):
                return access_token

        raise PropertyNotConnectedException(property_id)

    async def revoke_credentials(self, property_id: uuid.UUID, actor: str = "system") -> bool:
        cred = await self.credential_repo.get_by_property(property_id)
        if cred is None:
            return True

        if cred.encrypted_access_token:
            try:
                token = decrypt_value(cred.encrypted_access_token)
                await self.oauth_client.revoke_token(token)
            except Exception:
                pass

        if cred.encrypted_refresh_token:
            try:
                refresh_token = decrypt_value(cred.encrypted_refresh_token)
                await self.oauth_client.revoke_token(refresh_token)
            except Exception:
                pass

        cred.is_revoked = True
        await self.credential_repo.update(cred.id, {"is_revoked": True})
        await self.db.commit()
        await self._log_audit("credentials_revoked", actor, "success", {"property_id": str(property_id)}, property_id)
        return True

    # --- Verification --------------------------------------------------------

    async def get_verification_info(
        self, property_id: str, verification_method: str = "html"
    ) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)
        return await self.api_client.get_verification_token(prop.site_url, verification_method)

    async def verify_property(
        self, property_id: str, verification_method: str = "html", actor: str = "system"
    ) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)

        try:
            result = await self.api_client.verify_property(prop.site_url)
        except GoogleOAuthException as e:
            if e.status_code == 403:
                raise VerificationFailedException(
                    "Property verification failed — you may not have ownership rights",
                    details={"site_url": prop.site_url, "method": verification_method},
                )
            raise

        prop.is_verified = True
        prop.verified_at = datetime.now(timezone.utc)
        prop.verification_method = VerificationMethodEnum(verification_method)
        await self.db.commit()
        await self.db.refresh(prop)
        await self._log_audit("property_verified", actor, "success", {"method": verification_method}, prop.id)

        return {
            "property_id": str(prop.id),
            "is_verified": prop.is_verified,
            "verified_at": prop.verified_at.isoformat() if prop.verified_at else None,
            "verification_method": prop.verification_method.value if prop.verification_method else None,
        }

    # --- URL Inspection ------------------------------------------------------

    async def inspect_url(
        self, property_id: str, inspected_url: str, actor: str = "system"
    ) -> UrlInspectionResult:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)

        try:
            raw = await self.api_client.inspect_url(prop.site_url, inspected_url)
        except GoogleOAuthException as e:
            await self._log_audit("url_inspect", actor, "failed", {"url": inspected_url, "error": str(e)}, prop.id)
            raise

        inspection = raw.get("inspectionResult", {})
        last_crawl = inspection.get("lastCrawlTime")
        parsed_last_crawl = None
        if last_crawl:
            try:
                parsed_last_crawl = datetime.fromisoformat(last_crawl.replace("Z", "+00:00"))
            except (ValueError, TypeError):
                pass

        result = await self.inspection_repo.create({
            "property_id": prop.id,
            "inspected_url": inspected_url,
            "coverage_status": inspection.get("coverageState", "unknown"),
            "last_crawl_time": parsed_last_crawl,
            "crawl_error_code": inspection.get("crawlErrorCode"),
            "canonical_url": inspection.get("googleCanonicalUrl"),
            "page_is_indexable": inspection.get("pageIsIndexable"),
            "has_json_ld": inspection.get("hasJsonLdStructuredData"),
            "has_microdata": inspection.get("hasMicrodata"),
            "is_roboted": inspection.get("isRoboted"),
            "is_noindex": inspection.get("isNoindex"),
            "is_unreachable": inspection.get("isUnreachable"),
            "inspection_result": raw,
        })
        await self.db.commit()
        await self.db.refresh(result)
        # A fresh inspection invalidates cached inspection lists for the property.
        await cache.delete_pattern("search-console:inspections", f"{prop.id}:*")
        registry.increment("search_console_inspections_total")
        await self._log_audit("url_inspect", actor, "success", {"url": inspected_url}, prop.id)
        return result

    async def get_url_inspections(
        self, property_id: str, skip: int = 0, limit: int = 100
    ) -> Tuple[List[Dict[str, Any]], int]:
        prop = await self.get_property(property_id)
        cache_key = f"{prop.id}:{skip}:{limit}"
        cached = await cache.get("search-console:inspections", cache_key)
        if cached is not None:
            registry.increment("search_console_cache_hits", labels={"kind": "inspections"})
            return cached["items"], cached["total"]
        items, total = await self.inspection_repo.get_by_property(prop.id, limit=limit)
        serialized = [self._inspection_to_dict(i) for i in items]
        await cache.set("search-console:inspections", cache_key, {"items": serialized, "total": total})
        return serialized, total

    @staticmethod
    def _inspection_to_dict(insp: UrlInspectionResult) -> Dict[str, Any]:
        return {
            "id": str(insp.id),
            "property_id": str(insp.property_id),
            "inspected_url": insp.inspected_url,
            "coverage_status": insp.coverage_status,
            "last_crawl_time": insp.last_crawl_time.isoformat() if insp.last_crawl_time else None,
            "crawl_error_code": insp.crawl_error_code,
            "canonical_url": insp.canonical_url,
            "page_is_indexable": insp.page_is_indexable,
            "has_json_ld": insp.has_json_ld,
            "has_microdata": insp.has_microdata,
            "is_roboted": insp.is_roboted,
            "is_noindex": insp.is_noindex,
            "is_unreachable": insp.is_unreachable,
            "inspected_at": insp.inspected_at.isoformat() if insp.inspected_at else None,
        }

    # --- Sitemaps ------------------------------------------------------------

    async def get_sitemaps(
        self, property_id: str, skip: int = 0, limit: int = 100
    ) -> Tuple[List[SearchConsoleSitemap], int]:
        prop = await self.get_property(property_id)
        return await self.sitemap_repo.get_by_property(prop.id, skip=skip, limit=limit)

    async def add_sitemap(
        self, property_id: str, sitemap_data: Dict[str, Any], actor: str = "system"
    ) -> SearchConsoleSitemap:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)

        try:
            await self.api_client.submit_sitemap(prop.site_url, sitemap_data["site_url"])
        except GoogleOAuthException as e:
            await self._log_audit("sitemap_add", actor, "failed", {"error": str(e)}, prop.id)
            raise

        existing = await self.sitemap_repo.get_by_path(prop.id, sitemap_data["site_url"])
        if existing:
            await self.sitemap_repo.update(existing.id, {
                "type": sitemap_data.get("type", "sitemap"),
                "is_pending_sitemap": True,
            })
            await self.db.commit()
            await self.db.refresh(existing)
            result = existing
        else:
            result = await self.sitemap_repo.create({
                "property_id": prop.id,
                "site_url": sitemap_data["site_url"],
                "type": sitemap_data.get("type", "sitemap"),
                "is_pending_sitemap": True,
                "path": sitemap_data["site_url"],
            })
            await self.db.commit()
            await self.db.refresh(result)

        await self._log_audit("sitemap_add", actor, "success", {"sitemap_url": sitemap_data["site_url"]}, prop.id)
        return result

    async def sync_sitemaps(self, property_id: uuid.UUID) -> List[SearchConsoleSitemap]:
        prop = await self.property_repo.get(property_id)
        if prop is None:
            raise PropertyNotFoundException(property_id)

        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)

        try:
            raw = await self.api_client.get_sitemaps(prop.site_url)
        except GoogleOAuthException:
            raise SyncFailedException("Failed to fetch sitemaps from Google")

        await self.sitemap_repo.delete_by_property(prop.id)

        results: List[SearchConsoleSitemap] = []
        for entry in raw.get("sitemapEntries", []):
            obj_in = {
                "property_id": prop.id,
                "site_url": prop.site_url,
                "type": entry.get("type", "sitemap"),
                "is_pending_sitemap": entry.get("isPendingSitemap", False),
                "path": entry.get("path"),
                "is_index_notify_allowed": entry.get("isIndexNotifyAllowed"),
                "submitted_at": entry.get("submittedAt"),
                "last_downloaded_at": entry.get("lastDownloadedAt"),
                "warnings_count": entry.get("warnings", 0),
                "errors_count": entry.get("errors", 0),
                "contents": entry.get("contents"),
            }
            sitemap = await self.sitemap_repo.create(obj_in)
            results.append(sitemap)

        await self.db.commit()
        return results

    # --- Manual Actions ------------------------------------------------------

    async def get_manual_actions(
        self, property_id: str, skip: int = 0, limit: int = 100
    ) -> Tuple[List[SearchConsoleManualAction], int]:
        prop = await self.get_property(property_id)
        return await self.manual_action_repo.get_by_property(prop.id, skip=skip, limit=limit)

    async def sync_manual_actions(self, property_id: uuid.UUID) -> List[SearchConsoleManualAction]:
        prop = await self.property_repo.get(property_id)
        if prop is None:
            raise PropertyNotFoundException(property_id)

        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)

        try:
            raw = await self.api_client.get_manual_actions(prop.site_url)
        except GoogleOAuthException:
            raise SyncFailedException("Failed to fetch manual actions from Google")

        await self.manual_action_repo.delete_by_property(prop.id)

        results: List[SearchConsoleManualAction] = []
        for action in raw.get("manualActions", []):
            obj_in = {
                "property_id": prop.id,
                "action_type": action.get("actionType", "unknown"),
                "action_reason": action.get("actionReason"),
                "sites_affected": action.get("sitesAffected"),
                "is_partial": action.get("isPartial", False),
                "resolution": action.get("resolution", "pending"),
                "created_at": action.get("createdAt") or datetime.now(timezone.utc),
            }
            ma = await self.manual_action_repo.create(obj_in)
            results.append(ma)

        await self.db.commit()
        return results

    # --- Crawl Errors --------------------------------------------------------

    async def get_crawl_errors(
        self, property_id: str, skip: int = 0, limit: int = 100, error_type: Optional[str] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        prop = await self.get_property(property_id)
        cache_key = f"{prop.id}:{skip}:{limit}:{error_type or 'all'}"
        cached = await cache.get("search-console:crawl-errors", cache_key)
        if cached is not None:
            registry.increment("search_console_cache_hits", labels={"kind": "crawl_errors"})
            return cached["items"], cached["total"]
        items, total = await self.crawl_error_repo.get_by_property(
            prop.id, skip=skip, limit=limit, error_type=error_type
        )
        serialized = [self._crawl_error_to_dict(e) for e in items]
        await cache.set("search-console:crawl-errors", cache_key, {"items": serialized, "total": total})
        return serialized, total

    @staticmethod
    def _crawl_error_to_dict(err: SearchConsoleCrawlError) -> Dict[str, Any]:
        return {
            "id": str(err.id),
            "property_id": str(err.property_id),
            "platform": err.platform,
            "error_type": err.error_type,
            "error_sub_type": err.error_sub_type,
            "page_url": err.page_url,
            "referring_url": err.referring_url,
            "status_code": err.status_code,
            "detected_at": err.detected_at.isoformat() if err.detected_at else None,
            "resolved": err.resolved,
            "resolved_at": err.resolved_at.isoformat() if err.resolved_at else None,
        }

    async def sync_crawl_errors(self, property_id: uuid.UUID) -> List[SearchConsoleCrawlError]:
        prop = await self.property_repo.get(property_id)
        if prop is None:
            raise PropertyNotFoundException(property_id)

        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)

        errors: List[SearchConsoleCrawlError] = []
        # Load existing unresolved errors so we can upsert (deduplication /
        # conflict resolution) instead of inserting duplicates.
        existing_list, _ = await self.crawl_error_repo.get_by_property(prop.id, limit=10000)
        existing_by_key = {
            (e.page_url, e.error_type, e.error_sub_type): e
            for e in existing_list if not e.resolved
        }
        try:
            crawl_stats = await self.api_client.get_crawl_stats(prop.site_url)
            for day_data in crawl_stats.get("crawlDiagnostics", {}).get("webCrawl", {}).get("timeSeries", {}).get("crawlablePages", {}).get("all", {}).get("results", []):
                detected_at = None
                detected_at_str = day_data.get("detectedAt")
                if detected_at_str:
                    try:
                        detected_at = datetime.fromisoformat(detected_at_str.replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        pass
                resolved_at = None
                resolved_at_str = day_data.get("resolvedAt")
                if resolved_at_str:
                    try:
                        resolved_at = datetime.fromisoformat(resolved_at_str.replace("Z", "+00:00"))
                    except (ValueError, TypeError):
                        pass
                page_url = day_data.get("pageUrl", "")
                error_type = day_data.get("errorType", "unknown")
                error_sub_type = day_data.get("errorSubType")
                dedup_key = (page_url, error_type, error_sub_type)

                obj_in = {
                    "property_id": prop.id,
                    "platform": day_data.get("platform", "web"),
                    "error_type": error_type,
                    "error_sub_type": error_sub_type,
                    "page_url": page_url,
                    "referring_url": day_data.get("referringUrl"),
                    "status_code": day_data.get("statusCode"),
                    "detected_at": detected_at or datetime.now(timezone.utc),
                    "resolved": day_data.get("resolved", False),
                    "resolved_at": resolved_at,
                }

                if dedup_key in existing_by_key:
                    # Conflict resolution: last sync wins — update the existing
                    # row rather than inserting a duplicate.
                    existing = existing_by_key[dedup_key]
                    await self.crawl_error_repo.update(existing.id, obj_in)
                    await self.db.refresh(existing)
                    errors.append(existing)
                else:
                    error = await self.crawl_error_repo.create(obj_in)
                    errors.append(error)
                    existing_by_key[dedup_key] = error
        except GoogleOAuthException:
            pass

        await self.db.commit()
        await cache.delete_pattern("search-console:crawl-errors", f"{prop.id}:*")
        registry.increment("search_console_crawl_errors_synced", value=len(errors))
        return errors

    # --- Enhancements --------------------------------------------------------

    async def get_enhancements(self, property_id: str) -> List[Dict[str, Any]]:
        prop = await self.get_property(property_id)
        cache_key = str(prop.id)
        cached = await cache.get("search-console:enhancements", cache_key)
        if cached is not None:
            registry.increment("search_console_cache_hits", labels={"kind": "enhancements"})
            return cached
        items = await self.enhancement_repo.get_by_property(prop.id)
        serialized = [self._enhancement_to_dict(e) for e in items]
        await cache.set("search-console:enhancements", cache_key, serialized)
        return serialized

    @staticmethod
    def _enhancement_to_dict(enh: SearchConsoleEnhancement) -> Dict[str, Any]:
        return {
            "id": str(enh.id),
            "property_id": str(enh.property_id),
            "enhancement_type": enh.enhancement_type,
            "status": enh.status,
            "items_count": enh.items_count,
            "details": enh.details,
            "created_at": enh.created_at.isoformat() if enh.created_at else None,
        }

    async def sync_enhancements(self, property_id: uuid.UUID) -> List[SearchConsoleEnhancement]:
        prop = await self.property_repo.get(property_id)
        if prop is None:
            raise PropertyNotFoundException(property_id)

        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)

        enhancement_types = [
            ("mobile_usability", "mobileUsability"),
            ("amp", "amp"),
            ("rich_results", "rich-results"),
            ("core_web_vitals", "core-web-vitals"),
            ("index_coverage", "index-coverage"),
            ("links", "links"),
        ]

        results: List[SearchConsoleEnhancement] = []
        for internal_type, api_type in enhancement_types:
            try:
                if internal_type == "mobile_usability":
                    raw = await self.api_client.get_mobile_usability(prop.site_url)
                    items = raw.get("mobileUsability", [])
                    exists = await self.enhancement_repo.get_by_type(prop.id, internal_type)
                    obj_in = {
                        "property_id": prop.id,
                        "enhancement_type": internal_type,
                        "status": "error" if items else "valid",
                        "items_count": len(items),
                        "details": {"issues": items},
                    }
                    if exists:
                        await self.enhancement_repo.update(exists.id, obj_in)
                        await self.db.refresh(exists)
                        results.append(exists)
                    else:
                        result = await self.enhancement_repo.create(obj_in)
                        results.append(result)
                elif internal_type == "amp":
                    raw = await self.api_client.get_amp_issues(prop.site_url)
                    items = raw.get("amp", [])
                    exists = await self.enhancement_repo.get_by_type(prop.id, internal_type)
                    obj_in = {
                        "property_id": prop.id,
                        "enhancement_type": internal_type,
                        "status": "error" if items else "valid",
                        "items_count": len(items),
                        "details": {"issues": items},
                    }
                    if exists:
                        await self.enhancement_repo.update(exists.id, obj_in)
                        await self.db.refresh(exists)
                        results.append(exists)
                    else:
                        result = await self.enhancement_repo.create(obj_in)
                        results.append(result)
                elif internal_type == "rich_results":
                    raw = await self.api_client.get_rich_results(prop.site_url)
                    items = raw.get("richResults", [])
                    exists = await self.enhancement_repo.get_by_type(prop.id, internal_type)
                    obj_in = {
                        "property_id": prop.id,
                        "enhancement_type": internal_type,
                        "status": "error" if items else "valid",
                        "items_count": len(items),
                        "details": {"issues": items},
                    }
                    if exists:
                        await self.enhancement_repo.update(exists.id, obj_in)
                        await self.db.refresh(exists)
                        results.append(exists)
                    else:
                        result = await self.enhancement_repo.create(obj_in)
                        results.append(result)
                elif internal_type == "core_web_vitals":
                    raw = await self.api_client.get_core_web_vitals(prop.site_url)
                    items = raw.get("coreWebVitals", [])
                    exists = await self.enhancement_repo.get_by_type(prop.id, internal_type)
                    obj_in = {
                        "property_id": prop.id,
                        "enhancement_type": internal_type,
                        "status": "error" if items else "valid",
                        "items_count": len(items),
                        "details": {"issues": items},
                    }
                    if exists:
                        await self.enhancement_repo.update(exists.id, obj_in)
                        await self.db.refresh(exists)
                        results.append(exists)
                    else:
                        result = await self.enhancement_repo.create(obj_in)
                        results.append(result)
                elif internal_type == "index_coverage":
                    raw = await self.api_client.get_index_status(prop.site_url)
                    items = raw.get("indexStatus", [])
                    exists = await self.enhancement_repo.get_by_type(prop.id, internal_type)
                    obj_in = {
                        "property_id": prop.id,
                        "enhancement_type": internal_type,
                        "status": "error" if items else "valid",
                        "items_count": len(items),
                        "details": {"issues": items},
                    }
                    if exists:
                        await self.enhancement_repo.update(exists.id, obj_in)
                        await self.db.refresh(exists)
                        results.append(exists)
                    else:
                        result = await self.enhancement_repo.create(obj_in)
                        results.append(result)
                elif internal_type == "links":
                    raw = await self.api_client.get_links(prop.site_url)
                    items = raw.get("links", [])
                    exists = await self.enhancement_repo.get_by_type(prop.id, internal_type)
                    obj_in = {
                        "property_id": prop.id,
                        "enhancement_type": internal_type,
                        "status": "error" if items else "valid",
                        "items_count": len(items),
                        "details": {"issues": items},
                    }
                    if exists:
                        await self.enhancement_repo.update(exists.id, obj_in)
                        await self.db.refresh(exists)
                        results.append(exists)
                    else:
                        result = await self.enhancement_repo.create(obj_in)
                        results.append(result)
            except GoogleOAuthException:
                pass

        await self.db.commit()
        # Sync invalidates the cached enhancement list for the property.
        await cache.delete_pattern("search-console:enhancements", f"{prop.id}")
        registry.increment("search_console_enhancements_synced", value=len(results))
        return results

    # --- Performance ---------------------------------------------------------

    async def get_performance(
        self,
        property_id: str,
        start_date: str,
        end_date: str,
        dimensions: Optional[List[str]] = None,
        row_limit: int = 1000,
        start_row: int = 0,
        actor: str = "system",
        use_cache: bool = True,
    ) -> Dict[str, Any]:
        prop = await self.get_property(property_id)

        cache_key = self._perf_cache_key(prop.id, start_date, end_date, dimensions)
        if use_cache:
            cached = await cache.get("search-console:performance", cache_key)
            if cached is not None:
                registry.increment("search_console_cache_hits", labels={"kind": "performance"})
                return cached

        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)

        try:
            with registry.timed("search_console_api_duration_seconds", labels={"op": "performance"}):
                raw = await self.api_client.get_performance(
                    prop.site_url, start_date, end_date, dimensions, row_limit, start_row
                )
        except GoogleOAuthException as e:
            await self._log_audit("performance_query", actor, "failed", {"error": str(e)}, prop.id)
            raise

        rows = raw.get("rows", [])
        # Deduplicate rows that share the same dimension tuple.
        rows = self._dedup_dimension_rows(rows)
        # Replace any previously stored report for the same range/dimensions
        # (last-write-wins conflict resolution).
        await self._replace_performance_report(prop.id, start_date, end_date, dimensions, rows, raw, row_limit)
        registry.increment("search_console_queries", labels={"kind": "performance"})

        result = {
            "rows": rows,
            "total_rows": raw.get("totalRows", len(rows)),
            "date_range": {"start": start_date, "end": end_date},
        }
        await cache.set("search-console:performance", cache_key, result)
        await self._log_audit("performance_query", actor, "success", {"rows": len(rows)}, prop.id)
        return result

    @staticmethod
    def _perf_cache_key(property_uuid, start_date: str, end_date: str, dimensions: Optional[List[str]]) -> str:
        dims = ",".join(sorted(dimensions)) if dimensions else "default"
        return f"{property_uuid}:{start_date}:{end_date}:{dims}"

    @staticmethod
    def _dedup_dimension_rows(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate rows that share the same dimension tuple.

        Google can return the same key on a paginated boundary; the last
        occurrence wins (it carries the accumulated metrics).
        """
        seen: Dict[str, Dict[str, Any]] = {}
        for row in rows:
            keys = row.get("keys") or []
            dedup_key = "|".join(str(k) for k in keys)
            seen[dedup_key] = row
        return list(seen.values())

    async def _replace_performance_report(self, property_uuid, start_date: str, end_date: str,
                                          dimensions: Optional[List[str]], rows: List[Dict[str, Any]],
                                          raw: Dict[str, Any], row_limit: int) -> None:
        """Delete older reports for the same (property, range, dimensions) and
        store a single fresh snapshot (last-write-wins)."""
        from sqlalchemy import delete

        await self.db.execute(
            delete(self.performance_repo.model).where(
                self.performance_repo.model.property_id == property_uuid,
                self.performance_repo.model.start_date == start_date,
                self.performance_repo.model.end_date == end_date,
            )
        )
        await self.performance_repo.create({
            "property_id": property_uuid,
            "start_date": start_date,
            "end_date": end_date,
            "dimensions": dimensions,
            "metrics": ["clicks", "impressions", "ctr", "position"],
            "rows": rows,
            "total_rows": raw.get("totalRows", len(rows)),
            "row_limit": row_limit,
        })
        await self.db.commit()
        await cache.delete_pattern("search-console:performance", f"{property_uuid}:*")

    async def get_search_queries(
        self,
        property_id: str,
        start_date: str,
        end_date: str,
        row_limit: int = 1000,
    ) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)
        raw = await self.api_client.get_search_analytics_queries(prop.site_url, start_date, end_date, row_limit)
        rows = raw.get("rows", [])
        return {
            "rows": rows,
            "total_rows": raw.get("totalRows", len(rows)),
            "date_range": {"start": start_date, "end": end_date},
        }

    async def get_pages(
        self, property_id: str, start_date: str, end_date: str, row_limit: int = 1000
    ) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)
        raw = await self.api_client.get_search_analytics_pages(prop.site_url, start_date, end_date, row_limit)
        rows = raw.get("rows", [])
        return {
            "rows": rows,
            "total_rows": raw.get("totalRows", len(rows)),
            "date_range": {"start": start_date, "end": end_date},
        }

    async def get_devices(
        self, property_id: str, start_date: str, end_date: str, row_limit: int = 100
    ) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)
        raw = await self.api_client.get_search_analytics_devices(prop.site_url, start_date, end_date, row_limit)
        rows = raw.get("rows", [])
        return {
            "rows": rows,
            "total_rows": raw.get("totalRows", len(rows)),
            "date_range": {"start": start_date, "end": end_date},
        }

    async def get_countries(
        self, property_id: str, start_date: str, end_date: str, row_limit: int = 100
    ) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)
        raw = await self.api_client.get_search_analytics_countries(prop.site_url, start_date, end_date, row_limit)
        rows = raw.get("rows", [])
        return {
            "rows": rows,
            "total_rows": raw.get("totalRows", len(rows)),
            "date_range": {"start": start_date, "end": end_date},
        }

    async def get_security_issues(self, property_id: str) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        access_token = await self._get_valid_access_token(prop.id)
        self.api_client.set_access_token(access_token)
        return await self.api_client.get_security_issues(prop.site_url)

    # --- Sync orchestration --------------------------------------------------

    async def sync_property(
        self, property_id: str, sync_type: str = "full", force: bool = False, actor: str = "system"
    ) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        if prop.connection_status != ConnectionStatusEnum.connected and not force:
            raise PropertyNotConnectedException(property_id)

        job = await self.sync_job_repo.create({
            "property_id": prop.id,
            "sync_type": sync_type,
            "status": SyncStatusEnum.running,
            "started_at": datetime.now(timezone.utc),
            "max_retries": settings.SEARCH_CONSOLE_MAX_RETRIES,
        })
        await self.db.commit()
        await self.db.refresh(job)

        started = datetime.now(timezone.utc)
        errors: List[str] = []

        try:
            if sync_type in ("full", "sitemaps"):
                await self.sync_sitemaps(prop.id)
            if sync_type in ("full", "manual_actions"):
                await self.sync_manual_actions(prop.id)
            if sync_type in ("full", "crawl_errors"):
                await self.sync_crawl_errors(prop.id)
            if sync_type in ("full", "enhancements"):
                await self.sync_enhancements(prop.id)
            if sync_type in ("full", "performance"):
                from datetime import timedelta as td
                end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
                start_date = (datetime.now(timezone.utc) - td(days=28)).strftime("%Y-%m-%d")
                await self.get_performance(str(prop.id), start_date, end_date)

            completed = datetime.now(timezone.utc)
            duration = (completed - started).total_seconds()
            await self.sync_job_repo.update(job.id, {
                "status": SyncStatusEnum.completed,
                "completed_at": completed,
                "duration_seconds": duration,
            })
            await self.db.commit()
            await self.db.refresh(job)

            prop.last_sync_at = completed
            prop.sync_status = "synced"
            await self.db.commit()
            await self._log_audit("sync_completed", actor, "success", {"sync_type": sync_type, "duration": duration}, prop.id)

            return {
                "job_id": str(job.id),
                "property_id": str(prop.id),
                "sync_type": sync_type,
                "status": job.status.value,
                "started_at": job.started_at.isoformat(),
                "message": f"Sync completed successfully ({len(errors)} errors)",
            }

        except Exception as e:
            errors.append(str(e))
            completed = datetime.now(timezone.utc)
            duration = (completed - started).total_seconds()
            await self.sync_job_repo.update(job.id, {
                "status": SyncStatusEnum.failed,
                "completed_at": completed,
                "duration_seconds": duration,
                "error_message": str(e),
            })
            await self.db.commit()
            await self.db.refresh(job)

            # Retry scheduling / dead-job detection (exponential backoff).
            from app.modules.search_console.retry import schedule_job_retry
            await schedule_job_retry(self.db, job, str(e))
            await self.db.refresh(job)
            registry.increment("search_console_sync_failures", labels={"sync_type": sync_type})

            prop.last_sync_at = completed
            prop.sync_status = "failed"
            prop.sync_error = str(e)
            await self.db.commit()
            await self._log_audit("sync_failed", actor, "failed", {"sync_type": sync_type, "error": str(e)}, prop.id)

            return {
                "job_id": str(job.id),
                "property_id": str(prop.id),
                "sync_type": sync_type,
                "status": job.status.value,
                "started_at": job.started_at.isoformat(),
                "message": f"Sync failed: {str(e)}",
            }

    # --- Incremental sync -----------------------------------------------------

    async def sync_property_incremental(
        self, property_id: str, actor: str = "system"
    ) -> Dict[str, Any]:
        """Incremental sync — only fetches data that changed since the last
        successful sync.

        * Performance rows are fetched for the window
          ``[last_sync_at, today]`` (capped at
          ``SEARCH_CONSOLE_INCREMENTAL_LOOKBACK_DAYS``).
        * The cheap replace-style datasets (sitemaps, manual actions,
          crawl errors, enhancements) are always refreshed — they replace
          their rows so there is no growth.
        """
        prop = await self.get_property(property_id)
        if prop.connection_status != ConnectionStatusEnum.connected:
            raise PropertyNotConnectedException(property_id)

        job = await self.sync_job_repo.create({
            "property_id": prop.id,
            "sync_type": "incremental",
            "status": SyncStatusEnum.running,
            "started_at": datetime.now(timezone.utc),
            "max_retries": settings.SEARCH_CONSOLE_MAX_RETRIES,
        })
        await self.db.commit()
        await self.db.refresh(job)
        started = datetime.now(timezone.utc)

        try:
            from datetime import timedelta as td

            lookback = settings.SEARCH_CONSOLE_INCREMENTAL_LOOKBACK_DAYS
            if prop.last_sync_at is not None:
                since = prop.last_sync_at.date().isoformat()
            else:
                since = (datetime.now(timezone.utc) - td(days=lookback)).strftime("%Y-%m-%d")
            end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

            # Performance is the only expensive dataset — use the window.
            await self.get_performance(str(prop.id), since, end_date, dimensions=["query"], use_cache=False)

            # Replace-style datasets are always refreshed (dedup + last-write-wins).
            await self.sync_sitemaps(prop.id)
            await self.sync_manual_actions(prop.id)
            await self.sync_crawl_errors(prop.id)
            await self.sync_enhancements(prop.id)

            completed = datetime.now(timezone.utc)
            duration = (completed - started).total_seconds()
            await self.sync_job_repo.update(job.id, {
                "status": SyncStatusEnum.completed,
                "completed_at": completed,
                "duration_seconds": duration,
            })
            await self.db.commit()
            await self.db.refresh(job)

            prop.last_sync_at = completed
            prop.sync_status = "synced"
            prop.sync_error = None
            await self.db.commit()
            await self._log_audit("sync_completed", actor, "success",
                                  {"sync_type": "incremental", "duration": duration}, prop.id)

            return {
                "job_id": str(job.id),
                "property_id": str(prop.id),
                "sync_type": "incremental",
                "status": job.status.value,
                "started_at": job.started_at.isoformat(),
                "message": "Incremental sync completed",
            }
        except Exception as e:
            completed = datetime.now(timezone.utc)
            duration = (completed - started).total_seconds()
            await self.sync_job_repo.update(job.id, {
                "status": SyncStatusEnum.failed,
                "completed_at": completed,
                "duration_seconds": duration,
                "error_message": str(e),
            })
            await self.db.commit()
            await self.db.refresh(job)

            from app.modules.search_console.retry import schedule_job_retry
            await schedule_job_retry(self.db, job, str(e))
            await self.db.refresh(job)

            prop.sync_status = "failed"
            prop.sync_error = str(e)
            await self.db.commit()
            await self._log_audit("sync_failed", actor, "failed",
                                  {"sync_type": "incremental", "error": str(e)}, prop.id)
            return {
                "job_id": str(job.id),
                "property_id": str(prop.id),
                "sync_type": "incremental",
                "status": job.status.value,
                "started_at": job.started_at.isoformat(),
                "message": f"Incremental sync failed: {str(e)}",
            }

    # --- Status --------------------------------------------------------------

    async def get_status(self, property_id: str) -> Dict[str, Any]:
        prop = await self.get_property(property_id)
        cred = await self.credential_repo.get_active_by_property(prop.id)

        token_expired = True
        token_expires_at = None
        if cred and cred.expires_at:
            token_expires_at = cred.expires_at.isoformat()
            token_expired = self.oauth_client.is_token_expired(cred.expires_at)

        credential_status = "valid" if cred and not cred.is_revoked and not token_expired else "expired"

        return {
            "property_id": str(prop.id),
            "property_name": prop.property_name,
            "site_url": prop.site_url,
            "connection_status": prop.connection_status.value,
            "is_verified": prop.is_verified,
            "verified_at": prop.verified_at.isoformat() if prop.verified_at else None,
            "last_sync_at": prop.last_sync_at.isoformat() if prop.last_sync_at else None,
            "sync_status": prop.sync_status,
            "sync_error": prop.sync_error,
            "credential_status": credential_status,
            "token_expires_at": token_expires_at,
            "token_expired": token_expired,
        }

    async def get_audit_logs(
        self, property_id: str, skip: int = 0, limit: int = 100
    ) -> Tuple[List[SearchConsoleAuditLog], int]:
        prop = await self.get_property(property_id)
        return await self.audit_log_repo.get_by_property(prop.id, skip=skip, limit=limit)

    async def get_sync_jobs(
        self, property_id: str, skip: int = 0, limit: int = 100, status: Optional[str] = None
    ) -> Tuple[List[SearchConsoleSyncJob], int]:
        prop = await self.get_property(property_id)
        return await self.sync_job_repo.get_by_property(prop.id, skip=skip, limit=limit, status=status)

    # --- Monitoring -----------------------------------------------------------

    async def get_sync_stats(self) -> Dict[str, Any]:
        """Aggregate execution statistics across all sync jobs.

        Used by the monitoring component: counts by status, dead jobs,
        retries, and average duration over the last 100 jobs.
        """
        from sqlalchemy import func, select

        total_result = await self.db.execute(select(func.count()).select_from(SearchConsoleSyncJob))
        total = total_result.scalar_one()

        status_rows = await self.db.execute(
            select(SearchConsoleSyncJob.status, func.count())
            .group_by(SearchConsoleSyncJob.status)
        )
        by_status = {str(s.value): c for s, c in status_rows.all()}

        dead_result = await self.db.execute(
            select(func.count()).select_from(SearchConsoleSyncJob).where(SearchConsoleSyncJob.is_dead.is_(True))
        )
        dead = dead_result.scalar_one()

        retries_result = await self.db.execute(
            select(func.sum(SearchConsoleSyncJob.retry_count))
        )
        total_retries = retries_result.scalar() or 0

        avg_result = await self.db.execute(
            select(func.avg(SearchConsoleSyncJob.duration_seconds))
            .where(SearchConsoleSyncJob.duration_seconds.isnot(None))
        )
        avg_duration = avg_result.scalar()

        return {
            "total_jobs": total,
            "by_status": by_status,
            "dead_jobs": dead,
            "total_retries": total_retries,
            "avg_duration_seconds": round(avg_duration, 2) if avg_duration is not None else None,
        }

    async def get_module_health(self) -> Dict[str, Any]:
        """Module health: connected properties, sync freshness, cache status."""
        from sqlalchemy import func, select

        connected_result = await self.db.execute(
            select(func.count())
            .select_from(SearchConsoleProperty)
            .where(SearchConsoleProperty.connection_status == ConnectionStatusEnum.connected)
        )
        connected = connected_result.scalar_one()

        stale_result = await self.db.execute(
            select(func.count())
            .select_from(SearchConsoleProperty)
            .where(SearchConsoleProperty.connection_status == ConnectionStatusEnum.connected)
            .where(SearchConsoleProperty.last_sync_at.is_(None))
        )
        never_synced = stale_result.scalar_one()

        cache_ok = await cache.ping()
        return {
            "status": "healthy",
            "connected_properties": connected,
            "never_synced": never_synced,
            "cache": "ok" if cache_ok else "unavailable",
            "service": "search-console",
        }

    # --- Alerts ----------------------------------------------------------------

    async def raise_alert(
        self,
        alert_type: AlertTypeEnum,
        severity: AlertSeverityEnum,
        title: str,
        message: str,
        property_id: Optional[uuid.UUID] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> SearchConsoleAlert:
        """Raise (or refresh) an alert.

        Deduplication: while an alert with the same ``(property_id,
        alert_type)`` is still ``open``, the existing alert is updated
        (message + occurrence count) rather than creating a duplicate.
        """
        existing = await self.alert_repo.get_open_by_type(alert_type, property_id)
        action = "refresh" if existing is not None else "created"
        alert = await self.alert_repo.create_alert(
            alert_type, severity, title, message, property_id, details
        )
        registry.increment("search_console_alerts_total", labels={"type": alert_type.value, "action": action})
        if action == "created":
            logger.warning("Alert raised: %s — %s (property=%s)", alert_type.value, title, property_id)
        return alert

    async def list_alerts(
        self,
        skip: int = 0,
        limit: int = 50,
        status: Optional[str] = None,
        alert_type: Optional[str] = None,
        property_id: Optional[str] = None,
    ) -> Tuple[List[SearchConsoleAlert], int]:
        prop_uuid = None
        if property_id:
            prop = await self.property_repo.get(property_id)
            if prop is None:
                raise PropertyNotFoundException(property_id)
            prop_uuid = prop.id
        return await self.alert_repo.list_alerts(
            skip=skip, limit=limit, status=status, alert_type=alert_type, property_id=prop_uuid
        )

    async def acknowledge_alert(self, alert_id: str, actor: str = "system") -> SearchConsoleAlert:
        alert = await self.alert_repo.update_status(alert_id, AlertStatusEnum.acknowledged, actor)
        if alert is None:
            from app.modules.search_console.exceptions import SearchConsoleException
            raise SearchConsoleException(f"Alert {alert_id} not found", status_code=404)
        registry.increment("search_console_alerts_total", labels={"type": alert.alert_type.value, "action": "acknowledged"})
        await self._log_audit("alert_acknowledged", actor, "success", {"alert_id": str(alert.id)}, alert.property_id)
        return alert

    async def resolve_alert(self, alert_id: str, actor: str = "system") -> SearchConsoleAlert:
        alert = await self.alert_repo.update_status(alert_id, AlertStatusEnum.resolved, actor, resolved=True)
        if alert is None:
            from app.modules.search_console.exceptions import SearchConsoleException
            raise SearchConsoleException(f"Alert {alert_id} not found", status_code=404)
        registry.increment("search_console_alerts_total", labels={"type": alert.alert_type.value, "action": "resolved"})
        await self._log_audit("alert_resolved", actor, "success", {"alert_id": str(alert.id)}, alert.property_id)
        return alert

    async def get_alert_stats(self) -> Dict[str, Any]:
        """Alert metrics for monitoring."""
        from sqlalchemy import func as sa_func, select as sa_select

        rows = await self.db.execute(
            sa_select(SearchConsoleAlert.status, sa_func.count())
            .group_by(SearchConsoleAlert.status)
        )
        by_status = {str(s.value): c for s, c in rows.all()}

        type_rows = await self.db.execute(
            sa_select(SearchConsoleAlert.alert_type, sa_func.count())
            .where(SearchConsoleAlert.status == AlertStatusEnum.open)
            .group_by(SearchConsoleAlert.alert_type)
        )
        open_by_type = {str(t.value): c for t, c in type_rows.all()}

        return {
            "total": sum(by_status.values()) if by_status else 0,
            "open": by_status.get("open", 0),
            "acknowledged": by_status.get("acknowledged", 0),
            "resolved": by_status.get("resolved", 0),
            "open_by_type": open_by_type,
        }

    async def run_alert_sweep(self) -> Dict[str, Any]:
        """Periodic alert sweep (credentials expiring, data staleness).

        Called by the scheduler every
        ``SEARCH_CONSOLE_ALERT_SWEEP_INTERVAL_MINUTES`` minutes.
        """
        from sqlalchemy import select as sa_select
        from datetime import timedelta as td

        raised = []

        # 1. Credentials expiring soon (within the lookahead window).
        lookahead_hours = settings.SEARCH_CONSOLE_CREDENTIAL_WARN_HOURS
        expiry_cutoff = datetime.now(timezone.utc) + td(hours=lookahead_hours)
        creds = await self.db.execute(
            sa_select(SearchConsoleCredential)
            .where(SearchConsoleCredential.is_revoked.is_(False))
            .where(SearchConsoleCredential.expires_at.isnot(None))
            .where(SearchConsoleCredential.expires_at <= expiry_cutoff)
        )
        for cred in creds.scalars().all():
            if cred.expires_at and cred.expires_at >= datetime.now(timezone.utc):
                alert = await self.raise_alert(
                    AlertTypeEnum.credential_expiring,
                    AlertSeverityEnum.warning,
                    f"Search Console credentials expiring for property {cred.property_id}",
                    f"Access token expires at {cred.expires_at.isoformat()}.",
                    property_id=cred.property_id,
                    details={"expires_at": cred.expires_at.isoformat()},
                )
                if alert:
                    raised.append({"type": alert.alert_type.value, "property_id": str(cred.property_id)})

        # 2. Connected properties that have never synced (data stale).
        props = await self.db.execute(
            sa_select(SearchConsoleProperty).where(
                SearchConsoleProperty.connection_status == ConnectionStatusEnum.connected
            ).where(SearchConsoleProperty.last_sync_at.is_(None))
        )
        for prop in props.scalars().all():
            alert = await self.raise_alert(
                AlertTypeEnum.data_stale,
                AlertSeverityEnum.info,
                f"No sync data for {prop.property_name}",
                "Property is connected but has never been synchronised.",
                property_id=prop.id,
                details={"site_url": prop.site_url},
            )
            if alert:
                raised.append({"type": alert.alert_type.value, "property_id": str(prop.id)})

        logger.info("Alert sweep finished: %d alerts evaluated", len(raised))
        return {"alert_count": len(raised), "alerts": raised}
