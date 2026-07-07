import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    credits: workspace.credits
      ? { balance: workspace.credits.balance, monthlyLimit: workspace.credits.monthlyLimit }
      : null,
    subscription: workspace.subscription
      ? { plan: workspace.subscription.plan, status: workspace.subscription.status }
      : null,
  })
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const { name } = await request.json()
  if (!name || typeof name !== "string") return NextResponse.json({ error: "Invalid name" }, { status: 400 })

  const updated = await prisma.workspace.update({
    where: { id: workspace.id },
    data: { name: name.trim() },
  })

  await prisma.auditLog.create({
    data: { workspaceId: workspace.id, userId, action: "workspace.renamed", target: name.trim() },
  })

  return NextResponse.json({ ok: true, name: updated.name })
}
