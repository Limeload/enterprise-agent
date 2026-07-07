import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { ConnectorProvider } from "@prisma/client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const providerKey = provider.toUpperCase()

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const connector = await prisma.connector.findUnique({
    where: { workspaceId_provider: { workspaceId: workspace.id, provider: providerKey as ConnectorProvider } },
  })

  if (!connector || connector.status !== "CONNECTED") {
    return NextResponse.json({ error: "Connector not connected" }, { status: 400 })
  }

  await prisma.connector.update({
    where: { id: connector.id },
    data: { lastSyncedAt: new Date(), status: "CONNECTED" },
  })

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId,
      action: "connector.synced",
      target: providerKey,
    },
  })

  return NextResponse.json({ ok: true, lastSyncedAt: new Date().toISOString() })
}
