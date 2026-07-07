// Client-safe connector metadata. NO secrets here — safe to import in the browser.
// Connector OAuth is started through the backend's hosted Composio flow.

export interface ConnectorMeta {
  key: string
  name: string
  iconSlug: string
  iconColor: string
  color: string
  abbr: string
  category: string
  description: string
}

export const CONNECTOR_META: ConnectorMeta[] = [
  { key: "GMAIL", name: "Gmail", iconSlug: "gmail", iconColor: "EA4335", color: "bg-cache-err", abbr: "Gm", category: "Communication", description: "Read and search emails. Send emails with approval." },
  { key: "GOOGLE_DRIVE", name: "Google Drive", iconSlug: "googledrive", iconColor: "4285F4", color: "bg-bc-700", abbr: "GD", category: "Knowledge", description: "Index documents. Read selected files." },
  { key: "GOOGLE_CALENDAR", name: "Google Calendar", iconSlug: "googlecalendar", iconColor: "4285F4", color: "bg-bc-700", abbr: "GC", category: "Productivity", description: "Read calendar events and schedules." },
  { key: "SLACK", name: "Slack", iconSlug: "slack", iconColor: "4A154B", color: "bg-bc-accent", abbr: "Sl", category: "Communication", description: "Read channels and messages. Post with approval." },
  { key: "GITHUB", name: "GitHub", iconSlug: "github", iconColor: "181717", color: "bg-surface-muted", abbr: "GH", category: "Engineering", description: "Read repositories, PRs, and issues." },
  { key: "JIRA", name: "Jira", iconSlug: "jira", iconColor: "0052CC", color: "bg-bc-700", abbr: "Ji", category: "Engineering", description: "Read tickets and sprints. Create tickets with approval." },
  { key: "NOTION", name: "Notion", iconSlug: "notion", iconColor: "000000", color: "bg-surface-over", abbr: "No", category: "Knowledge", description: "Read pages, databases, and docs." },
  { key: "CONFLUENCE", name: "Confluence", iconSlug: "confluence", iconColor: "172B4D", color: "bg-bc-700", abbr: "Cf", category: "Knowledge", description: "Read spaces, pages, and documentation." },
  { key: "SALESFORCE", name: "Salesforce", iconSlug: "salesforce", iconColor: "00A1E0", color: "bg-bc-700", abbr: "SF", category: "CRM", description: "Read and search CRM records." },
  { key: "HUBSPOT", name: "HubSpot", iconSlug: "hubspot", iconColor: "FF7A59", color: "bg-cache-miss", abbr: "HS", category: "CRM", description: "Read contacts, deals, and companies." },
  { key: "ZENDESK", name: "Zendesk", iconSlug: "zendesk", iconColor: "03363D", color: "bg-cache-hit", abbr: "Zd", category: "CRM", description: "Read tickets and customer conversations." },
  { key: "MICROSOFT_TEAMS", name: "Microsoft Teams", iconSlug: "microsoftteams", iconColor: "6264A7", color: "bg-bc-accent", abbr: "MS", category: "Communication", description: "Read teams, channels, and chat messages." },
  { key: "ONEDRIVE", name: "OneDrive", iconSlug: "microsoftonedrive", iconColor: "0078D4", color: "bg-bc-700", abbr: "OD", category: "Knowledge", description: "Read and index files from OneDrive." },
]

export const CONNECTOR_CATEGORIES = [
  "All",
  "Engineering",
  "Knowledge",
  "Communication",
  "CRM",
  "Productivity",
]
