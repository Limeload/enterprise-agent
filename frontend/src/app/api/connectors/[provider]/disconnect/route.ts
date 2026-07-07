import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { ConnectorProvider } from "@prisma/client"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  await prisma.connector.updateMany({
    where: { workspaceId: workspace.id, provider: provider.toUpperCase() as ConnectorProvider },
    data: { status: "DISCONNECTED", encryptedAccessToken: null, encryptedRefreshToken: null },
  })

  await prisma.auditLog.create({
    data: { workspaceId: workspace.id, userId, action: "connector.disconnected", target: provider.toUpperCase() },
  })

  return NextResponse.json({ ok: true })
}
