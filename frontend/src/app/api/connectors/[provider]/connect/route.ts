import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { CONNECTOR_CONFIG } from "@/lib/connectors/config"
import { getUserWorkspace } from "@/lib/session"
import { randomBytes } from "crypto"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const providerKey = provider.toUpperCase()
  const config = CONNECTOR_CONFIG[providerKey]
  if (!config) return NextResponse.json({ error: "Unknown provider" }, { status: 400 })

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const state = randomBytes(16).toString("hex")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const searchParams = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${appUrl}/api/connectors/${provider}/callback`,
    scope: config.scopes.join(" "),
    response_type: "code",
    state,
    access_type: "offline",
    prompt: "consent",
  })

  const authUrl = `${config.authorizationUrl}?${searchParams.toString()}`
  const response = NextResponse.redirect(authUrl)
  response.cookies.set("connector_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax",
  })
  return response
}
