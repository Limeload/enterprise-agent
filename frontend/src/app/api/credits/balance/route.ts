import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { getUserWorkspace } from "@/lib/session"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  if (!workspace?.credits) return NextResponse.json({ balance: 0, monthlyLimit: 0 })

  return NextResponse.json({
    balance: workspace.credits.balance,
    monthlyLimit: workspace.credits.monthlyLimit,
    resetDate: workspace.credits.resetDate,
  })
}
