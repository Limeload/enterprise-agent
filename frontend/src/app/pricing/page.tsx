"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Loader2 } from "lucide-react"
import BrainCacheLogo from "@/components/BrainCacheLogo"
import { useUser } from "@clerk/nextjs"

const TIERS = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For solo explorers who are tired of Ctrl+F.",
    credits: "100 AI credits/month",
    features: [
      "3 connected tools",
      "100 documents indexed",
      "1 workspace user",
      "Basic RAG search",
      "Source citations",
    ],
    cta: "Get started free",
    highlighted: false,
  },
  {
    key: "PRO",
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For teams who've given up on manual searching.",
    credits: "2,000 AI credits/month",
    features: [
      "10 connected tools",
      "10,000 documents indexed",
      "5 workspace users",
      "Advanced agent workflows",
      "Priority model access",
      "Human approval gates",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
    badge: "Most popular",
  },
  {
    key: "TEAM",
    name: "Team",
    price: "$199",
    period: "per month",
    description: "For orgs that need audit trails and RBAC.",
    credits: "10,000 AI credits/month",
    features: [
      "Unlimited connected tools",
      "100,000 documents indexed",
      "25 workspace users",
      "RBAC & audit logs",
      "Admin analytics",
      "Priority support",
    ],
    cta: "Upgrade to Team",
    highlighted: false,
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom",
    period: "talk to us",
    description: "For orgs with trust issues. The healthy kind.",
    credits: "Custom credits",
    features: [
      "Everything in Team",
      "SSO / SAML",
      "Dedicated infrastructure",
      "99.9% uptime SLA",
      "Custom integrations",
      "On-premise option",
    ],
    cta: "Talk to sales",
    highlighted: false,
    href: "mailto:sales@braincache.ai",
  },
]

export default function PricingPage() {
  const { user: session } = useUser()
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (key: string) => {
    if (key === "FREE") {
      window.location.href = session ? "/chat" : "/login"
      return
    }
    if (key === "ENTERPRISE") {
      window.location.href = "mailto:sales@braincache.ai"
      return
    }
    if (!session) {
      window.location.href = "/login"
      return
    }
    setLoading(key)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: key }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-surface-base">
      {/* Nav */}
      <header className="border-b border-surface-border bg-surface-raised">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/"><BrainCacheLogo size={28} /></Link>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/chat" className="flex items-center gap-1.5 rounded-lg bg-bc-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 transition-all">
                Open app <ArrowRight size={13} />
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-[13px] text-copy-secondary hover:text-copy-primary transition-colors">Sign in</Link>
                <Link href="/login" className="flex items-center gap-1.5 rounded-lg bg-bc-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 transition-all">
                  Get started <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Header */}
        <div className="mb-14 text-center">
          <h1 className="text-[2.4rem] font-bold tracking-tight text-copy-primary">
            Simple, honest pricing.
          </h1>
          <p className="mt-3 text-[16px] text-copy-secondary">
            Start free. Upgrade when you need more. Cancel anytime.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <div
              key={tier.key}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                tier.highlighted
                  ? "border-bc-accent bg-surface-raised shadow-[0_0_0_1px_rgba(108,92,231,0.3),0_8px_32px_rgba(108,92,231,0.12)]"
                  : "border-surface-border bg-surface-raised hover:border-bc-accent/30 hover:shadow-card-hover"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-bc-gradient px-3 py-1 text-[11px] font-semibold text-white shadow-bc-sm">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-copy-muted">{tier.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-[2.2rem] font-bold leading-none text-copy-primary">{tier.price}</span>
                  {tier.price !== "Custom" && <span className="mb-1 text-[12px] text-copy-muted">/mo</span>}
                </div>
                <p className="mt-1 text-[11px] text-copy-muted">{tier.period}</p>
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-bc-accent/10 px-2.5 py-1 text-[11px] font-medium text-bc-accent">
                  ⚡ {tier.credits}
                </div>
                <p className="mt-2.5 text-[12px] leading-relaxed text-copy-secondary">{tier.description}</p>
              </div>

              <ul className="mb-6 flex flex-col gap-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12px] text-copy-secondary">
                    <Check size={13} className="mt-0.5 shrink-0 text-cache-hit" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <button
                  onClick={() => handleUpgrade(tier.key)}
                  disabled={loading === tier.key}
                  className={`flex h-10 w-full items-center justify-center rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50 ${
                    tier.highlighted
                      ? "bg-bc-gradient text-white hover:shadow-bc-glow hover:opacity-95"
                      : "border border-surface-border text-copy-primary hover:border-bc-accent/40 hover:text-bc-accent"
                  }`}
                >
                  {loading === tier.key ? <Loader2 size={14} className="animate-spin" /> : tier.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ line */}
        <p className="mt-12 text-center text-[13px] text-copy-muted">
          All plans include source-cited answers, AES-256 token encryption, and audit logs. Questions?{" "}
          <a href="mailto:hello@braincache.ai" className="text-bc-accent underline underline-offset-2 hover:opacity-80">Email us.</a>
        </p>
      </div>
    </div>
  )
}
