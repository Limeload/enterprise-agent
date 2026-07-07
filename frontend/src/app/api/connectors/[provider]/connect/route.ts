import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
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

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const state = randomBytes(16).toString("hex")
  const params2 = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: `${process.env.BETTER_AUTH_URL}/api/connectors/${provider}/callback`,
    scope: config.scopes.join(" "),
    response_type: "code",
    state,
    access_type: "offline",
    prompt: "consent",
  })

  const authUrl = `${config.authorizationUrl}?${params2.toString()}`

  const response = NextResponse.redirect(authUrl)
  response.cookies.set("connector_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax",
  })
  return response
}
