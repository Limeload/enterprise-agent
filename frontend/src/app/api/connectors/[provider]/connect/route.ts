import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { CONNECTOR_META } from "@/lib/connectors/meta"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { ConnectorProvider } from "@prisma/client"

interface ConnectBody {
  nangoConnectionId: string
  providerAccountEmail?: string
  providerAccountId?: string
  scopes?: string[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const providerKey = provider.toUpperCase()
  const connector = CONNECTOR_META.find((c) => c.key === providerKey)
  if (!connector) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  let body: ConnectBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.nangoConnectionId) {
    return NextResponse.json({ error: "nangoConnectionId is required" }, { status: 400 })
  }

  await prisma.connector.upsert({
    where: { workspaceId_provider: { workspaceId: workspace.id, provider: providerKey as ConnectorProvider } },
    create: {
      workspaceId: workspace.id,
      userId,
      provider: providerKey as ConnectorProvider,
      status: "CONNECTED",
      scopes: body.scopes ?? connector.scopes,
      nangoConnectionId: body.nangoConnectionId,
      providerAccountEmail: body.providerAccountEmail ?? null,
      providerAccountId: body.providerAccountId ?? null,
      lastSyncedAt: new Date(),
    },
    update: {
      status: "CONNECTED",
      scopes: body.scopes ?? connector.scopes,
      nangoConnectionId: body.nangoConnectionId,
      providerAccountEmail: body.providerAccountEmail ?? null,
      providerAccountId: body.providerAccountId ?? null,
      lastSyncedAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId,
      action: "connector.connected",
      target: providerKey,
      metadata: { nangoConnectionId: body.nangoConnectionId },
    },
  })

  return NextResponse.json({ ok: true, provider: providerKey })
}
