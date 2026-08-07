import asyncio
import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, PlainTextResponse

from app.core.cache import cache
from app.core.config import settings
from app.core.correlation import CorrelationIdMiddleware
from app.core.database import close_db, init_db
from app.core.logging import setup_logging
from app.core.exceptions import AppException
from app.core.metrics import registry
from app.core.scheduler import start_scheduler, shutdown_scheduler
from app.router import router

if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except AttributeError:
        pass

setup_logging()
logger = logging.getLogger("app.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure every model table exists before the first request lands.
    # We log the error loudly but don't crash boot — that lets /health
    # return and operators see the real error in the logs.
    try:
        await init_db()
    except Exception as exc:  # noqa: BLE001
        logger.exception("init_db failed at startup: %s", exc)

    # Start the APScheduler and register the module schedulers' jobs.
    try:
        start_scheduler()
        from app.modules.search_console.scheduler import register_search_console_jobs
        from app.modules.onpage_seo.crawler.scheduler import register_onpage_crawl_jobs

        register_search_console_jobs()
        register_onpage_crawl_jobs()
    except Exception as exc:  # noqa: BLE001
        logger.exception("scheduler startup failed: %s", exc)

    try:
        yield
    finally:
        shutdown_scheduler()
        await cache.close()
        await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Nova AI Website Foundation API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "message": exc.message,
            "detail": exc.message,
            "details": exc.details,
        },
    )


# Correlation IDs flow through every request, including background tasks.
app.add_middleware(CorrelationIdMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

screenshots_dir = Path(__file__).resolve().parent.parent.parent / "storage" / "screenshots"
screenshots_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/v1/screenshots", StaticFiles(directory=str(screenshots_dir)), name="screenshots")

# Exports directory used by the F06 export engine.
exports_dir = Path(__file__).resolve().parent.parent.parent / "storage" / "exports"
exports_dir.mkdir(parents=True, exist_ok=True)
app.mount("/api/v1/exports", StaticFiles(directory=str(exports_dir)), name="exports")


@app.get("/health")
async def health_check():
    """Liveness probe. Returns 200 when the process is up."""
    return {"status": "healthy", "service": settings.APP_NAME}


@app.get("/api/v1/health/ready")
async def ready_check():
    """Readiness probe — verifies the cache and reports basic status."""
    from app.core.scheduler import scheduler_running

    redis_ok = await cache.ping()
    return {
        "status": "ready" if redis_ok else "degraded",
        "cache": "ok" if redis_ok else "unavailable",
        "scheduler": "running" if scheduler_running() else "stopped",
    }


@app.get("/api/v1/metrics", response_class=PlainTextResponse)
async def metrics_endpoint():
    """Prometheus-formatted application metrics."""
    if not settings.METRICS_ENABLED:
        return PlainTextResponse("metrics disabled", status_code=404)
    return registry.render_text()


@app.get("/")
async def root():
    return {
        "message": "Welcome to Nova AI Website Foundation API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
