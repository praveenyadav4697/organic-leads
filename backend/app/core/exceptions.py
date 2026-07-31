from typing import Any


class AppException(Exception):
    def __init__(self, message: str, status_code: int = 400, details: Any = None):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class NotFoundException(AppException):
    def __init__(self, resource: str, identifier: Any = None):
        message = f"{resource} not found"
        if identifier is not None:
            message += f" (id={identifier})"
        super().__init__(message, status_code=404)


class ConflictException(AppException):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, status_code=409, details=details)


class ValidationException(AppException):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, status_code=422, details=details)


class DatabaseException(AppException):
    def __init__(self, message: str, details: Any = None):
        super().__init__(message, status_code=500, details=details)
