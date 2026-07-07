import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { getUserWorkspace } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import type { Role } from "@prisma/client"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  if (!workspace) return NextResponse.json({ members: [] })

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: { user: { select: { name: true, email: true, image: true } } },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    members: members.map((m) => ({
      id: m.id,
      name: m.user.name,
      email: m.user.email,
      image: m.user.image,
      role: m.role,
      joinedAt: m.createdAt,
    })),
  })
}

// Invite a member by email. If the user already exists they are added directly;
// otherwise this records an audit entry for a pending invite.
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const { email, role } = await request.json()
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

  const targetRole = (["ADMIN", "MEMBER", "VIEWER"].includes(role) ? role : "MEMBER") as Role

  const existingUser = await prisma.user.findUnique({ where: { email } })

  if (existingUser) {
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: existingUser.id },
      },
      create: { workspaceId: workspace.id, userId: existingUser.id, role: targetRole },
      update: { role: targetRole },
    })
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: session.user.id,
      action: existingUser ? "member.added" : "member.invited",
      target: email,
      metadata: { role: targetRole },
    },
  })

  return NextResponse.json({ ok: true, invited: !existingUser })
}
