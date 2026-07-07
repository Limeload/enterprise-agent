import Stripe from "stripe"

// apiVersion is intentionally omitted so the installed Stripe SDK uses its own
// pinned default — avoids a literal-type mismatch across SDK upgrades.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  typescript: true,
})

export const PLANS = {
  FREE: { priceId: null, credits: 100, connectors: 3, users: 1 },
  PRO: { priceId: process.env.STRIPE_PRO_PRICE_ID, credits: 2000, connectors: 10, users: 5 },
  TEAM: { priceId: process.env.STRIPE_TEAM_PRICE_ID, credits: 10000, connectors: -1, users: 25 },
} as const
