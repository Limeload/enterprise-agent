import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { ActionType, Prisma } from "@prisma/client"

const ACTION_COSTS: Record<string, number> = {
  CHAT_SIMPLE: 1,
  CHAT_RAG: 3,
  CHAT_AGENT: 5,
  DOCUMENT_INGEST: 2,
  CONNECTOR_SYNC: 10,
  REPORT_GENERATE: 20,
  ACTION_EXECUTE: 5,
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace?.credits) return NextResponse.json({ error: "No credits" }, { status: 400 })

  const { action, metadata } = await request.json()
  const cost = ACTION_COSTS[action] ?? 1

  if (workspace.credits.balance < cost) {
    return NextResponse.json(
      { error: "Insufficient credits", balance: workspace.credits.balance },
      { status: 402 }
    )
  }

  await prisma.$transaction([
    prisma.credits.update({
      where: { workspaceId: workspace.id },
      data: { balance: { decrement: cost } },
    }),
    prisma.creditTransaction.create({
      data: {
        workspaceId: workspace.id,
        userId,
        action: action as ActionType,
        credits: cost,
        metadata: metadata as Prisma.InputJsonValue,
      },
    }),
  ])

  return NextResponse.json({ ok: true, cost, newBalance: workspace.credits.balance - cost })
}
