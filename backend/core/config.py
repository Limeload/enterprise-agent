import json
from functools import lru_cache

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),  # backend/.env takes priority; fall back to project root .env
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_env: str = "development"
    api_secret_key: str = "change-me"
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    # LLM
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    google_api_key: str = ""
    google_generative_ai_api_key: str = ""
    groq_api_key: str = ""
    llm_model: str = "claude-sonnet-4-6"
    gemini_model: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    database_url: str = ""

    # Frontend / OAuth redirects
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # Encryption key for storing per-user connector credentials at rest
    connection_encryption_key: str = ""

    # LangSmith
    langchain_api_key: str = ""
    langchain_tracing_v2: bool | None = None
    langchain_project: str = "enterprise-agent"
    langchain_endpoint: str = "https://api.smith.langchain.com"

    # OpenTelemetry
    otel_exporter_otlp_endpoint: str = "http://localhost:4318"
    otel_service_name: str = "enterprise-agent"

    # Connectors — OAuth via Composio (zero per-provider credentials needed)
    composio_api_key: str = ""
    composio_auth_config_ids: dict[str, str] = {}
    github_org: str = ""

    @field_validator("composio_auth_config_ids", mode="before")
    @classmethod
    def parse_composio_auth_config_ids(cls, value):
        if isinstance(value, str):
            if not value.strip():
                return {}
            return json.loads(value)
        return value

    @model_validator(mode="after")
    def apply_llm_aliases(self):
        if not self.gemini_api_key and self.google_api_key:
            self.gemini_api_key = self.google_api_key
        if not self.gemini_api_key and self.google_generative_ai_api_key:
            self.gemini_api_key = self.google_generative_ai_api_key
        if self.gemini_api_key and self.gemini_model and self.llm_model == "claude-sonnet-4-6":
            self.llm_model = self.gemini_model
        return self

    # Redis
    redis_url: str = "redis://localhost:6379"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
