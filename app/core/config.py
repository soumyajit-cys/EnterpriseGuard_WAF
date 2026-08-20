from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_PLACEHOLDER_SECRET_KEYS = {
    "change_this_to_a_long_random_string",
    "testsecret123",
}

MIN_SECRET_KEY_LENGTH = 32


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"

    DATABASE_URL: str
    REDIS_URL: str
    SECRET_KEY: str

    WAF_MODE: str = "detection"

    TRUSTED_PROXIES: list[str] = []

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    COOKIE_SECURE: bool = False

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8"
    )

    @model_validator(mode="after")
    def _validate_urls(self) -> "Settings":
        redis_prefix = self.REDIS_URL.split(":", 1)[0] + ":"
        if redis_prefix not in ("redis:", "rediss:"):
            raise ValueError(
                "REDIS_URL must start with redis:// or rediss:// "
                f"(got '{self.REDIS_URL[:20]}...'). Use your Upstash "
                "Redis/TLS connection string, e.g. "
                "rediss://default:password@host.upstash.io:6379"
            )
        if not self.DATABASE_URL.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "DATABASE_URL must start with postgresql+asyncpg:// "
                f"(got '{self.DATABASE_URL[:30]}...'). Swap postgresql:// "
                "for postgresql+asyncpg:// to use the async driver."
            )
        return self

    @model_validator(mode="after")
    def _validate_production_settings(self) -> "Settings":
        if self.ENVIRONMENT != "production":
            return self

        problems = []
        if not self.COOKIE_SECURE:
            problems.append(
                "COOKIE_SECURE must be true when ENVIRONMENT=production"
            )
        if (
            self.SECRET_KEY in _PLACEHOLDER_SECRET_KEYS
            or len(self.SECRET_KEY) < MIN_SECRET_KEY_LENGTH
        ):
            problems.append(
                "SECRET_KEY must be a random string of at least "
                f"{MIN_SECRET_KEY_LENGTH} characters when "
                "ENVIRONMENT=production"
            )
        if problems:
            raise ValueError(
                "Refusing to start in production with unsafe settings: "
                + "; ".join(problems)
            )
        return self


settings = Settings()