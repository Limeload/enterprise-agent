"""Stub connectors for sources not yet fully implemented."""
from __future__ import annotations

from typing import Any

from connectors.base import BaseConnector


class StubConnector(BaseConnector):
    def __init__(self, source_name: str) -> None:
        self.name = source_name

    async def search(self, query: str, entities: dict[str, Any], limit: int = 5) -> list[dict]:
        return [{
            "source": self.name,
            "doc_id": f"stub-{self.name}-001",
            "title": f"[STUB] {self.name} result for: {query[:60]}",
            "content": f"This is a placeholder result from the {self.name} connector. Wire up real credentials to enable live data.",
            "url": "",
            "score": 0.1,
            "metadata": {"stub": True},
        }]


# Pre-instantiated stubs for all unimplemented sources
GmailConnector = lambda: StubConnector("gmail")
GoogleDriveConnector = lambda: StubConnector("google_drive")
ConfluenceConnector = lambda: StubConnector("confluence")
SharePointConnector = lambda: StubConnector("sharepoint")
GitLabConnector = lambda: StubConnector("gitlab")
BitbucketConnector = lambda: StubConnector("bitbucket")
JiraConnector = lambda: StubConnector("jira")
LinearConnector = lambda: StubConnector("linear")
AzureDevOpsConnector = lambda: StubConnector("azure_devops")
SalesforceConnector = lambda: StubConnector("salesforce")
ZendeskConnector = lambda: StubConnector("zendesk")
IntercomConnector = lambda: StubConnector("intercom")
FreshdeskConnector = lambda: StubConnector("freshdesk")
GoogleCalendarConnector = lambda: StubConnector("google_calendar")
OutlookCalendarConnector = lambda: StubConnector("outlook_calendar")
AsanaConnector = lambda: StubConnector("asana")
MondayConnector = lambda: StubConnector("monday")
TrelloConnector = lambda: StubConnector("trello")
SnowflakeConnector = lambda: StubConnector("snowflake")
BigQueryConnector = lambda: StubConnector("bigquery")
DatabricksConnector = lambda: StubConnector("databricks")
RedshiftConnector = lambda: StubConnector("redshift")
PostgresConnector = lambda: StubConnector("postgres")
MySQLConnector = lambda: StubConnector("mysql")
TeamsConnector = lambda: StubConnector("microsoft_teams")
DropboxConnector = lambda: StubConnector("dropbox")
BoxConnector = lambda: StubConnector("box")
OneDriveConnector = lambda: StubConnector("onedrive")
