import asyncio
import logging
import platform
import sys
from pathlib import Path
from typing import Optional

from playwright.async_api import async_playwright, Browser, Page

from app.core.config import settings

logger = logging.getLogger(__name__)


class ScreenshotCaptureError(Exception):
    pass


class ScreenshotService:
    def __init__(self):
        self._playwright = None
        self._browser: Optional[Browser] = None

    async def _ensure_browser(self) -> Browser:
        if self._browser is not None and self._browser.is_connected():
            return self._browser

        if sys.platform == "win32":
            try:
                loop = asyncio.get_running_loop()
                if not isinstance(loop, asyncio.ProactorEventLoop):
                    logger.error(
                        "Playwright requires WindowsProactorEventLoopPolicy, but active loop is %s. "
                        "Browser subprocesses will fail with NotImplementedError. "
                        "Configure asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy()) before starting Uvicorn.",
                        type(loop).__name__,
                    )
            except RuntimeError:
                pass

        try:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(
                headless=True,
                args=[
                    "--ignore-certificate-errors",
                    "--ignore-ssl-errors",
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-web-security",
                ],
            )
            logger.info(
                "Playwright Chromium browser launched successfully (python=%s, platform=%s)",
                platform.python_version(),
                platform.system(),
            )
            return self._browser
        except Exception:
            if self._playwright is not None:
                try:
                    await self._playwright.stop()
                except Exception:
                    pass
                self._playwright = None
                self._browser = None
            raise

    async def capture(self, url: str, output_path: Path, width: int = 1440, height: int = 900, full_page: bool = False) -> dict:
        page: Optional[Page] = None
        context = None
        try:
            browser = await self._ensure_browser()
            context = await browser.new_context(
                viewport={"width": width, "height": height},
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                ignore_https_errors=True,
            )
            page = await context.new_page()
            try:
                await page.goto(url, wait_until="domcontentloaded", timeout=settings.WORDPRESS_API_TIMEOUT * 1000)
            except Exception as e:
                if "ERR_SSL_PROTOCOL_ERROR" in str(e) or "ssl" in str(e).lower():
                    http_url = url.replace("https://", "http://")
                    await page.goto(http_url, wait_until="domcontentloaded", timeout=settings.WORDPRESS_API_TIMEOUT * 1000)
                else:
                    raise
            await page.wait_for_timeout(2000)
            await page.screenshot(path=str(output_path), full_page=full_page)
            file_size = output_path.stat().st_size
            logger.info("Screenshot captured successfully: %s (%dx%d, %d bytes)", output_path, width, height, file_size)
            return {
                "path": str(output_path),
                "width": width,
                "height": height,
                "file_size": file_size,
                "status": "completed",
                "error_message": None,
            }
        except Exception as e:
            if output_path.exists():
                try:
                    output_path.unlink()
                except Exception:
                    pass
            logger.error("Screenshot capture failed for %s: %s", url, e, exc_info=True)
            raise ScreenshotCaptureError(f"Failed to capture screenshot for {url}: {e}") from e
        finally:
            if page is not None:
                try:
                    await page.close()
                except Exception:
                    pass
            if context is not None:
                try:
                    await context.close()
                except Exception:
                    pass

    async def close(self) -> None:
        if self._browser is not None and self._browser.is_connected():
            try:
                await self._browser.close()
            except Exception:
                pass
        if self._playwright is not None:
            try:
                await self._playwright.stop()
            except Exception:
                pass
            self._playwright = None
            self._browser = None
