from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from functools import lru_cache


def _bool_from_env(v: object) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.lower() in ("true", "1", "yes", "on")
    return bool(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    APP_NAME: str = "Nova AI Website Foundation API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def coerce_debug(cls, v: object) -> bool:
        return _bool_from_env(v)

    DATABASE_URL: str = "postgresql+asyncpg://postgres:root@localhost:5432/organic-leads"
    DATABASE_POOL_SIZE: int = 10
    DATABASE_MAX_OVERFLOW: int = 20

    CORS_ORIGINS: list[str] = [
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
    ]

    SECRET_KEY: str = "your-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    WORDPRESS_API_TIMEOUT: int = 30
    WORDPRESS_MAX_RETRIES: int = 3
    WORDPRESS_CONNECTION_POOL_SIZE: int = 10
    WORDPRESS_URL: str = "http://localhost:8082"
    WORDPRESS_ADMIN_URL: str = "http://localhost:8082/wp-admin"
    WORDPRESS_USERNAME: str = ""
    WORDPRESS_APP_PASSWORD: str = ""
    WORDPRESS_VERIFY_SSL: bool = False
    WORDPRESS_UPLOAD_MAX_SIZE_MB: int = 50
    WEBSITE_DIAGNOSTICS_SCHEDULE_ENABLED: bool = False
    WEBSITE_DIAGNOSTICS_INTERVAL_MINUTES: int = 60

    BACKUP_BASE_DIR: str = "/backups"
    BACKUP_RETENTION_DAYS: int = 30

    LIGHTHOUSE_CHROME_PATH: str = "/usr/bin/google-chrome"
    LIGHTHOUSE_PORT: int = 9222

    SSH_TIMEOUT: int = 30
    SSH_MAX_RETRIES: int = 3

    FTP_TIMEOUT: int = 30

    CREDENTIAL_ENCRYPTION_KEY: str = ""

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/search-console/oauth/callback"
    GOOGLE_PROJECT_ID: str = ""
    GOOGLE_ANALYTICS_VIEW_ID: str = ""
    GOOGLE_OAUTH_SCOPES: str = "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/analytics.readonly"

    SEARCH_CONSOLE_SYNC_INTERVAL_MINUTES: int = 60
    SEARCH_CONSOLE_MAX_RETRIES: int = 3
    SEARCH_CONSOLE_API_TIMEOUT: int = 30
    SEARCH_CONSOLE_SCHEDULE_ENABLED: bool = False
    SEARCH_CONSOLE_INCREMENTAL_LOOKBACK_DAYS: int = 28
    SEARCH_CONSOLE_ALERT_SWEEP_INTERVAL_MINUTES: int = 60
    SEARCH_CONSOLE_CREDENTIAL_WARN_HOURS: int = 24

    @field_validator("SEARCH_CONSOLE_SCHEDULE_ENABLED", mode="before")
    @classmethod
    def coerce_sc_schedule(cls, v: object) -> bool:
        return _bool_from_env(v)

    # --- Redis -----------------------------------------------------------------
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_ENABLED: bool = True
    REDIS_CACHE_TTL_SECONDS: int = 300
    REDIS_PREFIX: str = "organic-leads"

    @field_validator("REDIS_CACHE_ENABLED", mode="before")
    @classmethod
    def coerce_redis_enabled(cls, v: object) -> bool:
        return _bool_from_env(v)

    # --- Scheduler -------------------------------------------------------------
    SCHEDULER_ENABLED: bool = True
    SCHEDULER_MISSED_FIRE_GRACE_SECONDS: int = 300
    SCHEDULER_JOB_COALESCE: bool = True
    SCHEDULER_JOB_MAX_INSTANCES: int = 1

    @field_validator("SCHEDULER_ENABLED", mode="before")
    @classmethod
    def coerce_scheduler_enabled(cls, v: object) -> bool:
        return _bool_from_env(v)

    # --- Monitoring / metrics ---------------------------------------------------
    METRICS_ENABLED: bool = True

    @field_validator("METRICS_ENABLED", mode="before")
    @classmethod
    def coerce_metrics_enabled(cls, v: object) -> bool:
        return _bool_from_env(v)

    # --- On-Page SEO crawler ----------------------------------------------------
    ONPAGE_CRAWLER_DEFAULT_DEPTH: int = 3
    ONPAGE_CRAWLER_DEFAULT_MAX_PAGES: int = 500
    ONPAGE_CRAWLER_TIMEOUT_SECONDS: int = 15
    ONPAGE_CRAWLER_USER_AGENT: str = (
        "OrganicLeadsBot/1.0 (+https://organicleads.local/bot; onpage-seo crawler)"
    )
    ONPAGE_CRAWLER_MAX_CONCURRENCY: int = 8
    ONPAGE_CRAWLER_SCHEDULE_ENABLED: bool = False
    ONPAGE_CRAWLER_SCHEDULE_INTERVAL_MINUTES: int = 1440

    @field_validator("ONPAGE_CRAWLER_SCHEDULE_ENABLED", mode="before")
    @classmethod
    def coerce_crawler_schedule(cls, v: object) -> bool:
        return _bool_from_env(v)

    # --- AI engine --------------------------------------------------------------
    OPENAI_API_KEY: str = ""
    AI_ENGINE_ENABLED: bool = True
    AI_MODEL: str = "gpt-4o-mini"
    AI_TEMPERATURE: float = 0.2

    @field_validator("AI_ENGINE_ENABLED", mode="before")
    @classmethod
    def coerce_ai_enabled(cls, v: object) -> bool:
        return _bool_from_env(v)

    # --- Export -----------------------------------------------------------------
    EXPORT_BASE_DIR: str = "storage/exports"
    EXPORT_URL_TTL_HOURS: int = 24


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
