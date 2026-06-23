"""Connector registry — maps source names to connector instances."""
from __future__ import annotations

from connectors.base import BaseConnector

_registry: dict[str, BaseConnector] = {}

# Source names that support a real, per-user OAuth-connected implementation.
PER_USER_CAPABLE_SOURCES = ("github", "notion", "slack", "hubspot")

ALL_SOURCE_NAMES = (
    "github", "notion", "slack", "hubspot",
    "gmail", "google_drive", "confluence", "sharepoint", "gitlab", "bitbucket",
    "jira", "linear", "azure_devops", "salesforce", "zendesk", "intercom",
    "freshdesk", "google_calendar", "outlook_calendar", "asana", "monday",
    "trello", "snowflake", "bigquery", "databricks", "redshift", "postgres",
    "mysql", "microsoft_teams", "dropbox", "box", "onedrive",
)


def _build_registry() -> dict[str, BaseConnector]:
    from core.config import settings
    from connectors.github import GitHubConnector
    from connectors.notion import NotionConnector
    from connectors.slack import SlackConnector
    from connectors.hubspot import HubSpotConnector
    from connectors.stubs import (
        GmailConnector, GoogleDriveConnector, ConfluenceConnector, SharePointConnector,
        GitLabConnector, BitbucketConnector, JiraConnector, LinearConnector,
        AzureDevOpsConnector, SalesforceConnector, ZendeskConnector, IntercomConnector,
        FreshdeskConnector, GoogleCalendarConnector, OutlookCalendarConnector,
        AsanaConnector, MondayConnector, TrelloConnector, SnowflakeConnector,
        BigQueryConnector, DatabricksConnector, RedshiftConnector, PostgresConnector,
        MySQLConnector, TeamsConnector, DropboxConnector, BoxConnector, OneDriveConnector,
    )

    reg: dict[str, BaseConnector] = {
        # Real connectors
        "github":          GitHubConnector() if settings.github_token else None,
        "notion":          NotionConnector() if settings.notion_api_key else None,
        "slack":           SlackConnector() if settings.slack_bot_token else None,
        "hubspot":         HubSpotConnector() if settings.hubspot_access_token else None,
        # Stubs — replace with real implementations as you add credentials
        "gmail":           GmailConnector(),
        "google_drive":    GoogleDriveConnector(),
        "confluence":      ConfluenceConnector(),
        "sharepoint":      SharePointConnector(),
        "gitlab":          GitLabConnector(),
        "bitbucket":       BitbucketConnector(),
        "jira":            JiraConnector(),
        "linear":          LinearConnector(),
        "azure_devops":    AzureDevOpsConnector(),
        "salesforce":      SalesforceConnector(),
        "zendesk":         ZendeskConnector(),
        "intercom":        IntercomConnector(),
        "freshdesk":       FreshdeskConnector(),
        "google_calendar": GoogleCalendarConnector(),
        "outlook_calendar":OutlookCalendarConnector(),
        "asana":           AsanaConnector(),
        "monday":          MondayConnector(),
        "trello":          TrelloConnector(),
        "snowflake":       SnowflakeConnector(),
        "bigquery":        BigQueryConnector(),
        "databricks":      DatabricksConnector(),
        "redshift":        RedshiftConnector(),
        "postgres":        PostgresConnector(),
        "mysql":           MySQLConnector(),
        "microsoft_teams": TeamsConnector(),
        "dropbox":         DropboxConnector(),
        "box":             BoxConnector(),
        "onedrive":        OneDriveConnector(),
    }
    # Filter out None values
    return {k: v for k, v in reg.items() if v is not None}


_PER_USER_CONNECTOR_CLASSES: dict[str, type] = {}


def _per_user_connector_classes() -> dict[str, type]:
    global _PER_USER_CONNECTOR_CLASSES
    if not _PER_USER_CONNECTOR_CLASSES:
        from connectors.github import GitHubConnector
        from connectors.notion import NotionConnector
        from connectors.slack import SlackConnector
        from connectors.hubspot import HubSpotConnector

        _PER_USER_CONNECTOR_CLASSES = {
            "github": GitHubConnector,
            "notion": NotionConnector,
            "slack": SlackConnector,
            "hubspot": HubSpotConnector,
        }
    return _PER_USER_CONNECTOR_CLASSES


def get_connector(name: str, user_id: str | None = None) -> BaseConnector | None:
    """Resolve a connector. If `user_id` has a connected personal credential for `name`,
    instantiate a fresh connector with that credential instead of the global env-based one."""
    if user_id and name in PER_USER_CAPABLE_SOURCES:
        from core.encryption import decrypt_secret
        from db.connections import get_connection

        record = get_connection(user_id, name)
        if record and record.get("status") == "connected" and record.get("encrypted_credential"):
            connector_cls = _per_user_connector_classes()[name]
            token = decrypt_secret(record["encrypted_credential"])
            return connector_cls(token=token)

    global _registry
    if not _registry:
        _registry = _build_registry()
    return _registry.get(name)


def list_connectors() -> list[str]:
    """All known connector source names — used for the connectors settings UI
    and as the default search scope, independent of whether credentials are configured."""
    return list(ALL_SOURCE_NAMES)
