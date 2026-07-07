import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  if (!workspace) return NextResponse.json({ transactions: [], byAction: {} })

  const transactions = await prisma.creditTransaction.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const byAction: Record<string, number> = {}
  for (const t of transactions) {
    byAction[t.action] = (byAction[t.action] ?? 0) + t.credits
  }

  const usedThisMonth = transactions.reduce((sum, t) => sum + t.credits, 0)

  return NextResponse.json({
    transactions: transactions.map((t) => ({
      id: t.id,
      action: t.action,
      credits: t.credits,
      createdAt: t.createdAt,
    })),
    byAction,
    usedThisMonth,
  })
}
