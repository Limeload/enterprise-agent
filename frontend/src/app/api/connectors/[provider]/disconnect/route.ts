import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { ConnectorProvider } from "@prisma/client"

const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params
  const providerKey = provider.toUpperCase()

  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  // Ask the backend to delete from Nango (best-effort — don't block on failure)
  try {
    await fetch(`${backendUrl}/api/v1/connectors/${provider.toLowerCase()}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    })
  } catch {
    // Backend unavailable — local cleanup below still reflects the correct UI state
  }

  await prisma.connector.updateMany({
    where: { workspaceId: workspace.id, provider: providerKey as ConnectorProvider },
    data: {
      status: "DISCONNECTED",
      nangoConnectionId: null,
      providerAccountEmail: null,
      providerAccountId: null,
    },
  })

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId,
      action: "connector.disconnected",
      target: providerKey,
    },
  })

  return NextResponse.json({ ok: true })
}
