import { prisma } from "./prisma"
import { Plan } from "@prisma/client"

const PLAN_CREDITS: Record<Plan, number> = {
  FREE: 100,
  PRO: 2000,
  TEAM: 10000,
  ENTERPRISE: 999999,
}

export async function bootstrapWorkspace(userId: string, userName: string | null) {
  // Check if user already has a workspace
  const existing = await prisma.workspaceMember.findFirst({ where: { userId } })
  if (existing) return

  const slug = `ws-${userId.slice(0, 8)}`

  const workspace = await prisma.workspace.create({
    data: {
      name: userName ? `${userName}'s Workspace` : "My Workspace",
      slug,
      ownerId: userId,
      plan: Plan.FREE,
      members: {
        create: { userId, role: "OWNER" },
      },
      credits: {
        create: {
          balance: PLAN_CREDITS.FREE,
          monthlyLimit: PLAN_CREDITS.FREE,
          resetDate: new Date(),
        },
      },
      subscription: {
        create: { plan: Plan.FREE, status: "ACTIVE" },
      },
    },
  })

  return workspace
}
