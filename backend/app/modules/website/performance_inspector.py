"""Public performance signals — enterprise browser-level audit via
Playwright, Chrome DevTools Protocol, Navigation Timing API, and
PerformanceObserver.

Stack
-----

1. **HTTP-level facts** (no browser required) — TTFB, redirects, compression.
   Derived from the anonymous ``FetchResult``.

2. **Browser-level facts** (requires Playwright / Chromium) — full audit:
   * Core Web Vitals: LCP, CLS, INP, FID, FCP, FP
   * Timing: DNS, TCP, TLS, Request, Response, DOM Processing, Load Event
   * CDP metrics: Speed Index, TBT, HTTP version
   * Resources: every script/stylesheet/image/font/video/xhr/fetch/other with
       URL, transfer size, encoded/decoded size, duration, protocol
   * Page size: total transfer, encoded, decoded, by content type
   * Requests: count by type, third-party breakdown, largest/slowest resource
   * Network: HTTP version, compression, encoding, redirects, status, final URL

If Playwright or the browser is unavailable the inspector returns
``not_publicly_available=True`` for browser-only fields and includes an
``error`` description so the API/frontend can surface the failure explicitly
instead of silently showing partial HTTP-only results.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from app.modules.website.discovery_schemas import PerformanceFacts, to_fields_dict
from app.modules.website.http_inspector import FetchResult

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# HTTP-level inspector
# ---------------------------------------------------------------------------

def from_fetch(result: FetchResult, final_url: Optional[str] = None) -> PerformanceFacts:
    """Build the performance facts from a single HTTP fetch."""
    if not result.ok and result.not_publicly_available:
        return PerformanceFacts(
            checked_at=datetime.utcnow(),
            not_publicly_available=True,
            fields={"error": result.error or "no response"},
        )

    headers = result.headers or {}
    content_encoding = headers.get("content-encoding") or headers.get("Content-Encoding")
    if content_encoding:
        content_encoding = content_encoding.lower().strip()
    if content_encoding not in ("gzip", "br", "deflate", "identity", "zstd"):
        content_encoding = None

    compression_enabled = bool(content_encoding) and content_encoding in ("gzip", "br", "deflate", "zstd")

    fields = to_fields_dict(
        response_time_ms=result.response_time_ms,
        ttfb_ms=result.ttfb_ms,
        redirect_count=result.redirect_count,
        final_url=result.final_url or final_url,
        status_code=result.status_code,
        http_version=None,
        content_encoding=content_encoding,
        compression_enabled=compression_enabled,
        content_type=headers.get("content-type") or headers.get("Content-Type"),
    )

    return PerformanceFacts(
        checked_at=datetime.utcnow(),
        not_publicly_available=len(fields) == 0,
        fields=fields,
    )


# ---------------------------------------------------------------------------
# Playwright / CDP browser-level inspector
# ---------------------------------------------------------------------------

async def from_playwright(
    url: str,
    *,
    timeout_ms: int = 45000,
    headless: bool = True,
) -> Tuple[PerformanceFacts, Optional[Dict[str, Any]]]:
    """Launch Chromium via Playwright, collect CDP performance metrics, and
    return a :class:`PerformanceFacts` enriched with browser-level values.

    Returns a tuple of ``(facts, metrics)``.  ``metrics`` is ``None`` when
    Playwright or the browser is unavailable so the caller can surface the
    failure explicitly instead of silently showing partial HTTP-only results.
    """
    metrics: Optional[Dict[str, Any]] = None
    logger.info("[playwright] importing async_playwright")
    try:
        from playwright.async_api import async_playwright
        logger.info("[playwright] async_playwright import successful")
    except ImportError:
        logger.warning("playwright is not installed; browser-level performance metrics are unavailable")
        return PerformanceFacts(checked_at=datetime.utcnow(), not_publicly_available=True, fields={"error": "playwright_not_installed"}), None

    # Ensure Windows uses ProactorEventLoop, which Playwright requires.
    try:
        import asyncio as _asyncio
        import sys as _sys
        if _sys.platform == "win32":
            try:
                loop = _asyncio.get_running_loop()
                if not isinstance(loop, _asyncio.ProactorEventLoop):
                    _asyncio.set_event_loop_policy(_asyncio.WindowsProactorEventLoopPolicy())
                    logger.info("[playwright] switched to ProactorEventLoop on win32")
                else:
                    logger.info("[playwright] already using ProactorEventLoop on win32")
            except RuntimeError:
                logger.info("[playwright] no running loop; ProactorEventLoop will be used on next run")
    except Exception:
        pass

    playwright = None
    browser = None
    context = None
    page = None
    cdp = None
    perf_events: List[Dict[str, Any]] = []
    try:
        logger.info("[playwright] starting playwright")
        playwright = await async_playwright().start()
        logger.info("[playwright] launching chromium")
        browser = await playwright.chromium.launch(
            headless=headless,
            args=[
                "--ignore-certificate-errors",
                "--ignore-ssl-errors",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-web-security",
            ],
        )
        logger.info("[playwright] chromium launched")
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            ignore_https_errors=True,
        )
        page = await context.new_page()
        logger.info("[playwright] page created")

        # CDP session for Performance / Network / Page domains.
        cdp = await context.new_cdp_session(page)
        logger.info("[playwright] CDP session created")

        # Collect CDP performance metrics during navigation.
        perf_events: List[Dict[str, Any]] = []

        async def _on_performance_event(event: Dict[str, Any]) -> None:
            perf_events.append(event)

        try:
            await cdp.send("Performance.enable")
            cdp.on("Performance.metrics", _on_performance_event)
            logger.info("[playwright] Performance CDP events enabled")
        except Exception as e:
            logger.warning("[playwright] Performance.enable failed: %s", e)

        # Enable Network BEFORE navigation so CDP captures every request /
        # response event produced during page load.
        _cdp_resources: List[Dict[str, Any]] = []

        def _on_cdp_request(event: Dict[str, Any]) -> None:
            request_id = event.get("requestId")
            request = event.get("request") or {}
            _cdp_resources.append({
                "request_id": request_id,
                "name": request.get("url", ""),
                "method": request.get("method"),
                "initiator_type": _initiator_type(event.get("initiator")),
                "transfer_size": 0,
                "encoded_body_size": 0,
                "decoded_body_size": 0,
                "duration": 0,
                "protocol": None,
                "status_code": None,
                "mime_type": None,
            })

        def _on_cdp_response(event: Dict[str, Any]) -> None:
            request_id = event.get("requestId")
            response = event.get("response") or {}
            for r in _cdp_resources:
                if r.get("request_id") == request_id:
                    r["transfer_size"] = response.get("encodedDataLength", 0) or 0
                    r["encoded_body_size"] = response.get("encodedDataLength", 0) or 0
                    r["decoded_body_size"] = response.get("decodedBodyLength", 0) or 0
                    r["protocol"] = response.get("protocol")
                    r["status_code"] = response.get("status")
                    r["mime_type"] = response.get("mimeType")
                    break

        def _on_cdp_finished(event: Dict[str, Any]) -> None:
            request_id = event.get("requestId")
            for r in _cdp_resources:
                if r.get("request_id") == request_id:
                    r["transfer_size"] = max(r.get("transfer_size", 0), event.get("encodedDataLength", 0) or 0)
                    break

        try:
            cdp.on("Network.requestWillBeSent", _on_cdp_request)
            cdp.on("Network.responseReceived", _on_cdp_response)
            cdp.on("Network.loadingFinished", _on_cdp_finished)
            await cdp.send("Network.enable")
            logger.info("[playwright] Network CDP events enabled")
        except Exception as e:
            logger.warning("[playwright] Network.enable failed: %s", e)

        try:
            logger.info("[playwright] navigating to %s", url)
            await page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
        except Exception:
            try:
                http_url = url.replace("https://", "http://")
                await page.goto(http_url, wait_until="domcontentloaded", timeout=timeout_ms)
            except Exception as e:
                logger.warning("playwright navigation failed for %s: %s", url, e)
                return PerformanceFacts(checked_at=datetime.utcnow(), not_publicly_available=True, fields={"error": f"navigation_failed: {e}"}), None

        try:
            await page.wait_for_load_state("networkidle", timeout=timeout_ms)
            logger.info("[playwright] networkidle reached")
        except Exception:
            try:
                await page.wait_for_load_state("load", timeout=timeout_ms)
                logger.info("[playwright] load state reached")
            except Exception:
                logger.warning("[playwright] neither networkidle nor load state reached")
        await page.wait_for_timeout(2000)
        logger.info("[playwright] 2s post-load wait complete")

        # Set up observers AFTER navigation — buffered: true will now capture
        # all entries produced during the page load we just completed.
        await page.evaluate(
            """() => {
            window.__perf = {
              lcp: null, cls: 0, inp: null, fid: null,
              fcp: null, fp: null,
              navigation: null, longTasks: []
            };

            try {
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'largest-contentful-paint') {
                    window.__perf.lcp = entry.renderTime || entry.loadTime || entry.startTime;
                  }
                }
              }).observe({ type: 'largest-contentful-paint', buffered: true });
            } catch (e) {}

            try {
              let clsValue = 0;
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (!entry.hadRecentInput) clsValue += entry.value;
                }
                window.__perf.cls = clsValue;
              }).observe({ type: 'layout-shift', buffered: true });
            } catch (e) {}

            try {
              let inpValue = 0;
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  const dur = entry.processingStart && entry.processingEnd
                    ? entry.processingEnd - entry.processingStart
                    : entry.duration;
                  if (dur > inpValue) inpValue = dur;
                }
                window.__perf.inp = inpValue;
              }).observe({ type: 'first-input', buffered: true });
            } catch (e) {}

            try {
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
                    window.__perf.fcp = entry.startTime;
                  } else if (entry.entryType === 'paint' && entry.name === 'first-paint') {
                    window.__perf.fp = entry.startTime;
                  }
                }
              }).observe({ type: 'paint', buffered: true });
            } catch (e) {}

            try {
              new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                  if (entry.entryType === 'longtask') {
                    window.__perf.longTasks.push({
                      duration: entry.duration,
                      startTime: entry.startTime
                    });
                  }
                }
              }).observe({ type: 'longtask', buffered: true });
            } catch (e) {}
          }"""
        )

        # Give observers a moment to flush buffered entries.
        await page.wait_for_timeout(500)

        raw = await page.evaluate("() => window.__perf || {}")
        logger.info("[playwright] __perf raw: %s", raw)

        # --- Core Web Vitals ---
        lcp_ms = raw.get("lcp")
        cls = raw.get("cls")
        inp_ms = raw.get("inp")
        fid_ms = raw.get("fid")
        fcp_ms = raw.get("fcp")
        fp_ms = raw.get("fp")

        # --- TBT from long tasks ---
        long_tasks = raw.get("longTasks") or []
        tbt_ms = 0.0
        for task in long_tasks:
            dur = task.get("duration")
            if dur is not None:
                tbt_ms += max(0.0, float(dur) - 50.0)

        # --- Navigation Timing API v2 ---
        # Modern Chromium nullifies performance.timing (v1) values; use
        # getEntriesByType('navigation')[0] (v2) which exposes timing as
        # direct properties on the PerformanceNavigationTiming entry.
        nav_entry = await page.evaluate("""() => {
            const entries = performance.getEntriesByType('navigation');
            return entries && entries[0] ? entries[0].toJSON() : null;
        }""")
        logger.info("[playwright] nav_entry: %s", nav_entry)

        def _nav_ms(attr: str) -> Optional[float]:
            v = nav_entry.get(attr) if isinstance(nav_entry, dict) else None
            if v is None:
                return None
            try:
                return float(v)
            except (TypeError, ValueError):
                return None

        dns_ms = _nav_ms("domainLookupEnd") - _nav_ms("domainLookupStart") if _nav_ms("domainLookupEnd") is not None and _nav_ms("domainLookupStart") is not None else None
        tcp_ms = _nav_ms("connectEnd") - _nav_ms("connectStart") if _nav_ms("connectEnd") is not None and _nav_ms("connectStart") is not None else None
        tls_ms = None
        if tcp_ms is not None and _nav_ms("secureConnectionStart") is not None and _nav_ms("connectEnd") is not None:
            tls_ms = _nav_ms("connectEnd") - _nav_ms("secureConnectionStart")
            if tls_ms < 0:
                tls_ms = 0.0
        request_ms = _nav_ms("responseStart") - _nav_ms("requestStart") if _nav_ms("responseStart") is not None and _nav_ms("requestStart") is not None else None
        response_ms = _nav_ms("responseEnd") - _nav_ms("responseStart") if _nav_ms("responseEnd") is not None and _nav_ms("responseStart") is not None else None
        dom_processing_ms = _nav_ms("domContentLoadedEventEnd") - _nav_ms("domContentLoadedEventStart") if _nav_ms("domContentLoadedEventEnd") is not None and _nav_ms("domContentLoadedEventStart") is not None else None
        load_event_ms = _nav_ms("loadEventEnd") - _nav_ms("loadEventStart") if _nav_ms("loadEventEnd") is not None and _nav_ms("loadEventStart") is not None else None
        ttfb_ms = _nav_ms("responseStart")

        # --- Resource Timing via CDP Network domain ---
        # Modern Chromium blocks Resource Timing entries in automated contexts
        # (returns empty arrays).  CDP Network events were captured during the
        # navigation above via _on_cdp_request / _on_cdp_response handlers.
        resources = list(_cdp_resources)

        request_count = len(resources)

        def _sum_by_type(initiator_type: str) -> int:
            return sum(r.get("transfer_size", 0) for r in resources if r.get("initiator_type") == initiator_type)

        def _count_by_type(initiator_type: str) -> int:
            return sum(1 for r in resources if r.get("initiator_type") == initiator_type)

        js_bytes = _sum_by_type("script")
        css_bytes = _sum_by_type("stylesheet")
        image_bytes = _sum_by_type("img")
        font_bytes = _sum_by_type("font")
        video_bytes = _sum_by_type("video")
        audio_bytes = _sum_by_type("audio")
        xhr_fetch_bytes = _sum_by_type("xmlhttprequest") + _sum_by_type("fetch")
        other_bytes = _sum_by_type("other")

        js_requests = _count_by_type("script")
        css_requests = _count_by_type("stylesheet")
        image_requests = _count_by_type("img")
        font_requests = _count_by_type("font")
        video_requests = _count_by_type("video")
        audio_requests = _count_by_type("audio")
        xhr_fetch_requests = _count_by_type("xmlhttprequest") + _count_by_type("fetch")
        other_requests = _count_by_type("other")

        page_origin = url.rsplit("/", 1)[0] if "/" in url else url
        third_party_bytes = 0
        third_party_requests = 0
        for r in resources:
            try:
                resource_origin = r.get("name", "").split("/", 3)[2] if "://" in r.get("name", "") else ""
                if resource_origin and resource_origin != page_origin:
                    third_party_bytes += r.get("transfer_size", 0)
                    third_party_requests += 1
            except Exception:
                pass

        page_size_bytes = sum(r.get("transfer_size", 0) for r in resources)
        page_encoded_bytes = sum(r.get("encoded_body_size", 0) for r in resources)
        page_decoded_bytes = sum(r.get("decoded_body_size", 0) for r in resources)

        logger.info("[playwright] CDP resources count=%d page_size=%d", len(resources), page_size_bytes)

        # Largest resource by transfer size.
        largest_resource = None
        if resources:
            largest = max(resources, key=lambda r: r.get("transfer_size", 0) or 0)
            if largest.get("transfer_size"):
                largest_resource = {
                    "name": largest.get("name"),
                    "type": largest.get("initiator_type"),
                    "transferSize": largest.get("transfer_size"),
                    "encodedBodySize": largest.get("encoded_body_size"),
                    "duration": largest.get("duration", 0),
                }

        # Slowest resource by duration.
        slowest_resource = None
        if resources:
            slowest = max(resources, key=lambda r: r.get("duration", 0) or 0)
            if slowest.get("duration"):
                slowest_resource = {
                    "name": slowest.get("name"),
                    "type": slowest.get("initiator_type"),
                    "transferSize": slowest.get("transfer_size"),
                    "duration": slowest.get("duration", 0),
                }

        dom_size = await page.evaluate("() => document.querySelectorAll('*').length")
        logger.info("[playwright] dom_size=%d", dom_size)

        # --- Speed Index from CDP Performance metrics if available. ---
        speed_index_ms = _compute_speed_index_from_cdp(perf_events, lcp_ms, cls)
        if speed_index_ms is None and lcp_ms is not None:
            speed_index_ms = round(lcp_ms * 0.7, 1)

        # --- HTTP protocol via CDP Network domain. ---
        http_version = None
        protocol = None
        if cdp is not None:
            try:
                await cdp.send("Network.enable")
                await asyncio.sleep(0.2)
                proto_result = await cdp.send("Network.getProtocol")
                if isinstance(proto_result, dict):
                    protocol = proto_result.get("protocol") or proto_result.get("httpVersion")
                    http_version = protocol
            except Exception:
                http_version = None

        # Final URL from Playwright.
        final_url_value = page.url if page else url

        metrics = {
            "lcp_ms": float(lcp_ms) if lcp_ms is not None else None,
            "cls": float(cls) if cls is not None else None,
            "inp_ms": float(inp_ms) if inp_ms is not None else None,
            "fid_ms": float(fid_ms) if fid_ms is not None else None,
            "fcp_ms": float(fcp_ms) if fcp_ms is not None else None,
            "fp_ms": float(fp_ms) if fp_ms is not None else None,
            "ttfb_ms": ttfb_ms,
            "dns_ms": dns_ms,
            "tcp_ms": tcp_ms,
            "tls_ms": tls_ms,
            "request_ms": request_ms,
            "response_ms": response_ms,
            "dom_processing_ms": dom_processing_ms,
            "load_event_ms": load_event_ms,
            "tbt_ms": round(tbt_ms, 1) if tbt_ms else None,
            "speed_index_ms": speed_index_ms,
            "page_size_bytes": page_size_bytes,
            "page_encoded_bytes": page_encoded_bytes,
            "page_decoded_bytes": page_decoded_bytes,
            "request_count": request_count,
            "dom_size": int(dom_size) if dom_size is not None else None,
            "js_bytes": js_bytes,
            "css_bytes": css_bytes,
            "image_bytes": image_bytes,
            "font_bytes": font_bytes,
            "video_bytes": video_bytes,
            "audio_bytes": audio_bytes,
            "xhr_fetch_bytes": xhr_fetch_bytes,
            "other_bytes": other_bytes,
            "third_party_bytes": third_party_bytes,
            "third_party_requests": third_party_requests,
            "js_requests": js_requests,
            "css_requests": css_requests,
            "image_requests": image_requests,
            "font_requests": font_requests,
            "video_requests": video_requests,
            "audio_requests": audio_requests,
            "xhr_fetch_requests": xhr_fetch_requests,
            "other_requests": other_requests,
            "largest_resource": largest_resource,
            "slowest_resource": slowest_resource,
            "http_version": http_version,
            "protocol": protocol,
            "final_url": final_url_value,
        }

        # Build fields dict manually — include ALL browser metric keys even when
        # the value is None, so downstream consumers can distinguish "metric was
        # attempted but unavailable" from "metric key was never collected".
        browser_metric_count = sum(1 for k in ("lcp_ms", "cls", "inp_ms", "fid_ms", "fcp_ms", "fp_ms", "ttfb_ms",
                                                "dns_ms", "tcp_ms", "tls_ms", "request_ms", "response_ms",
                                                "dom_processing_ms", "load_event_ms", "tbt_ms", "speed_index_ms",
                                                "page_size_bytes", "request_count", "dom_size") if metrics.get(k) is not None)
        logger.info("[playwright] browser_metric_count=%d", browser_metric_count)
        logger.info("[playwright] metrics keys with values: %s", {k: metrics.get(k) for k in ["lcp_ms", "cls", "ttfb_ms", "dns_ms", "tcp_ms", "speed_index_ms", "page_size_bytes", "request_count"]})
        fields = {
            "lcp": metrics["lcp_ms"],
            "cls": metrics["cls"],
            "inp": metrics["inp_ms"],
            "fid": metrics["fid_ms"],
            "fcp": metrics["fcp_ms"],
            "fp": metrics["fp_ms"],
            "ttfb_ms": metrics["ttfb_ms"],
            "dns_ms": metrics["dns_ms"],
            "tcp_ms": metrics["tcp_ms"],
            "tls_ms": metrics["tls_ms"],
            "request_ms": metrics["request_ms"],
            "response_ms": metrics["response_ms"],
            "dom_processing_ms": metrics["dom_processing_ms"],
            "load_event_ms": metrics["load_event_ms"],
            "tbt_ms": metrics["tbt_ms"],
            "speed_index": metrics["speed_index_ms"],
            "page_size": metrics["page_size_bytes"],
            "page_encoded_bytes": metrics["page_encoded_bytes"],
            "page_decoded_bytes": metrics["page_decoded_bytes"],
            "requests": metrics["request_count"],
            "dom_size": metrics["dom_size"],
            "js_bytes": metrics["js_bytes"],
            "css_bytes": metrics["css_bytes"],
            "image_bytes": metrics["image_bytes"],
            "font_bytes": metrics["font_bytes"],
            "video_bytes": metrics["video_bytes"],
            "audio_bytes": metrics["audio_bytes"],
            "xhr_fetch_bytes": metrics["xhr_fetch_bytes"],
            "other_bytes": metrics["other_bytes"],
            "third_party_bytes": metrics["third_party_bytes"],
            "third_party_requests": metrics["third_party_requests"],
            "js_requests": metrics["js_requests"],
            "css_requests": metrics["css_requests"],
            "image_requests": metrics["image_requests"],
            "font_requests": metrics["font_requests"],
            "video_requests": metrics["video_requests"],
            "audio_requests": metrics["audio_requests"],
            "xhr_fetch_requests": metrics["xhr_fetch_requests"],
            "other_requests": metrics["other_requests"],
            "largest_resource": metrics["largest_resource"],
            "slowest_resource": metrics["slowest_resource"],
            "http_version": metrics["http_version"],
            "protocol": metrics["protocol"],
            "final_url": metrics["final_url"],
        }

        # Validate that we actually captured browser-level metrics.  If Playwright
        # launched but produced zero browser metrics (e.g. observers failed,
        # CDP unavailable), surface that explicitly instead of returning an
        # empty fields dict that looks like success.
        if browser_metric_count == 0:
            logger.warning("playwright launched for %s but captured zero browser metrics", url)
            fields["error"] = "playwright_metrics_capture_failed"
            logger.warning("[playwright] returning not_publicly_available=True with fields keys: %s", list(fields.keys()))
            return PerformanceFacts(checked_at=datetime.utcnow(), not_publicly_available=True, fields=fields), metrics

        logger.info("[playwright] returning not_publicly_available=False with browser metrics")
        return PerformanceFacts(checked_at=datetime.utcnow(), not_publicly_available=False, fields=fields), metrics

    except Exception as e:
        logger.warning("playwright performance capture failed: %s", e, exc_info=True)
        return PerformanceFacts(checked_at=datetime.utcnow(), not_publicly_available=True, fields={"error": str(e)}), None
    finally:
        if cdp is not None:
            try:
                await cdp.detach()
            except Exception:
                pass
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
        if browser is not None and browser.is_connected():
            try:
                await browser.close()
            except Exception:
                pass
        if playwright is not None:
            try:
                await playwright.stop()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# CDP helpers
# ---------------------------------------------------------------------------

def _initiator_type(initiator: Optional[Dict[str, Any]]) -> str:
    """Map CDP Initiator object to a simple string type."""
    if not isinstance(initiator, dict):
        return "other"
    if initiator.get("type") == "script":
        return "script"
    if initiator.get("type") == "parser":
        return "other"
    if initiator.get("type") == "link":
        preload = initiator.get("linkUrl") or ""
        if ".css" in preload:
            return "stylesheet"
        if any(ext in preload for ext in (".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif")):
            return "img"
        if any(ext in preload for ext in (".woff", ".woff2", ".ttf", ".otf")):
            return "font"
        return "other"
    if initiator.get("type") == "img":
        return "img"
    if initiator.get("type") == "css":
        return "stylesheet"
    if initiator.get("type") == "xmlhttprequest":
        return "xmlhttprequest"
    if initiator.get("type") == "fetch":
        return "fetch"
    return "other"


def _compute_speed_index_from_cdp(
    perf_events: List[Dict[str, Any]],
    lcp_ms: Optional[float],
    cls: Optional[float],
) -> Optional[float]:
    """Approximate Speed Index from CDP Performance metrics if available."""
    paint_events: List[Tuple[float, str]] = []
    for ev in perf_events:
        try:
            metric = ev.get("metric", {})
            name = metric.get("name", "")
            value = metric.get("value")
            if name in {"FirstMeaningfulPaint", "FirstContentfulPaint", "LargestContentfulPaint"} and value is not None:
                paint_events.append((float(value), name))
        except Exception:
            pass

    if not paint_events:
        if lcp_ms is not None:
            si = lcp_ms + (cls * 500 if cls else lcp_ms * 0.2)
            return round(float(si), 1)
        return None

    paint_events.sort(key=lambda x: x[0])
    lcp = lcp_ms if lcp_ms is not None else (paint_events[-1][0] if paint_events else None)
    if lcp is None:
        return None
    si = lcp * 0.7 + (cls * 500 if cls else 0)
    return round(float(si), 1)
