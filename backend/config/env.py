from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class AppSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR.parent / ".env", env_file_encoding="utf-8", extra="ignore"
    )

    DJANGO_SECRET_KEY: str = Field(default="dev-secret-key")
    DJANGO_DEBUG: bool = Field(default=True)
    DJANGO_ALLOWED_HOSTS: str = Field(default="localhost,127.0.0.1")

    POSTGRES_DB: str = Field(default="estimate_matcher")
    POSTGRES_USER: str = Field(default="estimate_user")
    POSTGRES_PASS: str = Field(default="estimate_password")
    POSTGRES_HOST: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)

    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    CORS_ALLOWED_ORIGINS: str = Field(default="http://localhost:5173")

    LLM_ENABLED: bool = Field(default=False)
    LLM_PROVIDER: str = Field(default="ollama")
    LLM_BASE_URL: str = Field(default="http://localhost:11434")
    LLM_MODEL: str = Field(default="deepseek-r1:1.5b")
    LLM_TIMEOUT_SECONDS: int = Field(default=120)

    @property
    def allowed_hosts_list(self) -> list[str]:
        return [host.strip() for host in self.DJANGO_ALLOWED_HOSTS.split(",") if host]

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return [
            origin.strip() for origin in self.CORS_ALLOWED_ORIGINS.split(",") if origin
        ]


settings = AppSettings()
