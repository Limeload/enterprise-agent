import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ connectors: [] })

  const connectors = await prisma.connector.findMany({
    where: { workspaceId: workspace.id },
    select: {
      provider: true,
      status: true,
      scopes: true,
      providerAccountEmail: true,
      providerAccountId: true,
      lastSyncedAt: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ connectors })
}
