import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { CONNECTOR_CONFIG } from "@/lib/connectors/config"
import { getUserWorkspace } from "@/lib/session"
import { encrypt } from "@/lib/encryption"
import { prisma } from "@/lib/prisma"
import type { ConnectorProvider } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const providerKey = provider.toUpperCase()
  const config = CONNECTOR_CONFIG[providerKey]
  if (!config) return NextResponse.redirect(new URL("/integrations?error=unknown_provider", request.url))

  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const storedState = request.cookies.get("connector_state")?.value

  if (!code || state !== storedState) {
    return NextResponse.redirect(new URL("/integrations?error=invalid_state", request.url))
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(new URL("/login", request.url))

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.redirect(new URL("/onboarding", request.url))

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const tokenRes = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: `${appUrl}/api/connectors/${provider}/callback`,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokenRes.ok || !tokens.access_token) {
      throw new Error(tokens.error_description ?? "Token exchange failed")
    }

    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null

    await prisma.connector.upsert({
      where: { workspaceId_provider: { workspaceId: workspace.id, provider: providerKey as ConnectorProvider } },
      create: {
        workspaceId: workspace.id,
        userId,
        provider: providerKey as ConnectorProvider,
        status: "CONNECTED",
        scopes: config.scopes,
        encryptedAccessToken: encrypt(tokens.access_token),
        encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt,
      },
      update: {
        status: "CONNECTED",
        scopes: config.scopes,
        encryptedAccessToken: encrypt(tokens.access_token),
        encryptedRefreshToken: tokens.refresh_token ? encrypt(tokens.refresh_token) : null,
        expiresAt,
      },
    })

    await prisma.auditLog.create({
      data: { workspaceId: workspace.id, userId, action: "connector.connected", target: providerKey },
    })

    const response = NextResponse.redirect(new URL(`/integrations?connected=${provider}`, request.url))
    response.cookies.delete("connector_state")
    return response
  } catch (err) {
    console.error("Connector callback error:", err)
    return NextResponse.redirect(new URL("/integrations?error=auth_failed", request.url))
  }
}
