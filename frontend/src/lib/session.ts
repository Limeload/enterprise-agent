import { auth } from "./auth-server"
import { prisma } from "./prisma"
import { headers } from "next/headers"
import { cache } from "react"

export const getServerSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return session
})

export async function requireAuth() {
  const session = await getServerSession()
  if (!session) throw new Error("Unauthorized")
  return session
}

export async function getUserWorkspace(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: { include: { credits: true, subscription: true } } },
    orderBy: { createdAt: "asc" },
  })
  return membership?.workspace ?? null
}
