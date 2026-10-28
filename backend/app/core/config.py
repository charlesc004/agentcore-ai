from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import secrets


class Settings(BaseSettings):
    database_url: str = "sqlite:///./agentcore.db"
    jwt_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(48), min_length=32)
    redis_url: str = "redis://localhost:6379/0"
    execution_mode: str = "local"
    cors_origin: str = "http://localhost:3000"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def settings():
    return Settings()
