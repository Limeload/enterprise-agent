import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { getUserWorkspace } from "@/lib/session"
import { stripe, PLANS } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(session.user.id)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const { plan } = await request.json()
  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig?.priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  // Get or create Stripe customer
  let customerId = workspace.subscription?.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      name: session.user.name ?? undefined,
      metadata: { workspaceId: workspace.id },
    })
    customerId = customer.id
    await prisma.subscription.upsert({
      where: { workspaceId: workspace.id },
      create: {
        workspaceId: workspace.id,
        stripeCustomerId: customerId,
        plan: "FREE",
        status: "ACTIVE",
      },
      update: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${process.env.BETTER_AUTH_URL}/billing?success=true`,
    cancel_url: `${process.env.BETTER_AUTH_URL}/billing`,
    metadata: { workspaceId: workspace.id, plan },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
