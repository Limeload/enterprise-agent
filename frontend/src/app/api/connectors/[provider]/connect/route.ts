import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { CONNECTOR_META } from "@/lib/connectors/meta"
import type { ConnectorProvider } from "@prisma/client"

interface ConnectBody {
  composioConnectionId: string
}

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

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  let body: ConnectBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  // Save connection in DISCONNECTED state initially — callback will mark it CONNECTED
  await prisma.connector.upsert({
    where: { workspaceId_provider: { workspaceId: workspace.id, provider: providerKey as ConnectorProvider } },
    create: {
      workspaceId: workspace.id,
      userId,
      provider: providerKey as ConnectorProvider,
      status: "DISCONNECTED",
      scopes: connector.scopes,
      composioConnectionId: body.composioConnectionId,
    },
    update: {
      composioConnectionId: body.composioConnectionId,
      status: "DISCONNECTED",
    },
  })

  return NextResponse.json({ ok: true })
}
