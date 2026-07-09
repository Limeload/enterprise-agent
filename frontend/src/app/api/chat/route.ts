/**
 * Next.js API route — proxies to the FastAPI streaming endpoint.
 * This keeps the API_URL server-side and adds auth headers.
 */
import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const API_URL =
  process.env.API_URL ??
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const forwardedAuth = req.headers.get("authorization");

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/api/v1/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(forwardedAuth
          ? { Authorization: forwardedAuth }
          : process.env.INTERNAL_API_TOKEN
          ? { Authorization: `Bearer ${process.env.INTERNAL_API_TOKEN}` }
          : {}),
        ...(userId ? { "X-User-Id": userId } : {}),
        ...(user?.emailAddresses[0]?.emailAddress
          ? { "X-User-Email": user.emailAddresses[0].emailAddress }
          : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Could not reach backend chat service at ${API_URL}: ${message}`, {
      status: 503,
    });
  }

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
