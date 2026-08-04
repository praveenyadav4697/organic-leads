from fastapi import APIRouter
from app.modules.website.router import router as website_router
from app.modules.foundation.router import router as foundation_router
from app.modules.search_console.router import router as search_console_router
from app.modules.onpage_seo.router import router as onpage_seo_router

router = APIRouter()

router.include_router(website_router, prefix="/api/v1")
router.include_router(foundation_router, prefix="/api/v1")
router.include_router(search_console_router, prefix="/api/v1")
router.include_router(onpage_seo_router, prefix="/api/v1")
