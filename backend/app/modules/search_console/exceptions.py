from typing import Any
from app.core.exceptions import AppException


class SearchConsoleException(AppException):
    def __init__(self, message: str, status_code: int = 400, details: Any = None):
        super().__init__(message, status_code, details)


class PropertyNotFoundException(AppException):
    def __init__(self, property_id: Any):
        super().__init__(f"Search Console property not found (id={property_id})", status_code=404)


class PropertyNotConnectedException(AppException):
    def __init__(self, property_id: Any):
        super().__init__(
            f"Property {property_id} is not connected. Connect it first via /search-console/connect.",
            status_code=409,
        )


class GoogleOAuthException(AppException):
    def __init__(self, message: str, status_code: int = 401, details: Any = None):
        super().__init__(message, status_code, details)


class GoogleCredentialsMissingException(AppException):
    def __init__(self):
        super().__init__(
            "Google OAuth credentials are not configured. "
            "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the environment.",
            status_code=503,
        )


class SyncFailedException(AppException):
    def __init__(self, message: str, details: Any = None):
        super().__init__(f"Synchronization failed: {message}", status_code=500, details=details)


class VerificationFailedException(AppException):
    def __init__(self, message: str, details: Any = None):
        super().__init__(f"Property verification failed: {message}", status_code=400, details=details)
