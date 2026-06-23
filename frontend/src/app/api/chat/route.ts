/**
 * Next.js API route — proxies to the FastAPI streaming endpoint.
 * This keeps the API_URL server-side and adds auth headers.
 */
import { NextRequest } from "next/server";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const forwardedAuth = req.headers.get("authorization");

  const upstream = await fetch(`${API_URL}/api/v1/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(forwardedAuth
        ? { Authorization: forwardedAuth }
        : process.env.INTERNAL_API_TOKEN
        ? { Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN}` }
        : {}),
    },
    body: JSON.stringify(body),
  });

  if (!upstream.ok) {
    return new Response(await upstream.text(), { status: upstream.status });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
