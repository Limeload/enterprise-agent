"""Connector registry — maps source names to connector instances."""
from __future__ import annotations

from connectors.base import BaseConnector

_registry: dict[str, BaseConnector] = {}


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


def get_connector(name: str) -> BaseConnector | None:
    global _registry
    if not _registry:
        _registry = _build_registry()
    return _registry.get(name)


def list_connectors() -> list[str]:
    global _registry
    if not _registry:
        _registry = _build_registry()
    return list(_registry.keys())
