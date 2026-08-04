import enum
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
import uuid

from app.modules.onpage_seo.models import (
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


class SEOOverview(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    overall_score: float
    optimized_pages: int
    pages_with_issues: int
    critical_errors: int
    warnings: int
    passed_checks: int
    avg_readability: float
    missing_meta_tags: int
    duplicate_titles: int
    broken_links: int
    schema_coverage: float
    answer_readiness_score: float
    ai_recommendations_count: int
    last_scan: Optional[str] = None
    score_distribution: List[Dict[str, Any]] = []
    issue_severity: List[Dict[str, Any]] = []
    optimization_progress: List[Dict[str, Any]] = []
    readability_trend: List[Dict[str, Any]] = []
    page_performance: List[Dict[str, Any]] = []


class SEOPageBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    website_id: str
    url: str
    path: Optional[str] = None


class SEOPageCreate(SEOPageBase):
    pass


class SEOPageUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    seo_score: Optional[int] = None
    status: Optional[SEOStatusEnum] = None
    primary_keyword: Optional[str] = None
    word_count: Optional[int] = None
    readability_score: Optional[float] = None
    has_schema: Optional[bool] = None
    has_canonical: Optional[bool] = None
    is_indexed: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    h1_count: Optional[int] = None
    h2_count: Optional[int] = None
    h3_count: Optional[int] = None
    image_count: Optional[int] = None
    images_missing_alt: Optional[int] = None
    internal_links_count: Optional[int] = None
    external_links_count: Optional[int] = None
    broken_links_count: Optional[int] = None
    content_quality_score: Optional[float] = None


class SEOPageResponse(SEOPageBase):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: uuid.UUID
    seo_score: Optional[int] = None
    status: SEOStatusEnum
    primary_keyword: Optional[str] = None
    word_count: Optional[int] = None
    readability_score: Optional[float] = None
    has_schema: Optional[bool] = None
    has_canonical: Optional[bool] = None
    is_indexed: Optional[bool] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    h1_count: Optional[int] = None
    h2_count: Optional[int] = None
    h3_count: Optional[int] = None
    image_count: Optional[int] = None
    images_missing_alt: Optional[int] = None
    internal_links_count: Optional[int] = None
    external_links_count: Optional[int] = None
    broken_links_count: Optional[int] = None
    content_quality_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    total_pages: int


class SEOAuditFindingBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    category: str
    check_name: str
    status: AuditStatusEnum
    severity: AuditSeverityEnum
    message: str
    recommendation: Optional[str] = None
    element: Optional[str] = None
    expected_value: Optional[str] = None
    actual_value: Optional[str] = None


class SEOAuditFindingResponse(SEOAuditFindingBase):
    id: uuid.UUID
    created_at: datetime


class SEOKeywordBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    keyword_text: str
    type: KeywordType
    density: Optional[float] = None
    placement: Optional[str] = None
    occurrences: Optional[int] = None
    recommended_density: Optional[float] = None
    status: KeywordStatus


class SEOKeywordResponse(SEOKeywordBase):
    id: uuid.UUID
    created_at: datetime


class SEMetaTagBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    tag_type: str
    tag_name: str
    tag_value: Optional[str] = None
    is_present: bool
    length: Optional[int] = None
    max_length: int
    is_valid: bool
    is_duplicate: bool


class SEMetaTagResponse(SEMetaTagBase):
    id: uuid.UUID
    created_at: datetime


class SEHeadingBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    level: int
    text: str
    is_duplicate: bool
    is_missing: bool
    position: int


class SEHeadingResponse(SEHeadingBase):
    id: uuid.UUID
    created_at: datetime


class SEContentBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    word_count: Optional[int] = None
    paragraph_count: Optional[int] = None
    avg_paragraph_length: Optional[float] = None
    readability_score: Optional[float] = None
    readability_grade: Optional[str] = None
    has_duplicate_content: bool
    has_thin_content: bool
    content_freshness_days: Optional[int] = None
    grammar_issues: Optional[int] = None
    ai_suggestions: Optional[List[str]] = None


class SEContentResponse(SEContentBase):
    id: uuid.UUID
    created_at: datetime


class SEImageBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    src: str
    alt_text: Optional[str] = None
    has_alt: bool
    file_size_kb: Optional[float] = None
    is_compressed: Optional[bool] = None
    uses_lazy_loading: bool
    is_responsive: bool
    format: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


class SEImageResponse(SEImageBase):
    id: uuid.UUID
    created_at: datetime


class SEInternalLinkBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    target_url: str
    anchor_text: str
    is_broken: bool
    link_count: Optional[int] = None


class SEInternalLinkResponse(SEInternalLinkBase):
    id: uuid.UUID
    created_at: datetime


class SEExternalLinkBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    target_url: str
    is_broken: bool
    is_nofollow: bool
    is_sponsored: bool
    is_ugc: bool


class SEExternalLinkResponse(SEExternalLinkBase):
    id: uuid.UUID
    created_at: datetime


class SECanonicalBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    canonical_url: Optional[str] = None
    is_present: bool
    is_valid: bool
    is_duplicate: bool


class SECanonicalResponse(SECanonicalBase):
    id: uuid.UUID
    created_at: datetime


class SERobotsBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    robots_txt_present: bool
    robots_meta: Optional[str] = None
    is_noindex: bool
    is_nofollow: bool
    blocked_resources: Optional[List[str]] = None


class SERobotsResponse(SERobotsBase):
    id: uuid.UUID
    created_at: datetime


class SESitemapBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    sitemap_url: Optional[str] = None
    is_present: bool
    page_in_sitemap: bool
    last_submitted: Optional[datetime] = None
    submission_status: str


class SESitemapResponse(SESitemapBase):
    id: uuid.UUID
    created_at: datetime


class SESchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    schema_type: str
    is_present: bool
    is_valid: bool
    error_count: int
    warning_count: int
    errors: Optional[List[str]] = None
    warnings: Optional[List[str]] = None


class SESchemaResponse(SESchemaBase):
    id: uuid.UUID
    created_at: datetime


class SEAnswerReadinessBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    is_featured_snippet_ready: bool
    faq_optimized: bool
    ai_search_readiness_score: Optional[float] = None
    voice_search_optimized: bool
    question_coverage_count: int
    has_structured_answers: bool


class SEAnswerReadinessResponse(SEAnswerReadinessBase):
    id: uuid.UUID
    created_at: datetime


class SERecommendationBase(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    page_id: str
    title: str
    description: str
    priority: RecommendationPriority
    impact: str
    estimated_traffic_gain: Optional[float] = None
    estimated_ranking_improvement: Optional[float] = None
    difficulty: RecommendationDifficulty
    recommended_action: str
    status: RecommendationStatus
    category: str


class SERecommendationResponse(SERecommendationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class SEOScanRequest(BaseModel):
    website_id: str
    pages: Optional[List[str]] = None
    scan_type: str = "full"
    include_schema: bool = True
    include_content: bool = True
    include_images: bool = True


class SEOScanResponse(BaseModel):
    scan_id: str
    status: ScanStatusEnum
    started_at: str
    completed_at: Optional[str] = None
    pages_scanned: int
    issues_found: int


class SEOExportResponse(BaseModel):
    download_url: str
    format: str
    expires_at: str


class BulkOptimizationRequest(BaseModel):
    page_ids: List[str]
    action: str
    data: Dict[str, Any]


class BulkOptimizationResult(BaseModel):
    total: int
    succeeded: int
    failed: int
    skipped: int
    results: List[Dict[str, Any]]


class ApprovalRequest(BaseModel):
    page_id: str
    items: List[str]
    action: str


class ApprovalResponse(BaseModel):
    approved: int
    rejected: int
    completed: int


class SEOFilters(BaseModel):
    search: Optional[str] = None
    website: Optional[str] = None
    page: Optional[str] = None
    category: Optional[str] = None
    seo_score_min: Optional[int] = None
    seo_score_max: Optional[int] = None
    status: Optional[str] = None
    severity: Optional[str] = None
    keyword: Optional[str] = None
    template: Optional[str] = None
    language: Optional[str] = None
    content_type: Optional[str] = None
    schema_type: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None


class SEOHistoryEntry(BaseModel):
    id: uuid.UUID
    page_id: str
    scan_type: str
    status: ScanStatusEnum
    findings_count: int
    score_before: Optional[int] = None
    score_after: Optional[int] = None
    started_at: str
    completed_at: Optional[str] = None
    error_message: Optional[str] = None
    correlation_id: Optional[str] = None


class SEOLogsEntry(BaseModel):
    id: uuid.UUID
    page_id: str
    type: LogTypeEnum
    message: str
    timestamp: str
    details: Optional[Dict[str, Any]] = None
    correlation_id: Optional[str] = None