import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { CONNECTOR_META } from "@/lib/connectors/meta"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ connectors: [] })

  try {
    const res = await fetch(`${backendUrl}/api/v1/connectors`, { headers: { Accept: "application/json" } })
    if (res.ok) {
      const data = (await res.json()) as Array<{ source: string; status: string | null; connected: boolean }>
      const known = new Set(CONNECTOR_META.map((item) => item.key))
      const connectors = data
        .map((item) => ({
          provider: item.source.toUpperCase(),
          status: item.connected || item.status === "connected" ? "CONNECTED" : "DISCONNECTED",
          scopes: [],
          lastSyncedAt: null,
          expiresAt: null,
          updatedAt: new Date().toISOString(),
        }))
        .filter((item) => known.has(item.provider))

      return NextResponse.json({ connectors })
    }
  } catch {
    // Fall back to local connector rows when the backend is not running in development.
  }

  const connectors = await prisma.connector.findMany({
    where: { workspaceId: workspace.id },
    select: { provider: true, status: true, scopes: true, lastSyncedAt: true, expiresAt: true, updatedAt: true },
  })

  return NextResponse.json({ connectors })
}
