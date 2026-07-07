import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  if (!workspace) return NextResponse.json({ connectors: [] })

  const connectors = await prisma.connector.findMany({
    where: { workspaceId: workspace.id },
    select: {
      provider: true,
      status: true,
      scopes: true,
      lastSyncedAt: true,
      expiresAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ connectors })
}
