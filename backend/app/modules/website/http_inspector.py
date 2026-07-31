"""Single shared HTTP client for the public discovery engine.

Every inspector (SEO, WordPress, robots, sitemap, etc.) routes its outbound
HTTP requests through this module so we have one place to:

  * Set a sane User-Agent (search engines identify themselves; we should too).
  * Cap total response size so an attacker can't OOM us by pointing at a 2GB
    file.
  * Bound total request time (DNS + connect + read).
  * Track redirects (so the WordPress path can tell the user "you typed
    example.com but we ended up at www.example.com after 2 redirects").
  * Catch *every* failure mode and return a uniform envelope:
        {"ok": False, "not_publicly_available": True, "error": "..."}
    rather than raising so a single broken endpoint doesn't sink the whole
    scan.

The returned structure is deliberately boring — inspectors just read the
fields they care about.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, Mapping, Optional

import httpx


DEFAULT_USER_AGENT = (
    "OrganicLeadsDiscovery/1.0 (+https://organic-leads.com/bot) "
    "Mozilla/5.0 (compatible; Organic-Leads)"
)

# 5 MB is roughly the size of a typical homepage HTML at the byte boundary;
# if a site serves more than that for /, we don't want to be the ones paying
# to download it.
DEFAULT_MAX_RESPONSE_BYTES = 5 * 1024 * 1024

# Seconds. Tight enough to keep a scan under 15s wall-clock while still
# being generous on slow sites.
DEFAULT_TIMEOUT = httpx.Timeout(connect=5.0, read=10.0, write=10.0, pool=10.0)


@dataclass
class FetchResult:
    """Outcome of one HTTP fetch.

    :attr ok: True if the request returned any 2xx/3xx response.
    :attr not_publicly_available: True when the request failed in a way that
        makes the underlying fact genuinely *non-public* (DNS failure,
        connection refused, 5xx, big timeout).  False for soft failures the
        engine can still report on (e.g. 404 on robots.txt is a soft
        "doesn't exist" — perfectly public information).
    :attr status_code: HTTP status code, when one was actually received.
    :attr final_url: URL after all redirects.
    :attr redirect_count: number of redirects followed.
    :attr ttfb_ms: time-to-first-byte in milliseconds (best-effort).
    :attr response_time_ms: total wall-clock for the request.
    :attr headers: response headers (case-insensitive dict from httpx).
    :attr text: response body decoded as text (capped at MAX_RESPONSE_BYTES).
    :attr content: raw bytes (also capped).
    :attr error: human-readable error string, if any.
    :attr transport: short label of the transport used ("http", "https",
        "rdap", "whois" — set by the caller via ``transport``).
    """

    ok: bool = False
    not_publicly_available: bool = False
    status_code: Optional[int] = None
    final_url: Optional[str] = None
    redirect_count: int = 0
    ttfb_ms: Optional[int] = None
    response_time_ms: Optional[int] = None
    headers: Optional[Dict[str, str]] = None
    text: Optional[str] = None
    content: Optional[bytes] = None
    error: Optional[str] = None
    transport: str = "http"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to a JSON-serializable dict (drops non-serialisable bytes)."""
        return {
            "ok": self.ok,
            "not_publicly_available": self.not_publicly_available,
            "status_code": self.status_code,
            "final_url": self.final_url,
            "redirect_count": self.redirect_count,
            "ttfb_ms": self.ttfb_ms,
            "response_time_ms": self.response_time_ms,
            "headers": dict(self.headers) if self.headers else None,
            "text": self.text,
            "error": self.error,
            "transport": self.transport,
        }


class HTTPInspector:
    """Thin facade around httpx with the rules enforced above."""

    def __init__(
        self,
        user_agent: str = DEFAULT_USER_AGENT,
        timeout: httpx.Timeout = DEFAULT_TIMEOUT,
        max_response_bytes: int = DEFAULT_MAX_RESPONSE_BYTES,
    ) -> None:
        self._user_agent = user_agent
        self._timeout = timeout
        self._max_bytes = max_response_bytes
        # One client per inspector is fine — each scan reuses it across
        # all the parallel calls, and connection pooling amortizes DNS.
        self._client = httpx.AsyncClient(
            timeout=self._timeout,
            follow_redirects=True,
            headers={"User-Agent": self._user_agent, "Accept": "*/*"},
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def fetch(
        self,
        url: str,
        *,
        method: str = "GET",
        headers: Optional[Mapping[str, str]] = None,
        follow_redirects: bool = True,
        transport: str = "http",
    ) -> FetchResult:
        """Fetch a URL with the inspector's defaults applied.

        ``transport`` is a label that ends up in the result so a caller can
        tell apart "this was a TCP/443 call" vs "this was an RDAP lookup" —
        the client itself is the same.
        """
        merged_headers = dict(self._client.headers)
        if headers:
            merged_headers.update(headers)

        start = time.perf_counter()
        try:
            req = self._client.build_request(method, url, headers=merged_headers)
            response = await self._client.send(
                req,
                follow_redirects=follow_redirects,
                stream=True,
            )

            ttfb_ms = int((time.perf_counter() - start) * 1000)

            # Streaming read so we can stop once we've exceeded the byte cap.
            buf = bytearray()
            async for chunk in response.aiter_bytes(chunk_size=64 * 1024):
                buf.extend(chunk)
                if len(buf) > self._max_bytes:
                    break
            await response.aclose()
            elapsed_ms = int((time.perf_counter() - start) * 1000)

            try:
                text = buf.decode(response.encoding or "utf-8", errors="replace")
            except LookupError:
                text = buf.decode("utf-8", errors="replace")

            redirect_count = max(0, len(response.history))

            # 4xx/5xx: ok=False, but NOT flagged not_publicly_available —
            # "robots.txt doesn't exist" is a perfectly public fact.
            if response.status_code >= 400:
                return FetchResult(
                    ok=False,
                    not_publicly_available=False,
                    status_code=response.status_code,
                    final_url=str(response.url),
                    redirect_count=redirect_count,
                    ttfb_ms=ttfb_ms,
                    response_time_ms=elapsed_ms,
                    headers={k: v for k, v in response.headers.items()},
                    text=text,
                    content=bytes(buf),
                    transport=transport,
                )

            return FetchResult(
                ok=True,
                not_publicly_available=False,
                status_code=response.status_code,
                final_url=str(response.url),
                redirect_count=redirect_count,
                ttfb_ms=ttfb_ms,
                response_time_ms=elapsed_ms,
                headers={k: v for k, v in response.headers.items()},
                text=text,
                content=bytes(buf),
                transport=transport,
            )

        except httpx.TimeoutException as e:
            return FetchResult(
                ok=False,
                not_publicly_available=True,
                error=f"timeout: {e}",
                ttfb_ms=int((time.perf_counter() - start) * 1000),
                transport=transport,
            )
        except httpx.ConnectError as e:
            return FetchResult(
                ok=False,
                not_publicly_available=True,
                error=f"connect failed: {e}",
                transport=transport,
            )
        except httpx.UnsupportedProtocol as e:
            return FetchResult(
                ok=False,
                not_publicly_available=True,
                error=f"unsupported protocol: {e}",
                transport=transport,
            )
        except httpx.HTTPError as e:
            return FetchResult(
                ok=False,
                not_publicly_available=True,
                error=f"http error: {e}",
                transport=transport,
            )
        except Exception as e:  # noqa: BLE001 — fail-safe: never let the scan crash
            return FetchResult(
                ok=False,
                not_publicly_available=True,
                error=f"unexpected: {type(e).__name__}: {e}",
                transport=transport,
            )
