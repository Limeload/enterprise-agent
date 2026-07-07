import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { ConnectorProvider } from "@prisma/client"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  await prisma.connector.updateMany({
    where: {
      workspaceId: workspace.id,
      provider: provider.toUpperCase() as ConnectorProvider,
    },
    data: { status: "DISCONNECTED", encryptedAccessToken: null, encryptedRefreshToken: null },
  })

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: session.user.id,
      action: "connector.disconnected",
      target: provider.toUpperCase(),
    },
  })

  return NextResponse.json({ ok: true })
}
