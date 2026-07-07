"""Connector registry — resolves per-user connector instances using Nango tokens.

Every connector that requires OAuth is resolved dynamically at request time:
1. Look up the user's Nango connection ID from the DB.
2. Fetch a fresh access token from Nango (Nango handles refresh automatically).
3. Instantiate the connector class with that token.

This means BrainCache never stores raw OAuth credentials — only Nango connection IDs.
"""
from __future__ import annotations

from connectors.base import BaseConnector

# All sources that support a real Nango-backed OAuth implementation.
NANGO_CAPABLE_SOURCES = (
    "gmail",
    "google_drive",
    "google_calendar",
    "slack",
    "github",
    "jira",
    "notion",
    "confluence",
    "salesforce",
    "hubspot",
    "zendesk",
    "microsoft_teams",
    "onedrive",
)

ALL_SOURCE_NAMES = (
    "gmail", "google_drive", "google_calendar",
    "slack", "github", "jira", "notion", "confluence",
    "salesforce", "hubspot", "zendesk",
    "microsoft_teams", "onedrive",
    "sharepoint", "gitlab", "bitbucket", "linear", "azure_devops",
    "intercom", "freshdesk", "outlook_calendar",
    "asana", "monday", "trello",
    "snowflake", "bigquery", "databricks", "redshift", "postgres", "mysql",
    "dropbox", "box",
)


def _connector_classes() -> dict[str, type]:
    from connectors.gmail import GmailConnector
    from connectors.google_drive import GoogleDriveConnector
    from connectors.google_calendar import GoogleCalendarConnector
    from connectors.slack import SlackConnector
    from connectors.github import GitHubConnector
    from connectors.jira import JiraConnector
    from connectors.notion import NotionConnector
    from connectors.confluence import ConfluenceConnector
    from connectors.salesforce import SalesforceConnector
    from connectors.hubspot import HubSpotConnector
    from connectors.zendesk import ZendeskConnector
    from connectors.microsoft_teams import MicrosoftTeamsConnector
    from connectors.onedrive import OneDriveConnector

    return {
        "gmail":           GmailConnector,
        "google_drive":    GoogleDriveConnector,
        "google_calendar": GoogleCalendarConnector,
        "slack":           SlackConnector,
        "github":          GitHubConnector,
        "jira":            JiraConnector,
        "notion":          NotionConnector,
        "confluence":      ConfluenceConnector,
        "salesforce":      SalesforceConnector,
        "hubspot":         HubSpotConnector,
        "zendesk":         ZendeskConnector,
        "microsoft_teams": MicrosoftTeamsConnector,
        "onedrive":        OneDriveConnector,
    }


def _stub_registry() -> dict[str, BaseConnector]:
    from connectors.stubs import (
        SharePointConnector, GitLabConnector, BitbucketConnector, LinearConnector,
        AzureDevOpsConnector, IntercomConnector, FreshdeskConnector,
        OutlookCalendarConnector, AsanaConnector, MondayConnector, TrelloConnector,
        SnowflakeConnector, BigQueryConnector, DatabricksConnector, RedshiftConnector,
        PostgresConnector, MySQLConnector, DropboxConnector, BoxConnector,
    )
    return {
        "sharepoint":       SharePointConnector(),
        "gitlab":           GitLabConnector(),
        "bitbucket":        BitbucketConnector(),
        "linear":           LinearConnector(),
        "azure_devops":     AzureDevOpsConnector(),
        "intercom":         IntercomConnector(),
        "freshdesk":        FreshdeskConnector(),
        "outlook_calendar": OutlookCalendarConnector(),
        "asana":            AsanaConnector(),
        "monday":           MondayConnector(),
        "trello":           TrelloConnector(),
        "snowflake":        SnowflakeConnector(),
        "bigquery":         BigQueryConnector(),
        "databricks":       DatabricksConnector(),
        "redshift":         RedshiftConnector(),
        "postgres":         PostgresConnector(),
        "mysql":            MySQLConnector(),
        "dropbox":          DropboxConnector(),
        "box":              BoxConnector(),
    }


async def get_connector(name: str, user_id: str | None = None) -> BaseConnector | None:
    """Resolve a connector instance for the given user.

    For Nango-capable connectors, fetches a fresh token from Nango using the
    user's stored connection ID. Falls back to stub connectors for sources not
    yet implemented or when the user has no active connection.
    """
    if user_id and name in NANGO_CAPABLE_SOURCES:
        from db.connections import get_connection
        from integrations import nango_client

        record = get_connection(user_id, name)
        if record and record.get("status") == "connected" and record.get("nango_connection_id"):
            token = await nango_client.get_token(name, record["nango_connection_id"])
            if token:
                connector_cls = _connector_classes().get(name)
                if connector_cls:
                    return connector_cls(token=token)

    return _stub_registry().get(name)


def list_connectors() -> list[str]:
    """All known connector source names for the integrations UI and default search scope."""
    return list(ALL_SOURCE_NAMES)
