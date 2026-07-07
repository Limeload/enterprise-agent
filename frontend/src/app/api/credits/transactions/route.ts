import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
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

  const usedThisMonth = transactions.reduce((sum: number, t) => sum + t.credits, 0)

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
