import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace?.credits) return NextResponse.json({ balance: 0, monthlyLimit: 0 })

  return NextResponse.json({
    balance: workspace.credits.balance,
    monthlyLimit: workspace.credits.monthlyLimit,
    resetDate: workspace.credits.resetDate,
  })
}
