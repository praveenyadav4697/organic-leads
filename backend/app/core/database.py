from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    echo=settings.DEBUG,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create every model table that isn't already present.

    Imports are kept inside the function to avoid import-order cycles
    (modules import ``Base`` from here at module-load time).
    """
    # Import model modules so their tables register on Base.metadata.
    from app.modules.search_console import models as _sc  # noqa: F401
    from app.modules.website import models as _ws  # noqa: F401

    async with engine.begin() as conn:
        # ``checkfirst=True`` makes CREATE TABLE idempotent but does NOT
        # prevent a second CREATE INDEX on the same name. We swallow the
        # specific "already exists" race so ``init_db`` is safe to call on
        # every boot.
        try:
            await conn.run_sync(Base.metadata.create_all, checkfirst=True)
        except Exception as exc:  # noqa: BLE001
            msg = str(exc).lower()
            if "already exists" in msg or "duplicate" in msg:
                return
            raise


async def close_db() -> None:
    await engine.dispose()
