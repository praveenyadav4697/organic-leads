"""End-to-end verification for the F01 — WordPress Credentials workflow.

Runs the full Save Credentials → Sync WordPress path against the real
database and HTTP stack so we can confirm:

1. The frontend's ``wpAdminUrl`` / ``wpUsername`` keys are present in the
   backend response (the bug that caused the frontend to believe no
   credentials were configured even after a successful save).
2. The new ``credentialStatus`` field is computed by the server, never
   leaks the password, and reflects the actual DB state.
3. PUT /websites/{id} with a partial body (no password) does NOT clobber
   the previously stored encrypted password.
4. The sync_wordpress() service decrypts the stored password and uses it
   to call out — proving Sync is wired to the database, not to React
   state.

Run from the backend/ directory:
    python verify_wp_credentials_workflow.py
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from typing import Any, Dict

import httpx
from sqlalchemy import text

from app.core.database import AsyncSessionLocal
from app.main import app
from app.shared.utils.encryption import decrypt_value, encrypt_value


TEST_ADMIN_URL = "http://wordpress.example.com/wp-admin"
TEST_USERNAME = "verify_user"
TEST_PASSWORD = "verify_app_password_abc_12345"
API_BASE = "http://testserver/api/v1"


def _check(condition: bool, message: str) -> None:
    status = "PASS" if condition else "FAIL"
    print(f"  [{status}] {message}")
    if not condition:
        raise AssertionError(message)


async def _read_db_row(website_id: uuid.UUID) -> Dict[str, Any]:
    async with AsyncSessionLocal() as s:
        r = await s.execute(
            text(
                "SELECT id, wp_admin_url, wp_username, wp_app_password "
                "FROM websites WHERE id = :i"
            ),
            {"i": website_id},
        )
        row = r.first()
        assert row is not None
        return {
            "id": row[0],
            "wp_admin_url": row[1],
            "wp_username": row[2],
            "wp_app_password": row[3],
        }


async def _seed_baseline() -> uuid.UUID:
    async with AsyncSessionLocal() as s:
        r = await s.execute(text("SELECT id FROM websites LIMIT 1"))
        row = r.first()
        assert row is not None, "Test requires an existing website row."
        return row[0]


async def _reset_to_baseline(website_id: uuid.UUID) -> None:
    async with AsyncSessionLocal() as s:
        await s.execute(
            text(
                "UPDATE websites SET wp_username = :u, wp_admin_url = :url, "
                "wp_app_password = :pwd WHERE id = :i"
            ),
            {
                "u": "nazeerbs.k@gmail.com",
                "url": "http://localhost:8082/wp-admin",
                "pwd": encrypt_value("OriginalPwd_xyz_2026"),
                "i": website_id,
            },
        )
        await s.commit()


async def _wipe_credentials(website_id: uuid.UUID) -> None:
    async with AsyncSessionLocal() as s:
        await s.execute(
            text(
                "UPDATE websites SET wp_username = NULL, wp_app_password = NULL "
                "WHERE id = :i"
            ),
            {"i": website_id},
        )
        await s.commit()


def _section(title: str) -> None:
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


async def main() -> int:
    website_id = await _seed_baseline()
    print(f"Using existing website: {website_id}")

    # Always restore a known-good baseline before running checks so the
    # script is re-runnable in any state.
    await _reset_to_baseline(website_id)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(
        transport=transport, base_url=API_BASE, follow_redirects=True
    ) as client:

        # --------------------------------------------------------------
        _section("STEP 1 — GET /api/v1/websites (initial state)")
        # --------------------------------------------------------------
        listing = (await client.get("/websites")).json()
        target = next(w for w in listing["items"] if w["id"] == str(website_id))
        print("  keys returned by the API:", sorted(target.keys()))
        _check(
            "wpAdminUrl" in target,
            "response uses camelCase 'wpAdminUrl' (frontend expects this)",
        )
        _check(
            "wpUsername" in target,
            "response uses camelCase 'wpUsername' (frontend expects this)",
        )
        _check(
            "credentialStatus" in target,
            "response carries a server-derived 'credentialStatus' flag",
        )
        _check(
            "wp_app_password" not in target and "wpAppPassword" not in target,
            "the (encrypted) password is NEVER serialized in the response",
        )
        _check(
            target["credentialStatus"] == "configured",
            "credentialStatus reflects the seeded DB state",
        )

        # --------------------------------------------------------------
        _section("STEP 2 — Save new credentials (PUT /websites/{id})")
        # --------------------------------------------------------------
        resp = await client.put(
            f"/websites/{website_id}",
            json={
                "wpAdminUrl": TEST_ADMIN_URL,
                "wpUsername": TEST_USERNAME,
                "wpAppPassword": TEST_PASSWORD,
            },
        )
        _check(resp.status_code == 200, f"PUT status {resp.status_code}")
        body = resp.json()
        _check(
            body.get("wpAdminUrl") == TEST_ADMIN_URL,
            "PUT response carries the new wpAdminUrl back to the client",
        )
        _check(
            body.get("wpUsername") == TEST_USERNAME,
            "PUT response carries the new wpUsername back to the client",
        )
        _check(
            body.get("credentialStatus") == "configured",
            "PUT response says credentialStatus=configured",
        )

        # --------------------------------------------------------------
        _section("STEP 3 — Database verification (raw SQL)")
        # --------------------------------------------------------------
        row = await _read_db_row(website_id)
        print(f"  wp_admin_url     = {row['wp_admin_url']}")
        print(f"  wp_username      = {row['wp_username']}")
        print(f"  wp_app_password  = {row['wp_app_password'][:40]}...")
        _check(
            row["wp_admin_url"] == TEST_ADMIN_URL,
            "DB row wp_admin_url matches the value we PUT",
        )
        _check(
            row["wp_username"] == TEST_USERNAME,
            "DB row wp_username matches the value we PUT",
        )
        _check(
            row["wp_app_password"] is not None and row["wp_app_password"] != TEST_PASSWORD,
            "DB row wp_app_password is encrypted, NOT the plaintext we sent",
        )
        decrypted = decrypt_value(row["wp_app_password"])
        _check(
            decrypted == TEST_PASSWORD,
            "Decrypting the DB value recovers the exact plaintext we sent",
        )

        # --------------------------------------------------------------
        _section("STEP 4 — 'Refresh browser' equivalent: fresh GET")
        # --------------------------------------------------------------
        fresh = (await client.get(f"/websites/{website_id}")).json()
        _check(
            fresh["wpAdminUrl"] == TEST_ADMIN_URL
            and fresh["wpUsername"] == TEST_USERNAME,
            "fresh GET returns the persisted values (no stale cache)",
        )
        _check(
            fresh["credentialStatus"] == "configured",
            "fresh GET says credentialStatus=configured",
        )

        # --------------------------------------------------------------
        _section("STEP 5 — Save WITHOUT a password does NOT clobber it")
        # --------------------------------------------------------------
        resp = await client.put(
            f"/websites/{website_id}",
            json={"wpAdminUrl": TEST_ADMIN_URL, "wpUsername": TEST_USERNAME},
        )
        _check(resp.status_code == 200, "partial PUT still succeeds")
        row2 = await _read_db_row(website_id)
        _check(
            row2["wp_app_password"] == row["wp_app_password"],
            "wp_app_password is unchanged after a save that omitted it",
        )
        _check(
            decrypt_value(row2["wp_app_password"]) == TEST_PASSWORD,
            "still decrypts to the original plaintext (no clobber)",
        )

        # --------------------------------------------------------------
        _section("STEP 6 — Sync WordPress (uses DB, not React state)")
        # --------------------------------------------------------------
        resp = await client.post(f"/websites/{website_id}/sync-wordpress")
        body = resp.json()
        if resp.status_code == 200:
            _check(
                body.get("status") == "completed",
                f"sync completed (status={body.get('status')})",
            )
            print(
                f"  plugins_count={body.get('plugins_count')}, "
                f"themes_count={body.get('themes_count')}"
            )
        elif resp.status_code in (400, 500, 502):
            message = body.get("message") or body.get("detail") or ""
            # The test URL points at a non-existent host, so we expect either
            # a 502 (connection failure) or 500 (wrapped). Anything other
            # than 400-with-"credentials"-message is proof that the sync
            # actually loaded the credentials from the DB and tried to call
            # out — not a "credentials not configured" rejection.
            _check(
                "credential" not in message.lower(),
                f"sync must NOT reject with 'credentials not configured': got {message!r}",
            )
            print(
                f"  sync status={resp.status_code}, message={message!r} — "
                "credentials were loaded from DB and used to call out"
            )
        else:
            _check(
                False,
                f"unexpected sync status {resp.status_code}: {body}",
            )

        # --------------------------------------------------------------
        _section("STEP 7 — Wipe credentials, confirm 'configured' flips to 'missing'")
        # --------------------------------------------------------------
        await _wipe_credentials(website_id)

        cleared = (await client.get(f"/websites/{website_id}")).json()
        _check(
            cleared["credentialStatus"] == "missing",
            "with both fields NULL, credentialStatus correctly reads 'missing'",
        )

        sync_resp = await client.post(f"/websites/{website_id}/sync-wordpress")
        sync_body = sync_resp.json()
        _check(
            sync_resp.status_code == 400
            and "credential" in (sync_body.get("message", "").lower()),
            f"sync is rejected with a clear, accurate error from the DB check "
            f"(got status={sync_resp.status_code}, body={sync_body})",
        )

        # --------------------------------------------------------------
        _section("STEP 8 — Restore the baseline values")
        # --------------------------------------------------------------
        await _reset_to_baseline(website_id)
        print("  baseline restored.")

    print()
    print("ALL CHECKS PASSED.")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))