import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getOrBootstrapWorkspace } from "@/lib/session"

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const clerkUser = await currentUser()
  await getOrBootstrapWorkspace(
    userId,
    clerkUser?.fullName,
    clerkUser?.emailAddresses[0]?.emailAddress
  )
  return NextResponse.json({ ok: true })
}
