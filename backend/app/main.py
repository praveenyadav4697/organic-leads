import asyncio
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import close_db, init_db
from app.core.logging import setup_logging
from app.core.exceptions import AppException
from app.router import router

if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except AttributeError:
        pass

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure every model table exists before the first request lands.
    try:
        await init_db()
    except Exception as exc:  # noqa: BLE001
        # Don't crash boot if the DB is briefly unavailable — let /health
        # return and let operators see the real error in the logs.
        import logging
        logging.getLogger("app.startup").warning(
            "init_db failed at startup: %s", exc
        )
    try:
        yield
    finally:
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
        content={"message": exc.message, "details": exc.details},
    )


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


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": settings.APP_NAME}


@app.get("/")
async def root():
    return {
        "message": "Welcome to Nova AI Website Foundation API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
