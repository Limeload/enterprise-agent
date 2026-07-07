"use client"

import { useEffect, useState, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Loader2, Plug2, X, RefreshCw } from "lucide-react"
import AppNav from "@/components/AppNav"
import { CONNECTOR_META, CONNECTOR_CATEGORIES } from "@/lib/connectors/meta"

interface ConnectorRow {
  provider: string
  status: string
  scopes: string[]
  lastSyncedAt: string | null
  expiresAt: string | null
  updatedAt: string
}

function timeAgo(iso: string | null) {
  if (!iso) return "never"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function IntegrationsInner() {
  const searchParams = useSearchParams()
  const [rows, setRows] = useState<Record<string, ConnectorRow>>({})
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("All")
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const load = async () => {
    try {
      const res = await fetch("/api/connectors")
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, ConnectorRow> = {}
        for (const c of data.connectors ?? []) map[c.provider] = c
        setRows(map)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const connected = searchParams.get("connected")
    const error = searchParams.get("error")
    if (connected) {
      setNotice({ type: "success", text: `${connected.replace(/_/g, " ")} connected successfully.` })
    } else if (error) {
      setNotice({ type: "error", text: `Connection failed: ${error.replace(/_/g, " ")}.` })
    }
  }, [searchParams])

  const filtered = useMemo(
    () => (category === "All" ? CONNECTOR_META : CONNECTOR_META.filter((c) => c.category === category)),
    [category]
  )

  const disconnect = async (key: string) => {
    setBusy(key)
    try {
      await fetch(`/api/connectors/${key.toLowerCase()}/disconnect`, { method: "DELETE" })
      await load()
      setNotice({ type: "success", text: "Disconnected." })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex h-screen bg-surface-base">
      <AppNav />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8 animate-fade-in">
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight text-copy-primary">Integrations</h1>
            <p className="mt-1 text-[13px] text-copy-muted">
              Connect your stack. Brain Cache indexes and searches everything you authorize.
            </p>
          </div>

          {notice && (
            <div
              className={`mb-5 flex items-center justify-between rounded-lg border px-4 py-3 text-[13px] ${
                notice.type === "success"
                  ? "border-cache-hit/30 bg-cache-hit/10 text-cache-hit"
                  : "border-cache-err/30 bg-cache-err/10 text-cache-err"
              }`}
            >
              <span>{notice.text}</span>
              <button onClick={() => setNotice(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Category tabs */}
          <div className="mb-6 flex flex-wrap gap-2">
            {CONNECTOR_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all ${
                  category === cat
                    ? "bg-bc-accent/10 text-bc-accent"
                    : "border border-surface-border text-copy-secondary hover:border-bc-accent/40 hover:text-copy-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-copy-muted">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const row = rows[c.key]
                const connected = row?.status === "CONNECTED"
                const isBusy = busy === c.key
                return (
                  <div
                    key={c.key}
                    className="flex flex-col rounded-2xl border border-surface-border bg-surface-raised p-5 hover:border-bc-accent/30 hover:shadow-card transition-all"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-over text-[18px]">
                        {c.icon}
                      </div>
                      {connected && (
                        <span className="flex items-center gap-1 rounded-full bg-cache-hit/10 px-2 py-0.5 text-[10px] font-medium text-cache-hit">
                          <Check size={10} /> Connected
                        </span>
                      )}
                    </div>
                    <h3 className="text-[14px] font-semibold text-copy-primary">{c.name}</h3>
                    <p className="mt-1 flex-1 text-[12px] leading-relaxed text-copy-secondary">
                      {c.description}
                    </p>

                    {connected ? (
                      <div className="mt-4">
                        <p className="mb-2 text-[11px] text-copy-muted">
                          Last synced {timeAgo(row?.lastSyncedAt ?? row?.updatedAt ?? null)}
                        </p>
                        <button
                          onClick={() => disconnect(c.key)}
                          disabled={isBusy}
                          className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-surface-border text-[12px] font-medium text-copy-secondary hover:border-cache-err/40 hover:text-cache-err transition-all disabled:opacity-50"
                        >
                          {isBusy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <a
                        href={`/api/connectors/${c.key.toLowerCase()}/connect`}
                        className="mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-bc-accent text-[12px] font-semibold text-white hover:opacity-90 hover:shadow-bc-sm transition-all"
                      >
                        <Plug2 size={12} /> Connect
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8 flex items-center justify-center">
            <button
              onClick={() => {
                setLoading(true)
                load()
              }}
              className="flex items-center gap-1.5 text-[12px] text-copy-muted hover:text-copy-primary transition-colors"
            >
              <RefreshCw size={12} /> Refresh status
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsInner />
    </Suspense>
  )
}
