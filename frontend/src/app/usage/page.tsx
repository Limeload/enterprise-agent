"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import AppNav from "@/components/AppNav"
import { useCredits } from "@/lib/hooks"

interface Txn {
  id: string
  action: string
  credits: number
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  CHAT_SIMPLE: "bg-bc-accent",
  CHAT_RAG: "bg-bc-violet",
  CHAT_AGENT: "bg-bc-teal",
  DOCUMENT_INGEST: "bg-cache-miss",
  CONNECTOR_SYNC: "bg-cache-hit",
  REPORT_GENERATE: "bg-bc-600",
  ACTION_EXECUTE: "bg-cache-err",
}

export default function UsagePage() {
  const { credits, loading: creditsLoading } = useCredits()
  const [txns, setTxns] = useState<Txn[]>([])
  const [byAction, setByAction] = useState<Record<string, number>>({})
  const [used, setUsed] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/credits/transactions").then(async (r) => {
      if (r.ok) {
        const d = await r.json()
        setTxns(d.transactions ?? [])
        setByAction(d.byAction ?? {})
        setUsed(d.usedThisMonth ?? 0)
      }
      setLoading(false)
    })
  }, [])

  const balance = credits?.balance ?? 0
  const limit = credits?.monthlyLimit ?? 0
  const pct = limit > 0 ? Math.round(((limit - balance) / limit) * 100) : 0
  const maxAction = Math.max(1, ...Object.values(byAction))

  return (
    <div className="flex h-screen bg-surface-base">
      <AppNav />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight text-copy-primary">Usage</h1>
            <p className="mt-1 text-[13px] text-copy-muted">Track how your workspace spends credits.</p>
          </div>

          {/* Big number cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
              <p className="text-[12px] text-copy-muted">Credits used this month</p>
              <p className="mt-2 text-[2.2rem] font-bold leading-none text-copy-primary">
                {loading ? "…" : used.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
              <p className="text-[12px] text-copy-muted">Credits remaining</p>
              <p className="mt-2 text-[2.2rem] font-bold leading-none text-gradient">
                {creditsLoading ? "…" : balance.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
              <p className="text-[12px] text-copy-muted">Monthly limit</p>
              <p className="mt-2 text-[2.2rem] font-bold leading-none text-copy-primary">
                {creditsLoading ? "…" : limit.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6 rounded-2xl border border-surface-border bg-surface-raised p-6">
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span className="font-medium text-copy-secondary">Consumption</span>
              <span className="text-copy-muted">{pct}% used</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-over">
              <div className="h-full rounded-full bg-bc-gradient transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>

          {/* Breakdown by action */}
          <div className="mb-6 rounded-2xl border border-surface-border bg-surface-raised p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-copy-primary">Breakdown by action</h2>
            {loading ? (
              <div className="flex justify-center py-6 text-copy-muted">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : Object.keys(byAction).length === 0 ? (
              <p className="py-4 text-center text-[13px] text-copy-muted">No activity yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {Object.entries(byAction)
                  .sort((a, b) => b[1] - a[1])
                  .map(([action, credits]) => (
                    <div key={action}>
                      <div className="mb-1 flex items-center justify-between text-[12px]">
                        <span className="text-copy-secondary">{action.replace(/_/g, " ")}</span>
                        <span className="font-mono text-copy-muted">{credits}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-over">
                        <div
                          className={`h-full rounded-full ${ACTION_COLORS[action] ?? "bg-bc-accent"}`}
                          style={{ width: `${(credits / maxAction) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="rounded-2xl border border-surface-border bg-surface-raised p-6">
            <h2 className="mb-4 text-[15px] font-semibold text-copy-primary">Recent transactions</h2>
            {txns.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-copy-muted">No transactions yet.</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-surface-border">
                <table className="w-full text-[12px]">
                  <thead className="bg-surface-over text-copy-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">Action</th>
                      <th className="px-4 py-2 text-right font-medium">Credits</th>
                      <th className="px-4 py-2 text-right font-medium">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txns.slice(0, 30).map((t) => (
                      <tr key={t.id} className="border-t border-surface-border">
                        <td className="px-4 py-2 text-copy-primary">{t.action.replace(/_/g, " ")}</td>
                        <td className="px-4 py-2 text-right font-mono text-copy-secondary">-{t.credits}</td>
                        <td className="px-4 py-2 text-right text-copy-muted">
                          {new Date(t.createdAt).toLocaleString()}
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
