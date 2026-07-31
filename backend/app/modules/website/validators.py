from urllib.parse import urlparse
from app.modules.website.exceptions import InvalidURLException


def validate_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise InvalidURLException(url)
    if parsed.scheme not in ("http", "https"):
        raise InvalidURLException(url)
    return url.rstrip("/")


def validate_domain(domain: str) -> str:
    normalized = domain.strip()
    if not normalized:
        raise ValueError("Invalid domain")

    if normalized.startswith(("http://", "https://")):
        parsed = urlparse(normalized)
        normalized = parsed.netloc or parsed.path

    normalized = normalized.rstrip("/").lower()
    if not normalized or len(normalized) > 255:
        raise ValueError("Invalid domain")
    return normalized
