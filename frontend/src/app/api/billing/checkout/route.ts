import { NextRequest, NextResponse } from "next/server"
import { auth, currentUser } from "@clerk/nextjs/server"
import { getUserWorkspace } from "@/lib/session"
import { stripe, PLANS } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workspace = await getUserWorkspace(userId)
  if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 400 })

  const { plan } = await request.json()
  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig?.priceId) return NextResponse.json({ error: "Invalid plan" }, { status: 400 })

  let customerId = workspace.subscription?.stripeCustomerId
  if (!customerId) {
    const clerkUser = await currentUser()
    const customer = await stripe.customers.create({
      email: clerkUser?.emailAddresses[0]?.emailAddress,
      name: clerkUser?.fullName ?? undefined,
      metadata: { workspaceId: workspace.id, clerkUserId: userId },
    })
    customerId = customer.id
    await prisma.subscription.upsert({
      where: { workspaceId: workspace.id },
      create: { workspaceId: workspace.id, stripeCustomerId: customerId, plan: "FREE", status: "ACTIVE" },
      update: { stripeCustomerId: customerId },
    })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: planConfig.priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing`,
    metadata: { workspaceId: workspace.id, plan },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
