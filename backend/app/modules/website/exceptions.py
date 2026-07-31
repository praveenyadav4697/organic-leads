from typing import Any
from app.core.exceptions import AppException


class WebsiteNotFoundException(AppException):
    def __init__(self, website_id: Any):
        super().__init__(f"Website not found", status_code=404)


class ScanNotFoundException(AppException):
    def __init__(self, scan_id: Any):
        super().__init__(f"Scan not found", status_code=404)


class ScanFailedException(AppException):
    def __init__(self, message: str):
        super().__init__(f"Scan failed: {message}", status_code=500)


class InvalidURLException(AppException):
    def __init__(self, url: str):
        super().__init__(f"Invalid URL: {url}", status_code=422)
