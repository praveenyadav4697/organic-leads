import base64
import ctypes
import hashlib
import logging
import sys
from functools import lru_cache
from typing import Optional

from ctypes import wintypes

from app.core.config import settings

logger = logging.getLogger(__name__)

_DPAPI_PREFIX = "dpapi:v1:"
_warned_dpapi_fallback = False


class EncryptionBackendUnavailable(RuntimeError):
    """Raised when no secure credential encryption backend can be loaded."""


def _normalize_key(raw_key: str) -> Optional[bytes]:
    raw_key = raw_key.strip()
    if not raw_key:
        return None

    try:
        # If the key is already a valid Fernet key, use it as-is.
        base64.urlsafe_b64decode(raw_key)
        return raw_key.encode()
    except Exception:
        return base64.urlsafe_b64encode(hashlib.sha256(raw_key.encode()).digest())


def get_encryption_key() -> bytes:
    raw_key = settings.CREDENTIAL_ENCRYPTION_KEY or ""
    normalized = _normalize_key(raw_key) if raw_key else None
    if normalized:
        return normalized

    secret_key = settings.SECRET_KEY or "nova-ai-website-foundation-default-secret"
    return base64.urlsafe_b64encode(hashlib.sha256(secret_key.encode()).digest())


@lru_cache(maxsize=1)
def _get_fernet():
    try:
        from cryptography.fernet import Fernet
    except (ImportError, OSError) as exc:
        raise EncryptionBackendUnavailable(
            "cryptography/Fernet could not be loaded. Windows Application Control "
            "may be blocking native Python extensions in the virtualenv."
        ) from exc

    return Fernet(get_encryption_key())


def _dpapi_available() -> bool:
    return sys.platform == "win32"


class _DataBlob(ctypes.Structure):
    _fields_ = [
        ("cbData", wintypes.DWORD),
        ("pbData", ctypes.POINTER(ctypes.c_ubyte)),
    ]


def _blob_from_bytes(value: bytes) -> tuple[_DataBlob, ctypes.Array]:
    buffer = ctypes.create_string_buffer(value)
    blob = _DataBlob(len(value), ctypes.cast(buffer, ctypes.POINTER(ctypes.c_ubyte)))
    return blob, buffer


def _dpapi_protect(value: bytes) -> bytes:
    data_blob, data_buffer = _blob_from_bytes(value)
    entropy_blob, entropy_buffer = _blob_from_bytes(get_encryption_key())
    out_blob = _DataBlob()

    crypt32 = ctypes.windll.crypt32
    kernel32 = ctypes.windll.kernel32
    crypt32.CryptProtectData.restype = wintypes.BOOL

    ok = crypt32.CryptProtectData(
        ctypes.byref(data_blob),
        "organic-leads-credentials",
        ctypes.byref(entropy_blob),
        None,
        None,
        0x01,  # CRYPTPROTECT_UI_FORBIDDEN
        ctypes.byref(out_blob),
    )
    _ = (data_buffer, entropy_buffer)
    if not ok:
        raise ctypes.WinError()

    try:
        return ctypes.string_at(out_blob.pbData, out_blob.cbData)
    finally:
        kernel32.LocalFree(out_blob.pbData)


def _dpapi_unprotect(value: bytes) -> bytes:
    data_blob, data_buffer = _blob_from_bytes(value)
    entropy_blob, entropy_buffer = _blob_from_bytes(get_encryption_key())
    out_blob = _DataBlob()

    crypt32 = ctypes.windll.crypt32
    kernel32 = ctypes.windll.kernel32
    crypt32.CryptUnprotectData.restype = wintypes.BOOL

    ok = crypt32.CryptUnprotectData(
        ctypes.byref(data_blob),
        None,
        ctypes.byref(entropy_blob),
        None,
        None,
        0x01,  # CRYPTPROTECT_UI_FORBIDDEN
        ctypes.byref(out_blob),
    )
    _ = (data_buffer, entropy_buffer)
    if not ok:
        raise ctypes.WinError()

    try:
        return ctypes.string_at(out_blob.pbData, out_blob.cbData)
    finally:
        kernel32.LocalFree(out_blob.pbData)


def _encrypt_with_dpapi(value: str) -> str:
    token = base64.urlsafe_b64encode(_dpapi_protect(value.encode())).decode()
    return f"{_DPAPI_PREFIX}{token}"


def _decrypt_with_dpapi(value: str) -> str:
    token = value.removeprefix(_DPAPI_PREFIX)
    encrypted = base64.urlsafe_b64decode(token.encode())
    return _dpapi_unprotect(encrypted).decode()


def _warn_dpapi_fallback_once() -> None:
    global _warned_dpapi_fallback
    if _warned_dpapi_fallback:
        return
    logger.warning("Falling back to Windows DPAPI for local credential encryption")
    _warned_dpapi_fallback = True


def encrypt_value(value: str) -> str:
    if value is None:
        return value

    try:
        return _get_fernet().encrypt(value.encode()).decode()
    except EncryptionBackendUnavailable:
        if not _dpapi_available():
            raise
        _warn_dpapi_fallback_once()
        return _encrypt_with_dpapi(value)


def decrypt_value(value: str) -> str:
    if value is None:
        return value
    if value.startswith(_DPAPI_PREFIX):
        return _decrypt_with_dpapi(value)

    return _get_fernet().decrypt(value.encode()).decode()
