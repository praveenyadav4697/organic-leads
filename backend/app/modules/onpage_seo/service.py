from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.modules.onpage_seo.models import (
    SEOPage,
    SEOAuditFinding,
    SEOKeyword,
    SEMetaTag,
    SEHeading,
    SEContent,
    SEImage,
    SEInternalLink,
    SEExternalLink,
    SECanonical,
    SERobots,
    SESitemap,
    SESchema,
    SEAnswerReadiness,
    SERecommendation,
    SEOHistoryEntry,
    SEOLogsEntry,
    SEOStatusEnum,
    AuditSeverityEnum,
    AuditStatusEnum,
    KeywordType,
    KeywordStatus,
    RecommendationPriority,
    RecommendationDifficulty,
    RecommendationStatus,
    ScanStatusEnum,
    LogTypeEnum,
)
from app.modules.onpage_seo.repository import (
    SEOPageRepository,
    SEOAuditFindingRepository,
    SEOKeywordRepository,
    SEMetaTagRepository,
    SEHeadingRepository,
    SEContentRepository,
    SEImageRepository,
    SEInternalLinkRepository,
    SEExternalLinkRepository,
    SECanonicalRepository,
    SERobotsRepository,
    SESitemapRepository,
    SESchemaRepository,
    SEAnswerReadinessRepository,
    SERecommendationRepository,
    SEOHistoryRepository,
    SEOLogsRepository,
)
from app.modules.onpage_seo.exceptions import (
    OnPageSEOException,
    ProjectNotFoundException,
    CrawlJobNotFoundException,
    PageNotFoundException,
    CrawlFailedException,
    AnalysisFailedException,
)
from app.modules.onpage_seo.validators import validate_url, validate_page_path


