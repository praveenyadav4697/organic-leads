from urllib.parse import urlparse
from app.modules.onpage_seo.exceptions import OnPageSEOException


def validate_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.netloc:
        raise OnPageSEOException(f"Invalid URL: {url}", status_code=422)
    if parsed.scheme not in ("http", "https"):
        raise OnPageSEOException(f"Invalid URL scheme: {parsed.scheme}", status_code=422)
    return url.rstrip("/")


def validate_page_path(path: str) -> str:
    if not path:
        raise OnPageSEOException("Page path cannot be empty", status_code=422)
    if not path.startswith("/"):
        raise OnPageSEOException(f"Page path must start with '/': {path}", status_code=422)
    return path
