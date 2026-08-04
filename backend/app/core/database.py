from urllib.parse import urlparse, urlunparse

from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from contextlib import asynccontextmanager

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

AuditSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


def _admin_database_url(target_db: str) -> str:
    """Return a connection URL pointing at ``target_db``'s server's
    ``postgres`` admin database. Used to bootstrap the target DB if it's
    missing.

    Only works for ``postgresql+asyncpg://`` URLs — for other dialects
    (SQLite, MySQL) the helper just returns the original URL unchanged
    so the rest of the init flow runs unchanged.
    """
    parsed = urlparse(settings.DATABASE_URL)
    if not parsed.scheme.startswith("postgresql"):
        return settings.DATABASE_URL
    return urlunparse(parsed._replace(path="/postgres"))


def _target_db_name() -> str:
    """Extract the database name from ``settings.DATABASE_URL``.

    Returns ``""`` if the URL doesn't carry a database name (e.g.
    SQLite, in-memory). Callers should treat ``""`` as "skip the
    bootstrap step".
    """
    parsed = urlparse(settings.DATABASE_URL)
    name = parsed.path.lstrip("/")
    return name


async def ensure_database_exists() -> bool:
    """Create the configured database if it isn't already present.

    Connects to the ``postgres`` admin database, checks ``pg_database``,
    and runs ``CREATE DATABASE`` (idempotently) when missing.

    Returns ``True`` if the database already existed or was created,
    ``False`` if the URL isn't a Postgres URL and nothing was done.

    The SQL is wrapped in a plain ``text()`` because we can't run
    ``CREATE DATABASE`` inside a transaction block — Postgres rejects it.
    """
    db_name = _target_db_name()
    if not db_name or db_name == "postgres":
        return False

    admin_url = _admin_database_url(db_name)
    admin_engine = create_async_engine(admin_url, isolation_level="AUTOCOMMIT")

    try:
        async with admin_engine.connect() as conn:
            exists = await conn.scalar(
                text("SELECT 1 FROM pg_database WHERE datname = :n"),
                {"n": db_name},
            )
            if not exists:
                # ``quote_ident`` is safer than f-stringing the name.
                quoted = (
                    await conn.scalar(
                        text("SELECT quote_ident(:n)"),
                        {"n": db_name},
                    )
                )
                await conn.execute(text(f"CREATE DATABASE {quoted}"))
    finally:
        await admin_engine.dispose()

    return True


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


@asynccontextmanager
async def get_audit_db() -> AsyncSession:
    async with AuditSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
        finally:
            await session.close()


async def init_db() -> None:
    """Create every model table that isn't already present.

    Imports are kept inside the function to avoid import-order cycles
    (modules import ``Base`` from here at module-load time).
    """
    # Make sure the target database exists before ``create_all`` runs.
    # This is a no-op for non-Postgres URLs (e.g. SQLite) and for the
    # ``postgres`` admin DB itself.
    await ensure_database_exists()

    # Import model modules so their tables register on Base.metadata.
    # NOTE: keep this in sync with every module under ``app.modules.*``
    # that ships SQLAlchemy models. Missing entries silently leave their
    # tables uncreated.
    from app.modules.onpage_seo import models as _onpage  # noqa: F401
    from app.modules.search_console import models as _sc  # noqa: F401
    from app.modules.website import models as _ws  # noqa: F401

    # We use an AUTOCOMMIT engine for the bootstrap so each CREATE TABLE
    # is its own transaction — a duplicate index or transient FK race
    # on one table never rolls back the rest. ``checkfirst=True`` keeps
    # CREATE TABLE itself idempotent; ``IF NOT EXISTS`` is added to
    # CREATE INDEX so already-existing indexes are silently skipped.
    from sqlalchemy.exc import DBAPIError

    bootstrap_engine = create_async_engine(
        settings.DATABASE_URL,
        isolation_level="AUTOCOMMIT",
    )
    try:
        for table in Base.metadata.sorted_tables:
            try:
                async with bootstrap_engine.connect() as conn:
                    # ``checkfirst=True`` makes CREATE TABLE idempotent.
                    # We add an IF NOT EXISTS-style guard by checking
                    # information_schema first; if the table is already
                    # there we skip the create_all entirely to avoid the
                    # duplicate-index failure mode that modules with
                    # both ``index=True`` and an explicit ``Index(...)``
                    # for the same column would otherwise trigger.
                    exists = await conn.scalar(
                        text(
                            """
                            SELECT 1 FROM information_schema.tables
                            WHERE table_schema='public' AND table_name = :n
                            """
                        ),
                        {"n": table.name},
                    )
                    if not exists:
                        await conn.run_sync(
                            lambda sync_conn, t=table: Base.metadata.create_all(
                                sync_conn,
                                tables=[t],
                                checkfirst=True,
                            )
                        )
            except DBAPIError as exc:
                msg = str(exc.orig if exc.orig else exc).lower()
                # ``already exists`` covers races where another process
                # created the same table between our existence check and
                # our create_all call.
                if "already exists" in msg or "duplicate" in msg:
                    continue
                # Same race for FK targets.
                if "does not exist" in msg:
                    continue
                raise
    finally:
        await bootstrap_engine.dispose()


async def close_db() -> None:
    await engine.dispose()
