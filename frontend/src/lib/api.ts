const BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  citations: Citation[];
  intent: string;
  sources_used: string[];
  audit_event_id: string | null;
}

export interface Citation {
  source: string;
  title: string;
  url: string;
  excerpt: string;
}

export interface SearchResult {
  source: string;
  title: string;
  content: string;
  url: string;
  score: number;
  metadata: Record<string, unknown>;
}

function authHeaders(accessToken?: string | null): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function sendMessage(
  message: string,
  sessionId?: string,
  accessToken?: string | null
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/api/backend/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function search(
  query: string,
  sources?: string[],
  accessToken?: string | null
): Promise<SearchResult[]> {
  const res = await fetch(`${BASE}/api/backend/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify({ query, sources }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface ConnectorStatus {
  source: string;
  accessible: boolean;
  connected: boolean;
  status: string | null;
}

export async function getConnectorStatuses(accessToken: string): Promise<ConnectorStatus[]> {
  const res = await fetch(`${BASE}/api/backend/connectors`, {
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function startConnectorConnect(
  source: string,
  accessToken: string
): Promise<{ redirect_url: string }> {
  const res = await fetch(`${BASE}/api/backend/connectors/${source}/connect`, {
    method: "POST",
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function disconnectConnector(source: string, accessToken: string): Promise<void> {
  const res = await fetch(`${BASE}/api/backend/connectors/${source}`, {
    method: "DELETE",
    headers: authHeaders(accessToken),
  });
  if (!res.ok) throw new Error(await res.text());
}
