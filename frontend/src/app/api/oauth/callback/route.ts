import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { ConnectorProvider } from "@prisma/client"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

/**
 * Composio OAuth callback.
 *
 * Composio redirects here after the user completes OAuth.
 * Expected query params: connectedAccountId, provider (echoed from connection state)
 *
 * We look up the pending connection by connectedAccountId, mark it CONNECTED in
 * Prisma, then redirect to the popup-close page.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const connectedAccountId = searchParams.get("connectedAccountId") || searchParams.get("connected_account_id")
  const provider = searchParams.get("provider")?.toUpperCase()
  const error = searchParams.get("error") || searchParams.get("errorMessage")

  if (error) {
    return NextResponse.redirect(`${APP_URL}/oauth/done?error=${encodeURIComponent(error)}`)
  }

  if (!connectedAccountId) {
    return NextResponse.redirect(`${APP_URL}/oauth/done?error=missing_connection_id`)
  }

  try {
    let updated = await prisma.connector.updateMany({
      where: { composioConnectionId: connectedAccountId },
      data: { status: "CONNECTED", lastSyncedAt: new Date() },
    })

    if (updated.count === 0 && provider) {
      updated = await prisma.connector.updateMany({
        where: {
          provider: provider as ConnectorProvider,
          status: "DISCONNECTED",
        },
        data: {
          status: "CONNECTED",
          composioConnectionId: connectedAccountId,
          lastSyncedAt: new Date(),
        },
      })
    }

    if (updated.count === 0) {
      return NextResponse.redirect(`${APP_URL}/oauth/done?error=connector_not_found`)
    }
  } catch (err) {
    console.error("[oauth/callback] db error", err)
    return NextResponse.redirect(`${APP_URL}/oauth/done?error=db_error`)
  }

  return NextResponse.redirect(`${APP_URL}/oauth/done?provider=${provider ?? "unknown"}`)
}
