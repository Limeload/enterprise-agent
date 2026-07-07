import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { stripe } from "@/lib/stripe"

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  const customerId = workspace?.subscription?.stripeCustomerId
  if (!customerId) return NextResponse.json({ error: "No billing account" }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/billing`,
  })

  return NextResponse.json({ url: portal.url })
}
