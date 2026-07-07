import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getOrBootstrapWorkspace } from "@/lib/session"

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  const appUrl = new URL(request.url).origin
  if (!userId) return NextResponse.redirect(new URL("/login", appUrl))

  const clerkUser = await currentUser()
  await getOrBootstrapWorkspace(
    userId,
    clerkUser?.fullName,
    clerkUser?.emailAddresses[0]?.emailAddress
  )
  return NextResponse.redirect(new URL("/chat", appUrl))
}
