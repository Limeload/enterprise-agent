import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { CONNECTOR_META } from "@/lib/connectors/meta"

const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const providerKey = provider.toUpperCase()

  const connector = CONNECTOR_META.find((c) => c.key === providerKey)
  if (!connector) return NextResponse.json({ error: "Unknown provider" }, { status: 400 })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await currentUser()

  // Forward to the FastAPI backend which owns the Composio SDK and API key
  const resp = await fetch(
    `${backendUrl}/api/v1/connectors/${provider.toLowerCase()}/initiate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId,
        ...(user?.emailAddresses[0]?.emailAddress
          ? { "X-User-Email": user.emailAddresses[0].emailAddress }
          : {}),
      },
    }
  )

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}))
    const detail = (err as { detail?: string }).detail ?? "Failed to start OAuth"
    return NextResponse.json({ error: detail }, { status: resp.status })
  }

  const data = await resp.json()
  return NextResponse.json({ connectionId: data.connection_id, redirectUrl: data.redirect_url })
}
