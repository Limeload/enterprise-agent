import { NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { getUserWorkspace } from "@/lib/session"
import { stripe } from "@/lib/stripe"

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  const customerId = workspace?.subscription?.stripeCustomerId
  if (!customerId) return NextResponse.json({ error: "No billing account" }, { status: 400 })

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.BETTER_AUTH_URL}/billing`,
  })

  return NextResponse.json({ url: portal.url })
}
