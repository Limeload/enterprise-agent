from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_env: str = "development"
    api_secret_key: str = "change-me"
    cors_origins: list[str] = ["http://localhost:3000"]
    log_level: str = "INFO"

    # LLM
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    gemini_api_key: str = ""
    groq_api_key: str = ""
    llm_model: str = "claude-sonnet-4-6"

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
    langchain_tracing_v2: bool = True
    langchain_project: str = "enterprise-agent"
    langchain_endpoint: str = "https://api.smith.langchain.com"

    # OpenTelemetry
    otel_exporter_otlp_endpoint: str = "http://localhost:4318"
    otel_service_name: str = "enterprise-agent"

    # Connectors
    github_token: str = ""
    github_org: str = ""
    notion_api_key: str = ""
    slack_bot_token: str = ""
    slack_signing_secret: str = ""
    hubspot_access_token: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    google_refresh_token: str = ""
    jira_base_url: str = ""
    jira_email: str = ""
    jira_api_token: str = ""
    salesforce_client_id: str = ""
    salesforce_client_secret: str = ""
    salesforce_refresh_token: str = ""
    salesforce_instance_url: str = ""
    zendesk_subdomain: str = ""
    zendesk_email: str = ""
    zendesk_api_token: str = ""
    composio_api_key: str = ""
    # Maps connector source name -> Composio auth config id (created in the Composio
    # dashboard per toolkit, e.g. {"github": "ac_xxx", "slack": "ac_yyy"})
    composio_auth_config_ids: dict[str, str] = {}

    # Redis
    redis_url: str = "redis://localhost:6379"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
