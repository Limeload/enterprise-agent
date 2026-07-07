"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Loader2, Zap, ExternalLink, AlertTriangle } from "lucide-react"
import AppNav from "@/components/AppNav"
import { useCredits } from "@/lib/hooks"

interface Txn {
  id: string
  action: string
  credits: number
  createdAt: string
}

const PLAN_TIERS = [
  { key: "FREE", name: "Free", price: "$0", credits: "100 credits/mo", features: ["3 connectors", "Community support"] },
  { key: "PRO", name: "Pro", price: "$49", credits: "2,000 credits/mo", features: ["10 connectors", "Approval gates", "Priority support"] },
  { key: "TEAM", name: "Team", price: "$199", credits: "10,000 credits/mo", features: ["Unlimited connectors", "25 seats", "Advanced analytics"] },
]

function creditColor(pct: number) {
  if (pct > 50) return "bg-cache-hit"
  if (pct >= 20) return "bg-cache-miss"
  return "bg-cache-err"
}

function BillingInner() {
  const searchParams = useSearchParams()
  const { credits, loading } = useCredits()
  const [plan, setPlan] = useState<string>("FREE")
  const [txns, setTxns] = useState<Txn[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/workspace").then(async (r) => {
      if (r.ok) {
        const d = await r.json()
        setPlan(d.plan ?? "FREE")
      }
    })
    fetch("/api/credits/transactions").then(async (r) => {
      if (r.ok) {
        const d = await r.json()
        setTxns(d.transactions ?? [])
      }
    })
  }, [])

  const checkout = async (tier: string) => {
    setBusy(tier)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: tier }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setBusy(null)
    } catch {
      setBusy(null)
    }
  }

  const openPortal = async () => {
    setBusy("portal")
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setBusy(null)
    } catch {
      setBusy(null)
    }
  }

  const balance = credits?.balance ?? 0
  const limit = credits?.monthlyLimit ?? 0
  const pct = limit > 0 ? Math.round((balance / limit) * 100) : 0
  const lowCredits = pct < 20

  return (
    <div className="flex h-screen bg-surface-base">
      <AppNav />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight text-copy-primary">Billing &amp; plan</h1>
            <p className="mt-1 text-[13px] text-copy-muted">Manage your subscription and credit balance.</p>
          </div>

          {searchParams.get("success") && (
            <div className="mb-5 rounded-lg border border-cache-hit/30 bg-cache-hit/10 px-4 py-3 text-[13px] text-cache-hit">
              Subscription updated. Your new credits are live.
            </div>
          )}

          {/* Current plan + credits */}
          <div className="mb-6 rounded-2xl border border-surface-border bg-surface-raised p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-copy-muted">Current plan</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="rounded-lg bg-bc-accent/10 px-2.5 py-1 text-[13px] font-semibold text-bc-accent">
                    {plan}
                  </span>
                </div>
              </div>
              <button
                onClick={openPortal}
                disabled={busy === "portal"}
                className="flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2 text-[12px] font-medium text-copy-secondary hover:border-bc-accent/40 hover:text-copy-primary transition-all disabled:opacity-50"
              >
                {busy === "portal" ? <Loader2 size={12} className="animate-spin" /> : <ExternalLink size={12} />}
                Manage billing
              </button>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex items-center justify-between text-[12px]">
                <span className="font-medium text-copy-secondary">Credits this cycle</span>
                <span className="text-copy-muted">
                  {loading ? "…" : `${balance.toLocaleString()} / ${limit.toLocaleString()}`}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-over">
                <div
                  className={`h-full rounded-full transition-all ${creditColor(pct)}`}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              {lowCredits && !loading && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-cache-err/30 bg-cache-err/10 px-3 py-2 text-[12px] text-cache-err">
                  <AlertTriangle size={13} />
                  You are running low on credits. Upgrade to keep the agent working.
                </div>
              )}
            </div>
          </div>

          {/* Plan tiers */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {PLAN_TIERS.map((tier) => {
              const current = tier.key === plan
              return (
                <div
                  key={tier.key}
                  className={`flex flex-col rounded-2xl border p-5 transition-all ${
                    current
                      ? "border-bc-accent bg-surface-raised shadow-bc-sm"
                      : "border-surface-border bg-surface-raised hover:border-bc-accent/30"
                  }`}
                >
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-copy-muted">{tier.name}</p>
                  <div className="mt-1 flex items-end gap-1">
                    <span className="text-[1.8rem] font-bold leading-none text-copy-primary">{tier.price}</span>
                    {tier.key !== "FREE" && <span className="mb-1 text-[12px] text-copy-muted">/mo</span>}
                  </div>
                  <p className="mt-1 text-[12px] font-medium text-bc-accent">{tier.credits}</p>
                  <ul className="mt-3 mb-4 flex flex-1 flex-col gap-1.5">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-[12px] text-copy-secondary">
                        <Check size={12} className="mt-0.5 shrink-0 text-cache-hit" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {current ? (
                    <div className="flex h-9 items-center justify-center rounded-lg bg-surface-over text-[12px] font-medium text-copy-muted">
                      Current plan
                    </div>
                  ) : tier.key === "FREE" ? (
                    <button
                      onClick={openPortal}
                      className="flex h-9 items-center justify-center rounded-lg border border-surface-border text-[12px] font-medium text-copy-secondary hover:border-bc-accent/40 transition-all"
                    >
                      Downgrade
                    </button>
                  ) : (
                    <button
                      onClick={() => checkout(tier.key)}
                      disabled={busy === tier.key}
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-bc-gradient text-[12px] font-semibold text-white hover:shadow-bc-glow hover:opacity-95 transition-all disabled:opacity-50"
                    >
                      {busy === tier.key ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                      Upgrade
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Usage table */}
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-copy-primary">Usage this month</h2>
            {txns.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-copy-muted">No usage yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-surface-border">
                <table className="w-full text-[12px]">
                  <thead className="bg-surface-over text-copy-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Action</th>
                      <th className="px-4 py-2 text-right font-medium">Credits</th>
                      <th className="px-4 py-2 text-right font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.slice(0, 20).map((t) => (
                      <tr key={t.id} className="border-t border-surface-border">
                        <td className="px-4 py-2 text-copy-primary">{t.action.replace(/_/g, " ")}</td>
                        <td className="px-4 py-2 text-right font-mono text-copy-secondary">-{t.credits}</td>
                        <td className="px-4 py-2 text-right text-copy-muted">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function BillingPage() {
  return (
    <Suspense fallback={null}>
      <BillingInner />
    </Suspense>
  )
}
