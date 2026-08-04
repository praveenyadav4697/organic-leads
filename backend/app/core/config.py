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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
