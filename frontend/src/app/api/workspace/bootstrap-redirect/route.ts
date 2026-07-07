import { NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getOrBootstrapWorkspace } from "@/lib/session"

export async function GET() {
  const { userId } = await auth()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  if (!userId) return NextResponse.redirect(new URL("/login", appUrl))

  const clerkUser = await currentUser()
  await getOrBootstrapWorkspace(
    userId,
    clerkUser?.fullName,
    clerkUser?.emailAddresses[0]?.emailAddress
  )
  return NextResponse.redirect(new URL("/chat", appUrl))
}
