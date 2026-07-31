"""Verify the WP-Client URL-stripping fix and the 404-to-WordPressAPIError
conversion introduced to stop the sync_wordpress() route returning 500
when the target site responds 404 (most commonly because the Organic
Leads Connector plugin is not installed on the WordPress host).

Run from the backend/ directory:
    python verify_wp_url_construction.py
"""

from __future__ import annotations

import asyncio
import sys

import httpx

from app.modules.website.wp_client import WordPressClient, _rest_base, WordPressAPIError


# ---------------------------------------------------------------------------
# URL stripping — proves the base URL handed to the WordPress REST API is the
# site ROOT, not the wp-admin area. The connector plugin lives at
# /wp-json/organic-leads/v1/*, never under /wp-admin.
# ---------------------------------------------------------------------------

def _section(title: str) -> None:
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


def _check(condition: bool, message: str) -> None:
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {message}".encode("ascii", "replace").decode("ascii"))
    if not condition:
        raise AssertionError(message)


def test_rest_base_strips_wp_admin() -> None:
    _section("URL construction — _rest_base strips trailing /wp-admin")

    cases = [
        # (input, expected output, label)
        (
            "http://localhost:8082/wp-admin",
            "http://localhost:8082",
            "admin URL with /wp-admin → site root",
        ),
        (
            "http://localhost:8082/wp-admin/",
            "http://localhost:8082",
            "admin URL with trailing slash is normalized away",
        ),
        (
            "https://example.com/wp-admin",
            "https://example.com",
            "https admin URL strips correctly",
        ),
        (
            "https://example.com",
            "https://example.com",
            "site-root URL is passed through unchanged",
        ),
        (
            "",
            "",
            "empty string is a no-op",
        ),
        (
            "https://example.com/wp-admin/",
            "https://example.com",
            "trailing slash + wp-admin drops both",
        ),
    ]
    for raw, want, label in cases:
        got = _rest_base(raw)
        _check(got == want, f"{label}: {raw!r} -> {got!r} (expected {want!r})")


# ---------------------------------------------------------------------------
# 404 → WordPressAPIError — proves the get_full_sync() helper no longer
# raises uncaught httpx.HTTPStatusError, which is what produced the 500 on
# POST /sync-wordpress in the live server log.
# ---------------------------------------------------------------------------

class _FakeTransport(httpx.AsyncBaseTransport):
    """Returns whatever the test case queued up, regardless of URL.

    We don't care that the URL was wrong; we care that *whatever* status
    comes back, the client converts it into a typed WordPressAPIError.
    """

    def __init__(self, response: httpx.Response) -> None:
        self.response = response
        self.calls: list[httpx.Request] = []

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        self.calls.append(request)
        return self.response


def _build_client_with_transport(transport: httpx.AsyncBaseTransport) -> WordPressClient:
    # Bypass the real AsyncClient construction so we can inject our
    # transport. We rely on the package's existing init for everything
    # else (auth headers, base-URL handling).
    client = WordPressClient("http://localhost:8082/wp-admin", "u", "p")
    # Replace the inner client with one pointed at our transport.
    client._client = httpx.AsyncClient(transport=transport)  # type: ignore[assignment]
    # Reset the resolved base URL with the strip applied.
    client.base_url = _rest_base("http://localhost:8082/wp-admin")
    return client


def test_get_full_sync_handles_404() -> None:
    _section("get_full_sync() — 404 must become WordPressAPIError, not 500")

    not_found = httpx.Response(
        status_code=404,
        content=b"<h1>Not Found</h1>",
        headers={"content-type": "text/html"},
        request=httpx.Request("GET", "http://anywhere.example/full-sync"),
    )
    transport = _FakeTransport(not_found)
    client = _build_client_with_transport(transport)

    try:
        asyncio.run(_expect_404(client))
        _check(False, "expected WordPressAPIError with status_code=404")
    except WordPressAPIError as e:
        _check(e.status_code == 404, f"status_code == 404 (got {e.status_code})")
        _check(
            "wp-json/organic-leads/v1" in e.message,
            f"message tells the caller the URL we tried ({e.message!r})",
        )
        _check(
            "connector" in e.message.lower() or "plugin" in e.message.lower(),
            "message explains the missing plugin so the user knows what to fix",
        )

    _check(len(transport.calls) == 1, "exactly one outbound request was made")
    called_url = str(transport.calls[0].url)
    _check(
        "/wp-admin/wp-json" not in called_url,
        f"outbound URL must NOT contain '/wp-admin/wp-json' (got {called_url!r})",
    )
    _check(
        called_url.endswith("/wp-json/organic-leads/v1/full-sync"),
        f"outbound URL ends with the connector path (got {called_url!r})",
    )


async def _expect_404(client: WordPressClient) -> None:
    await client.get_full_sync()


def test_get_full_sync_handles_500() -> None:
    _section("get_full_sync() — 5xx also becomes WordPressAPIError")

    boom = httpx.Response(
        status_code=502,
        content=b"upstream down",
        request=httpx.Request("GET", "http://anywhere.example/full-sync"),
    )
    transport = _FakeTransport(boom)
    client = _build_client_with_transport(transport)

    try:
        asyncio.run(_expect_500(client))
        _check(False, "expected WordPressAPIError for 502")
    except WordPressAPIError as e:
        _check(e.status_code == 502, f"status_code propagated (got {e.status_code})")
        _check("upstream down" in e.message, "snippet of upstream body is included")


async def _expect_500(client: WordPressClient) -> None:
    await client.get_full_sync()


def test_get_plugins_themes_security_share_path() -> None:
    _section("Other endpoints — all route through _json_or_error()")

    for method_name, endpoint in [
        ("get_plugins", "/plugins"),
        ("get_themes", "/themes"),
        ("get_security", "/security"),
        ("get_performance", "/performance"),
        ("get_health", "/health"),
        ("get_system", "/system"),
    ]:
        not_found = httpx.Response(
            status_code=404,
            content=b"",
            request=httpx.Request("GET", f"http://x/{endpoint}"),
        )
        transport = _FakeTransport(not_found)
        client = _build_client_with_transport(transport)
        try:
            asyncio.run(_call(client, method_name))
            _check(False, f"{method_name}: expected WordPressAPIError(404)")
        except WordPressAPIError as e:
            _check(
                e.status_code == 404,
                f"{method_name} returns WordPressAPIError(404), not uncaught HTTPStatusError",
            )


async def _call(client: WordPressClient, method_name: str) -> None:
    method = getattr(client, method_name)
    await method()


def main() -> int:
    test_rest_base_strips_wp_admin()
    test_get_full_sync_handles_404()
    test_get_full_sync_handles_500()
    test_get_plugins_themes_security_share_path()
    print()
    print("ALL CHECKS PASSED.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
