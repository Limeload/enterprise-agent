// Client-safe connector metadata. NO secrets here — safe to import in the browser.
// Server-only OAuth config (client IDs/secrets, token URLs) lives in ./config.ts.

export interface ConnectorMeta {
  key: string
  name: string
  icon: string
  color: string
  abbr: string
  category: string
  description: string
}

export const CONNECTOR_META: ConnectorMeta[] = [
  { key: "GMAIL", name: "Gmail", icon: "📧", color: "bg-cache-err", abbr: "Gm", category: "Communication", description: "Read and search emails. Send emails with approval." },
  { key: "GOOGLE_DRIVE", name: "Google Drive", icon: "📁", color: "bg-bc-700", abbr: "GD", category: "Knowledge", description: "Index documents. Read selected files." },
  { key: "GOOGLE_CALENDAR", name: "Google Calendar", icon: "📅", color: "bg-bc-700", abbr: "GC", category: "Productivity", description: "Read calendar events and schedules." },
  { key: "SLACK", name: "Slack", icon: "💬", color: "bg-bc-accent", abbr: "Sl", category: "Communication", description: "Read channels and messages. Post with approval." },
  { key: "GITHUB", name: "GitHub", icon: "🐙", color: "bg-surface-muted", abbr: "GH", category: "Engineering", description: "Read repositories, PRs, and issues." },
  { key: "JIRA", name: "Jira", icon: "🎯", color: "bg-bc-700", abbr: "Ji", category: "Engineering", description: "Read tickets and sprints. Create tickets with approval." },
  { key: "NOTION", name: "Notion", icon: "📓", color: "bg-surface-over", abbr: "No", category: "Knowledge", description: "Read pages, databases, and docs." },
  { key: "CONFLUENCE", name: "Confluence", icon: "📚", color: "bg-bc-700", abbr: "Cf", category: "Knowledge", description: "Read spaces, pages, and documentation." },
  { key: "SALESFORCE", name: "Salesforce", icon: "☁️", color: "bg-bc-700", abbr: "SF", category: "CRM", description: "Read and search CRM records." },
  { key: "HUBSPOT", name: "HubSpot", icon: "🧡", color: "bg-cache-miss", abbr: "HS", category: "CRM", description: "Read contacts, deals, and companies." },
  { key: "ZENDESK", name: "Zendesk", icon: "🎧", color: "bg-cache-hit", abbr: "Zd", category: "CRM", description: "Read tickets and customer conversations." },
  { key: "MICROSOFT_TEAMS", name: "Microsoft Teams", icon: "💼", color: "bg-bc-accent", abbr: "MS", category: "Communication", description: "Read teams, channels, and chat messages." },
  { key: "ONEDRIVE", name: "OneDrive", icon: "☁️", color: "bg-bc-700", abbr: "OD", category: "Knowledge", description: "Read and index files from OneDrive." },
]

export const CONNECTOR_CATEGORIES = [
  "All",
  "Engineering",
  "Knowledge",
  "Communication",
  "CRM",
  "Productivity",
]
