from typing import Any
from app.core.exceptions import AppException


class OnPageSEOException(AppException):
    def __init__(self, message: str, status_code: int = 400, details: Any = None):
        super().__init__(message, status_code, details)


class ProjectNotFoundException(AppException):
    def __init__(self, project_id: Any):
        super().__init__(f"SEO project not found (id={project_id})", status_code=404)


class CrawlJobNotFoundException(AppException):
    def __init__(self, job_id: Any):
        super().__init__(f"SEO crawl job not found (id={job_id})", status_code=404)


class PageNotFoundException(AppException):
    def __init__(self, page_id: Any):
        super().__init__(f"SEO page not found (id={page_id})", status_code=404)


class CrawlFailedException(AppException):
    def __init__(self, message: str, details: Any = None):
        super().__init__(f"Crawl failed: {message}", status_code=500, details=details)


class AnalysisFailedException(AppException):
    def __init__(self, message: str, details: Any = None):
        super().__init__(f"Analysis failed: {message}", status_code=500, details=details)
