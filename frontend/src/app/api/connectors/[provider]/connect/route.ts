import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { CONNECTOR_META } from "@/lib/connectors/meta"
import { getUserWorkspace } from "@/lib/session"

const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const providerKey = provider.toUpperCase()
  const connector = CONNECTOR_META.find((item) => item.key === providerKey)
  if (!connector) return NextResponse.redirect(new URL("/integrations?error=unknown_provider", request.url), 302)

  const { userId } = await auth()
  if (!userId) return NextResponse.redirect(new URL("/login", request.url), 302)

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.redirect(new URL("/onboarding", request.url), 302)

  try {
    const res = await fetch(`${backendUrl}/api/v1/connectors/${provider.toLowerCase()}/connect`, {
      method: "POST",
      headers: { Accept: "application/json" },
    })

    if (res.status === 400) {
      return NextResponse.redirect(
        new URL(`/integrations?error=oauth_not_configured&provider=${provider}`, request.url),
        302
      )
    }

    if (!res.ok) {
      return NextResponse.redirect(new URL(`/integrations?error=auth_failed&provider=${provider}`, request.url), 302)
    }

    const data = (await res.json()) as { redirect_url?: string }
    if (!data.redirect_url) {
      return NextResponse.redirect(
        new URL(`/integrations?error=oauth_not_configured&provider=${provider}`, request.url),
        302
      )
    }

    return NextResponse.redirect(data.redirect_url, 302)
  } catch {
    return NextResponse.redirect(
      new URL(`/integrations?error=oauth_not_configured&provider=${provider}`, request.url),
      302
    )
  }
}
