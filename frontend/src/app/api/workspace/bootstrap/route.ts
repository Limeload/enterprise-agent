import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { bootstrapWorkspace } from "@/lib/workspace"

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await bootstrapWorkspace(session.user.id, session.user.name)
  return NextResponse.json({ ok: true })
}
