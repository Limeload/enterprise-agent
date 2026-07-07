import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ logs: [] })

  const logs = await prisma.auditLog.findMany({
    where: { workspaceId: workspace.id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      target: l.target,
      actor: l.user.name ?? l.user.email,
      createdAt: l.createdAt,
    })),
  })
}
