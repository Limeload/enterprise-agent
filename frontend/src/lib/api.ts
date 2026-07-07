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

async function post<T>(path: string, body: unknown, accessToken?: string | null): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(accessToken) },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = text;
    try { msg = JSON.parse(text).detail ?? text; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<unknown> {
  return post("/api/backend/auth/login", { email, password });
}

export async function signup(email: string, password: string): Promise<unknown> {
  return post("/api/backend/auth/signup", { email, password });
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

export async function sendMessage(
  message: string,
  sessionId?: string,
  accessToken?: string | null
): Promise<ChatResponse> {
  return post("/api/backend/chat", { message, session_id: sessionId }, accessToken);
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export async function search(
  query: string,
  sources?: string[],
  accessToken?: string | null
): Promise<SearchResult[]> {
  return post("/api/backend/search", { query, sources }, accessToken);
}

// ---------------------------------------------------------------------------
// Connectors
// ---------------------------------------------------------------------------

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

export async function submitApiKey(
  source: string,
  apiKey: string,
  accessToken: string
): Promise<ConnectorStatus> {
  return post(`/api/backend/connectors/${source}/api-key`, { api_key: apiKey }, accessToken);
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
