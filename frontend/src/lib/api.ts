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

export async function sendMessage(
  message: string,
  sessionId?: string
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/api/backend/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function search(
  query: string,
  sources?: string[]
): Promise<SearchResult[]> {
  const res = await fetch(`${BASE}/api/backend/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, sources }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
