import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { bootstrapWorkspace } from "@/lib/workspace"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
  if (!session) return NextResponse.redirect(new URL("/login", base))

  await bootstrapWorkspace(session.user.id, session.user.name)
  return NextResponse.redirect(new URL("/chat", base))
}
