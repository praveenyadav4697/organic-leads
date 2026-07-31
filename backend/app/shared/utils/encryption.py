import base64
import hashlib
from cryptography.fernet import Fernet
from app.core.config import settings


def _normalize_key(raw_key: str) -> bytes:
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


_fernet = Fernet(get_encryption_key())


def encrypt_value(value: str) -> str:
    if value is None:
        return value
    return _fernet.encrypt(value.encode()).decode()


def decrypt_value(value: str) -> str:
    if value is None:
        return value
    return _fernet.decrypt(value.encode()).decode()
