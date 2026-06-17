from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Enterprise WAF"

    DATABASE_URL: str
    REDIS_URL: str

    SECRET_KEY: str

    WAF_MODE: str = "detection"

    class Config:
        env_file = ".env"


settings = Settings()