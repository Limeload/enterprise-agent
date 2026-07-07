import { auth } from "@clerk/nextjs/server"
import { prisma } from "./prisma"
import { Plan } from "@prisma/client"

const PLAN_CREDITS: Record<Plan, number> = {
  FREE: 100,
  PRO: 2000,
  TEAM: 10000,
  ENTERPRISE: 999999,
}

export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) throw new Error("Unauthorized")
  return userId
}

export async function getUserWorkspace(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: { include: { credits: true, subscription: true } } },
    orderBy: { createdAt: "asc" },
  })
  return membership?.workspace ?? null
}

export async function getOrBootstrapWorkspace(userId: string, name?: string | null, email?: string | null) {
  const existing = await getUserWorkspace(userId)
  if (existing) return existing

  // Ensure the user row exists in our DB (synced from Clerk)
  await prisma.user.upsert({
    where: { id: userId },
    create: { id: userId, name: name ?? null, email: email ?? `${userId}@clerk.local` },
    update: {},
  })

  const slug = `ws-${userId.slice(-8)}`
  const workspace = await prisma.workspace.create({
    data: {
      name: name ? `${name.split(" ")[0]}'s Workspace` : "My Workspace",
      slug,
      ownerId: userId,
      plan: Plan.FREE,
      members: { create: { userId, role: "OWNER" } },
      credits: {
        create: { balance: PLAN_CREDITS.FREE, monthlyLimit: PLAN_CREDITS.FREE, resetDate: new Date() },
      },
      subscription: { create: { plan: Plan.FREE, status: "ACTIVE" } },
    },
    include: { credits: true, subscription: true },
  })

  return workspace
}
