import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"
import type { Plan } from "@prisma/client"

const PLAN_CREDITS: Record<string, number> = { FREE: 100, PRO: 2000, TEAM: 10000 }

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const { workspaceId, plan } = session.metadata ?? {}
    if (!workspaceId || !plan) return NextResponse.json({ ok: true })

    await prisma.subscription.update({
      where: { workspaceId },
      data: {
        stripeSubscriptionId: session.subscription as string,
        plan: plan as Plan,
        status: "ACTIVE",
      },
    })
    await prisma.workspace.update({ where: { id: workspaceId }, data: { plan: plan as Plan } })
    await prisma.credits.update({
      where: { workspaceId },
      data: { monthlyLimit: PLAN_CREDITS[plan] ?? 100, balance: PLAN_CREDITS[plan] ?? 100 },
    })
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription
    const subscription = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: sub.id },
    })
    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { plan: "FREE", status: "CANCELED" },
      })
      await prisma.workspace.update({
        where: { id: subscription.workspaceId },
        data: { plan: "FREE" },
      })
      await prisma.credits.update({
        where: { workspaceId: subscription.workspaceId },
        data: { monthlyLimit: 100, balance: 100 },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
