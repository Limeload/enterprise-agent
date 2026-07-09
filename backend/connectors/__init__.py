"""Connector registry — resolves per-user connector instances via Composio.

For each OAuth-backed connector, pass the Composio connection ID; the registry
fetches a fresh access token from Composio and instantiates the connector class.
"""
from __future__ import annotations

import asyncpg

from connectors.base import BaseConnector
from core.config import settings

COMPOSIO_CAPABLE_SOURCES: tuple[str, ...] = (
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


def _provider_key(name: str) -> str:
    return {
        "gmail": "GMAIL",
        "google_drive": "GOOGLE_DRIVE",
        "google_calendar": "GOOGLE_CALENDAR",
        "microsoft_teams": "MICROSOFT_TEAMS",
        "onedrive": "ONEDRIVE",
    }.get(name, name.upper())


async def _lookup_composio_connection_id(name: str, user_id: str | None) -> str | None:
    if not settings.database_url:
        return None

    provider = _provider_key(name)
    conn = await asyncpg.connect(settings.database_url)
    try:
        if user_id:
            row = await conn.fetchrow(
                """
                SELECT "composioConnectionId"
                FROM "Connector"
                WHERE "provider" = $1
                  AND "status" = 'CONNECTED'
                  AND "userId" = $2
                  AND "composioConnectionId" IS NOT NULL
                ORDER BY "updatedAt" DESC
                LIMIT 1
                """,
                provider,
                user_id,
            )
            if row:
                return row["composioConnectionId"]

        if settings.app_env == "development":
            row = await conn.fetchrow(
                """
                SELECT "composioConnectionId"
                FROM "Connector"
                WHERE "provider" = $1
                  AND "status" = 'CONNECTED'
                  AND "composioConnectionId" IS NOT NULL
                ORDER BY "updatedAt" DESC
                LIMIT 1
                """,
                provider,
            )
            if row:
                return row["composioConnectionId"]
    finally:
        await conn.close()

    return None


async def get_connector(name: str, user_id: str | None = None, composio_connection_id: str | None = None) -> BaseConnector | None:
    if not composio_connection_id and name in COMPOSIO_CAPABLE_SOURCES:
        composio_connection_id = await _lookup_composio_connection_id(name, user_id)

    if composio_connection_id and name in COMPOSIO_CAPABLE_SOURCES:
        from integrations.composio_client import get_token

        token = get_token(composio_connection_id)
        connector_cls = _connector_classes().get(name)
        if connector_cls:
            if token:
                return connector_cls(token=token)
            if name == "gmail":
                return connector_cls(composio_connection_id=composio_connection_id)

    return _stub_registry().get(name)


def list_connectors() -> list[str]:
    return list(ALL_SOURCE_NAMES)
