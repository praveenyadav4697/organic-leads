from fastapi import APIRouter
from app.modules.website.router import router as website_router
from app.modules.foundation.router import router as foundation_router
from app.modules.tracking.router import router as tracking_router
from app.modules.search_landscape.router import router as search_landscape_router
from app.modules.search_console.router import router as search_console_router

router = APIRouter()

router.include_router(website_router, prefix="/api/v1")
router.include_router(foundation_router, prefix="/api/v1")
router.include_router(tracking_router, prefix="/api/v1")
router.include_router(search_landscape_router, prefix="/api/v1")
router.include_router(search_console_router, prefix="/api/v1")