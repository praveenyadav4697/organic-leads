from urllib.parse import urlparse
from app.modules.search_console.exceptions import SearchConsoleException


def validate_property_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise SearchConsoleException(f"Invalid property URL: {url}", status_code=422)
    if parsed.scheme not in ("http", "https"):
        raise SearchConsoleException(f"Invalid URL scheme: {parsed.scheme}", status_code=422)
    return url.rstrip("/")


def validate_site_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise SearchConsoleException(f"Invalid site URL: {url}", status_code=422)
    if parsed.scheme not in ("http", "https"):
        raise SearchConsoleException(f"Invalid URL scheme: {parsed.scheme}", status_code=422)
    return url.rstrip("/")