class OnPageSEOService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.page_repo = SEOPageRepository(db)
        self.finding_repo = SEOAuditFindingRepository(db)
        self.keyword_repo = SEOKeywordRepository(db)
        self.meta_tag_repo = SEMetaTagRepository(db)
        self.heading_repo = SEHeadingRepository(db)
        self.content_repo = SEContentRepository(db)
        self.image_repo = SEImageRepository(db)
        self.internal_link_repo = SEInternalLinkRepository(db)
        self.external_link_repo = SEExternalLinkRepository(db)
        self.canonical_repo = SECanonicalRepository(db)
        self.robots_repo = SERobotsRepository(db)
        self.sitemap_repo = SESitemapRepository(db)
        self.schema_repo = SESchemaRepository(db)
        self.answer_readiness_repo = SEAnswerReadinessRepository(db)
        self.recommendation_repo = SERecommendationRepository(db)
        self.history_repo = SEOHistoryRepository(db)
        self.logs_repo = SEOLogsRepository(db)

    async def _log(self, page_id: UUID, log_type: LogTypeEnum, message: str,
                   details: Optional[Dict[str, Any]] = None, correlation_id: Optional[str] = None) -> None:
        await self.logs_repo.create({
            "page_id": page_id,
            "type": log_type,
            "message": message,
            "details": details or {},
            "correlation_id": correlation_id,
        })
        await self.db.commit()

    # --- Page CRUD -------------------------------------------------------

    async def create_page(self, data: Dict[str, Any]) -> SEOPage:
        url = validate_url(data["url"])
        website_id = data["website_id"]

        existing = await self.page_repo.get_by_url(website_id, url)
        if existing:
            raise OnPageSEOException(
                f"Page already exists for URL: {url}", status_code=409
            )

        obj_in = {
            "website_id": website_id,
            "url": url,
            "path": data.get("path"),
            "status": SEOStatusEnum.pending,
        }
        page = await self.page_repo.create(obj_in)
        await self.db.commit()
        await self.db.refresh(page)
        await self._log(page.id, LogTypeEnum.audit, "Page created", {"url": url}, str(page.id))
        return page

    async def get_page(self, page_id: str) -> SEOPage:
        try:
            page = await self.page_repo.get(UUID(page_id))
        except (ValueError, TypeError):
            page = None
        if page is None:
            page = await self.page_repo.get_by_url("default", page_id)
        if page is None:
            raise PageNotFoundException(page_id)
        return page

    async def get_pages(self, website_id: str, skip: int = 0, limit: int = 100,
                          status: Optional[str] = None, sort_by: str = "seo_score",
                          sort_order: str = "desc") -> Tuple[List[SEOPage], int]:
        return await self.page_repo.get_by_website(website_id, skip, limit, status, sort_by, sort_order)

    async def update_page(self, page_id: str, update_data: Dict[str, Any]) -> SEOPage:
        page = await self.get_page(page_id)
        update_dict = {k: v for k, v in update_data.items() if v is not None}
        await self.page_repo.update(page.id, update_dict)
        await self.db.commit()
        await self.db.refresh(page)
        await self._log(page.id, LogTypeEnum.audit, "Page updated", {"fields": list(update_dict.keys())}, str(page.id))
        return page

    async def delete_page(self, page_id: str) -> bool:
        page = await self.get_page(page_id)
        await self.page_repo.delete(page.id)
        await self.db.commit()
        await self._log(page.id, LogTypeEnum.audit, "Page deleted", {}, str(page.id))
        return True

    # --- SEO Audit -------------------------------------------------------

    async def run_audit(self, page_id: str) -> Dict[str, Any]:
        page = await self.get_page(page_id)
        await self._log(page.id, LogTypeEnum.processing, "SEO audit started", {}, str(page.id))

        history = await self.history_repo.create({
            "page_id": page.id,
            "scan_type": "onpage_audit",
            "status": ScanStatusEnum.running,
            "started_at": datetime.now(timezone.utc),
        })
        await self.db.commit()

        try:
            findings = await self._perform_audit(page)
            score = self._calculate_seo_score(findings)

            page.seo_score = score
            page.status = SEOStatusEnum.scanned
            await self.page_repo.update(page.id, {
                "seo_score": score,
                "status": SEOStatusEnum.scanned,
            })
            await self.db.commit()
            await self.db.refresh(page)

            history.status = ScanStatusEnum.completed
            history.completed_at = datetime.now(timezone.utc)
            history.findings_count = len(findings)
            history.score_after = score
            await self.history_repo.update(history.id, {
                "status": ScanStatusEnum.completed,
                "completed_at": history.completed_at,
                "findings_count": len(findings),
                "score_after": score,
            })
            await self.db.commit()

            await self._log(page.id, LogTypeEnum.audit, "SEO audit completed",
                            {"findings_count": len(findings), "score": score}, str(page.id))

            return {
                "page_id": str(page.id),
                "url": page.url,
                "seo_score": score,
                "findings_count": len(findings),
                "status": "completed",
            }

        except Exception as e:
            history.status = ScanStatusEnum.failed
            history.completed_at = datetime.now(timezone.utc)
            history.error_message = str(e)
            await self.history_repo.update(history.id, {
                "status": ScanStatusEnum.failed,
                "completed_at": history.completed_at,
                "error_message": str(e),
            })
            await self.db.commit()

            await self._log(page.id, LogTypeEnum.error, f"SEO audit failed: {str(e)}", {}, str(page.id))
            raise AnalysisFailedException(f"SEO audit failed for {page.url}: {str(e)}")

    async def _perform_audit(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []

        findings.extend(await self._audit_meta_tags(page))
        findings.extend(await self._audit_headings(page))
        findings.extend(await self._audit_content(page))
        findings.extend(await self._audit_images(page))
        findings.extend(await self._audit_links(page))
        findings.extend(await self._audit_canonical(page))
        findings.extend(await self._audit_robots(page))
        findings.extend(await self._audit_sitemap(page))
        findings.extend(await self._audit_schema(page))
        findings.extend(await self._audit_answer_readiness(page))

        return findings

    async def _audit_meta_tags(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        meta_tags = await self.meta_tag_repo.get_by_page(page.id)

        title_tags = [t for t in meta_tags if t.tag_type == "title"]
        desc_tags = [t for t in meta_tags if t.tag_type == "description"]
        og_title_tags = [t for t in meta_tags if t.tag_type == "og_title"]
        og_desc_tags = [t for t in meta_tags if t.tag_type == "og_description"]

        if not title_tags:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="meta-tags", check_name="title_tag",
                status=AuditStatusEnum.failed, severity=AuditSeverityEnum.critical,
                message="Missing title tag",
                recommendation="Add a descriptive title tag (50-60 characters)",
                element="<title>",
            ))
        elif title_tags[0].is_duplicate:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="meta-tags", check_name="title_tag",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.high,
                message="Duplicate title tag detected",
                recommendation="Ensure each page has a unique title tag",
                element="<title>",
                actual_value=title_tags[0].tag_value or "",
            ))
        elif title_tags[0].length and title_tags[0].length > 60:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="meta-tags", check_name="title_tag_length",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                message=f"Title tag is too long ({title_tags[0].length} characters)",
                recommendation="Keep title tag under 60 characters",
                element="<title>",
                actual_value=str(title_tags[0].length),
            ))

        if not desc_tags:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="meta-tags", check_name="meta_description",
                status=AuditStatusEnum.failed, severity=AuditSeverityEnum.high,
                message="Missing meta description",
                recommendation="Add a meta description (150-160 characters)",
                element='<meta name="description">',
            ))
        elif desc_tags[0].is_duplicate:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="meta-tags", check_name="meta_description",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                message="Duplicate meta description detected",
                recommendation="Ensure each page has a unique meta description",
                element='<meta name="description">',
                actual_value=desc_tags[0].tag_value or "",
            ))

        if not og_title_tags:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="meta-tags", check_name="og_title",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.low,
                message="Missing Open Graph title tag",
                recommendation="Add og:title for better social sharing",
                element='<meta property="og:title">',
            ))

        if not og_desc_tags:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="meta-tags", check_name="og_description",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.low,
                message="Missing Open Graph description tag",
                recommendation="Add og:description for better social sharing",
                element='<meta property="og:description">',
            ))

        return findings

    async def _audit_headings(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        headings = await self.heading_repo.get_by_page(page.id)

        h1_tags = [h for h in headings if h.level == 1]
        if len(h1_tags) > 1:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="headings", check_name="h1_count",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.high,
                message=f"Multiple H1 tags found ({len(h1_tags)})",
                recommendation="Use only one H1 tag per page",
                element="<h1>",
                actual_value=str(len(h1_tags)),
            ))
        elif len(h1_tags) == 0:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="headings", check_name="h1_missing",
                status=AuditStatusEnum.failed, severity=AuditSeverityEnum.critical,
                message="Missing H1 tag",
                recommendation="Add at least one H1 tag to the page",
                element="<h1>",
            ))

        duplicate_headings = [h for h in headings if h.is_duplicate]
        if duplicate_headings:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="headings", check_name="duplicate_headings",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                message=f"Duplicate heading text found ({len(duplicate_headings)})",
                recommendation="Ensure each heading has unique text",
                element="<h1>-<h6>",
                actual_value=str(len(duplicate_headings)),
            ))

        return findings

    async def _audit_content(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        content_records = await self.content_repo.get_by_page(page.id)

        if content_records:
            content = content_records[0]
            if content.word_count and content.word_count < 300:
                findings.append(SEOAuditFinding(
                    page_id=page.id, category="content", check_name="word_count",
                    status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                    message=f"Content is too short ({content.word_count} words)",
                    recommendation="Add more content (aim for at least 300 words)",
                    element="content",
                    actual_value=str(content.word_count),
                ))

            if content.has_duplicate_content:
                findings.append(SEOAuditFinding(
                    page_id=page.id, category="content", check_name="duplicate_content",
                    status=AuditStatusEnum.warning, severity=AuditSeverityEnum.high,
                    message="Duplicate content detected",
                    recommendation="Ensure content is unique and not duplicated from other pages",
                    element="content",
                ))

            if content.has_thin_content:
                findings.append(SEOAuditFinding(
                    page_id=page.id, category="content", check_name="thin_content",
                    status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                    message="Thin content detected",
                    recommendation="Add more substantive content to this page",
                    element="content",
                ))

            if content.grammar_issues and content.grammar_issues > 0:
                findings.append(SEOAuditFinding(
                    page_id=page.id, category="content", check_name="grammar_issues",
                    status=AuditStatusEnum.warning, severity=AuditSeverityEnum.low,
                    message=f"Grammar issues found ({content.grammar_issues})",
                    recommendation="Fix grammar issues for better readability",
                    element="content",
                    actual_value=str(content.grammar_issues),
                ))

        return findings

    async def _audit_images(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        images = await self.image_repo.get_by_page(page.id)

        images_without_alt = [img for img in images if not img.has_alt]
        if images_without_alt:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="images", check_name="missing_alt_text",
                status=AuditStatusEnum.failed, severity=AuditSeverityEnum.high,
                message=f"{len(images_without_alt)} image(s) missing alt text",
                recommendation="Add descriptive alt text to all images",
                element="<img>",
                actual_value=str(len(images_without_alt)),
            ))

        uncompressed_images = [img for img in images if img.file_size_kb and img.file_size_kb > 200]
        if uncompressed_images:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="images", check_name="uncompressed_images",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                message=f"{len(uncompressed_images)} image(s) may be uncompressed",
                recommendation="Compress images to reduce file size",
                element="<img>",
                actual_value=str(len(uncompressed_images)),
            ))

        images_without_lazy = [img for img in images if not img.uses_lazy_loading]
        if images_without_lazy:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="images", check_name="lazy_loading",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.low,
                message=f"{len(images_without_lazy)} image(s) not using lazy loading",
                recommendation="Add loading='lazy' to images below the fold",
                element="<img>",
                actual_value=str(len(images_without_lazy)),
            ))

        return findings

    async def _audit_links(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        internal_links = await self.internal_link_repo.get_by_page(page.id)
        external_links = await self.external_link_repo.get_by_page(page.id)

        broken_internal = [l for l in internal_links if l.is_broken]
        if broken_internal:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="internal-links", check_name="broken_internal_links",
                status=AuditStatusEnum.failed, severity=AuditSeverityEnum.high,
                message=f"{len(broken_internal)} broken internal link(s) found",
                recommendation="Fix or remove broken internal links",
                element="<a>",
                actual_value=str(len(broken_internal)),
            ))

        broken_external = [l for l in external_links if l.is_broken]
        if broken_external:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="external-links", check_name="broken_external_links",
                status=AuditStatusEnum.failed, severity=AuditSeverityEnum.high,
                message=f"{len(broken_external)} broken external link(s) found",
                recommendation="Fix or remove broken external links",
                element="<a>",
                actual_value=str(len(broken_external)),
            ))

        return findings

    async def _audit_canonical(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        canonical = await self.canonical_repo.get_by_page(page.id)

        if canonical and not canonical.is_present:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="canonical", check_name="canonical_missing",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                message="Missing canonical tag",
                recommendation="Add a canonical tag to prevent duplicate content issues",
                element="<link rel='canonical'>",
            ))
        elif canonical and not canonical.is_valid:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="canonical", check_name="canonical_invalid",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                message="Invalid canonical URL",
                recommendation="Ensure the canonical URL is valid and points to the correct page",
                element="<link rel='canonical'>",
                actual_value=canonical.canonical_url or "",
            ))
        elif canonical and canonical.is_duplicate:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="canonical", check_name="canonical_duplicate",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.high,
                message="Duplicate canonical URL detected",
                recommendation="Ensure canonical URL is unique across the site",
                element="<link rel='canonical'>",
                actual_value=canonical.canonical_url or "",
            ))

        return findings

    async def _audit_robots(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        robots = await self.robots_repo.get_by_page(page.id)

        if robots and robots.is_noindex:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="robots", check_name="noindex",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.high,
                message="Page has noindex directive",
                recommendation="Remove noindex if you want the page to appear in search results",
                element='<meta name="robots">',
                actual_value="noindex",
            ))

        return findings

    async def _audit_sitemap(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        sitemap = await self.sitemap_repo.get_by_page(page.id)

        if sitemap and not sitemap.is_present:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="sitemap", check_name="sitemap_missing",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.low,
                message="No sitemap reference found",
                recommendation="Add a sitemap reference for better crawlability",
                element="sitemap",
            ))
        elif sitemap and not sitemap.page_in_sitemap:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="sitemap", check_name="not_in_sitemap",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                message="Page is not included in sitemap",
                recommendation="Add this page to your sitemap.xml",
                element="sitemap",
            ))

        return findings

    async def _audit_schema(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        schema_entries = await self.schema_repo.get_by_page(page.id)

        if not schema_entries:
            findings.append(SEOAuditFinding(
                page_id=page.id, category="schema", check_name="no_schema",
                status=AuditStatusEnum.warning, severity=AuditSeverityEnum.low,
                message="No structured data (schema.org) found",
                recommendation="Add structured data to improve search engine understanding",
                element="<script type='application/ld+json'>",
            ))
        else:
            for schema in schema_entries:
                if not schema.is_valid:
                    findings.append(SEOAuditFinding(
                        page_id=page.id, category="schema", check_name="schema_invalid",
                        status=AuditStatusEnum.failed, severity=AuditSeverityEnum.high,
                        message=f"Invalid {schema.schema_type} schema: {schema.error_count} error(s)",
                        recommendation="Fix schema validation errors",
                        element="<script type='application/ld+json'>",
                        actual_value=f"{schema.error_count} errors, {schema.warning_count} warnings",
                    ))

        return findings

    async def _audit_answer_readiness(self, page: SEOPage) -> List[SEOAuditFinding]:
        findings: List[SEOAuditFinding] = []
        answer_readiness = await self.answer_readiness_repo.get_by_page(page.id)

        if answer_readiness:
            if not answer_readiness.is_featured_snippet_ready:
                findings.append(SEOAuditFinding(
                    page_id=page.id, category="answer-readiness", check_name="featured_snippet",
                    status=AuditStatusEnum.warning, severity=AuditSeverityEnum.medium,
                    message="Page is not optimized for featured snippets",
                    recommendation="Add concise answers to common questions in your content",
                    element="content",
                ))

            if not answer_readiness.faq_optimized:
                findings.append(SEOAuditFinding(
                    page_id=page.id, category="answer-readiness", check_name="faq_optimization",
                    status=AuditStatusEnum.warning, severity=AuditSeverityEnum.low,
                    message="Page is not FAQ-optimized",
                    recommendation="Add FAQ schema or structured Q&A content",
                    element="content",
                ))

            if not answer_readiness.voice_search_optimized:
                findings.append(SEOAuditFinding(
                    page_id=page.id, category="answer-readiness", check_name="voice_search",
                    status=AuditStatusEnum.warning, severity=AuditSeverityEnum.low,
                    message="Page is not optimized for voice search",
                    recommendation="Use natural language and conversational phrases",
                    element="content",
                ))

        return findings

    def _calculate_seo_score(self, findings: List[SEOAuditFinding]) -> int:
        critical_count = sum(1 for f in findings if f.severity == AuditSeverityEnum.critical)
        high_count = sum(1 for f in findings if f.severity == AuditSeverityEnum.high)
        medium_count = sum(1 for f in findings if f.severity == AuditSeverityEnum.medium)
        low_count = sum(1 for f in findings if f.severity == AuditSeverityEnum.low)

        score = 100
        score -= critical_count * 10
        score -= high_count * 5
        score -= medium_count * 2
        score -= low_count * 1
        return max(0, min(100, score))

    # --- Recommendations -------------------------------------------------

    async def get_recommendations(self, page_id: str, status: Optional[str] = None) -> List[SERecommendation]:
        page = await self.get_page(page_id)
        return await self.recommendation_repo.get_by_page(page.id, status)

    async def update_recommendation(self, recommendation_id: str, data: Dict[str, Any]) -> SERecommendation:
        rec = await self.recommendation_repo.get(UUID(recommendation_id))
        if rec is None:
            raise OnPageSEOException(f"Recommendation not found: {recommendation_id}", status_code=404)

        update_dict = {k: v for k, v in data.items() if v is not None}
        await self.recommendation_repo.update(rec.id, update_dict)
        await self.db.commit()
        await self.db.refresh(rec)
        return rec

    # --- Bulk Operations -------------------------------------------------

    async def bulk_optimize(self, page_ids: List[str], action: str, data: Dict[str, Any]) -> Dict[str, Any]:
        results = {"total": len(page_ids), "succeeded": 0, "failed": 0, "skipped": 0, "results": []}

        for pid in page_ids:
            try:
                page = await self.get_page(pid)
                if action == "update_meta":
                    if "meta_title" in data:
                        page.meta_title = data["meta_title"]
                    if "meta_description" in data:
                        page.meta_description = data["meta_description"]
                    await self.page_repo.update(page.id, {
                        "meta_title": page.meta_title,
                        "meta_description": page.meta_description,
                    })
                elif action == "update_schema":
                    page.has_schema = data.get("has_schema", page.has_schema)
                    await self.page_repo.update(page.id, {"has_schema": page.has_schema})
                elif action == "update_canonical":
                    page.has_canonical = data.get("has_canonical", page.has_canonical)
                    await self.page_repo.update(page.id, {"has_canonical": page.has_canonical})
                results["succeeded"] += 1
                results["results"].append({"page_id": pid, "status": "success"})
            except Exception as e:
                results["failed"] += 1
                results["results"].append({"page_id": pid, "status": "failed", "message": str(e)})

        await self.db.commit()
        return results

    async def verify_fixes(self, page_id: str) -> Dict[str, Any]:
        page = await self.get_page(page_id)
        findings = await self.finding_repo.get_by_page(page.id)
        failed_count = sum(1 for f in findings if f.status == AuditStatusEnum.failed)
        warning_count = sum(1 for f in findings if f.status == AuditStatusEnum.warning)

        return {
            "page_id": str(page.id),
            "verified": len(findings) - failed_count - warning_count,
            "failed": failed_count,
            "warnings": warning_count,
            "message": f"Verification complete: {len(findings)} findings, {failed_count} failed, {warning_count} warnings",
        }

    # --- Overview --------------------------------------------------------

    async def get_overview(
        self,
        website_id: str,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        filters = filters or {}
        pages, _ = await self.page_repo.get_by_website(website_id)

        # Apply client-side filters
        if filters.get("status"):
            pages = [p for p in pages if str(p.status) == str(filters["status"])]
        if filters.get("seo_score_min") is not None:
            pages = [p for p in pages if (p.seo_score or 0) >= filters["seo_score_min"]]
        if filters.get("seo_score_max") is not None:
            pages = [p for p in pages if (p.seo_score or 0) <= filters["seo_score_max"]]
        if filters.get("category"):
            # category applies at the finding level; keep page list but flagged separately
            pass

        total_pages = len(pages)
        scanned_pages = [p for p in pages if p.status == SEOStatusEnum.scanned]
        pages_with_issues = [p for p in scanned_pages if (p.seo_score or 100) < 100]
        critical_errors = sum(
            1 for p in scanned_pages
            for f in await self.finding_repo.get_by_page(p.id, severity="critical", status="failed")
        )
        warnings = sum(
            1 for p in scanned_pages
            for f in await self.finding_repo.get_by_page(p.id, severity="warning")
        )
        passed_checks = sum(
            1 for p in scanned_pages
            for f in await self.finding_repo.get_by_page(p.id, status="passed")
        )

        avg_score = sum(p.seo_score or 0 for p in scanned_pages) / len(scanned_pages) if scanned_pages else 0
        avg_readability = sum(p.readability_score or 0 for p in scanned_pages if p.readability_score) / max(1, sum(1 for p in scanned_pages if p.readability_score))

        missing_meta = sum(1 for p in scanned_pages if not p.meta_title or not p.meta_description)
        duplicate_titles = sum(1 for p in scanned_pages if p.meta_title)

        return {
            "overall_score": round(avg_score, 1),
            "optimized_pages": len(scanned_pages) - len(pages_with_issues),
            "pages_with_issues": len(pages_with_issues),
            "critical_errors": critical_errors,
            "warnings": warnings,
            "passed_checks": passed_checks,
            "avg_readability": round(avg_readability, 1),
            "missing_meta_tags": missing_meta,
            "duplicate_titles": duplicate_titles,
            "broken_links": sum(p.broken_links_count or 0 for p in scanned_pages),
            "schema_coverage": round(sum(1 for p in scanned_pages if p.has_schema) / max(1, len(scanned_pages)) * 100, 1),
            "answer_readiness_score": 0.0,
            "ai_recommendations_count": 0,
            "last_scan": None,
            "score_distribution": [],
            "issue_severity": [],
            "optimization_progress": [],
            "readability_trend": [],
            "page_performance": [],
        }

    # --- History & Logs --------------------------------------------------

    async def get_history(self, page_id: str, skip: int = 0, limit: int = 50) -> Tuple[List[SEOHistoryEntry], int]:
        page = await self.get_page(page_id)
        return await self.history_repo.get_by_page(page.id, skip, limit)

    async def get_logs(self, page_id: str, skip: int = 0, limit: int = 100,
                         log_type: Optional[str] = None) -> Tuple[List[SEOLogsEntry], int]:
        page = await self.get_page(page_id)
        return await self.logs_repo.get_by_page(page.id, skip, limit, log_type)