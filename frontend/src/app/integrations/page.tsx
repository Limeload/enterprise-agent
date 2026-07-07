"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Check,
  Loader2,
  Plug2,
  X,
  RefreshCw,
  AlertCircle,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import AppNav from "@/components/AppNav"
import ConnectorIcon from "@/components/ConnectorIcon"
import { CONNECTOR_META, CONNECTOR_CATEGORIES } from "@/lib/connectors/meta"
import { connectProvider, isNangoConfigured } from "@/lib/nango"

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectorRow {
  provider: string
  status: string
  scopes: string[]
  providerAccountEmail: string | null
  providerAccountId: string | null
  nangoConnectionId: string | null
  lastSyncedAt: string | null
  updatedAt: string
}

interface Notice {
  type: "success" | "error"
  text: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "never"
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Approval Dialog ──────────────────────────────────────────────────────────

interface ApprovalDialogProps {
  provider: string
  action: string
  onApprove: () => void
  onCancel: () => void
}

function ApprovalDialog({ provider, action, onApprove, onCancel }: ApprovalDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bc-accent/10">
            <ShieldCheck size={20} className="text-bc-accent" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-copy-primary">Approve Action</h3>
            <p className="text-[12px] text-copy-muted">{provider}</p>
          </div>
        </div>
        <p className="mb-2 text-[13px] text-copy-secondary">
          BrainCache is requesting permission to perform the following action:
        </p>
        <div className="mb-5 rounded-lg border border-surface-border bg-surface-base px-4 py-3 text-[13px] font-medium text-copy-primary">
          {action}
        </div>
        <p className="mb-5 text-[12px] text-copy-muted">
          BrainCache will never automatically send emails, delete files, modify CRM records, or
          merge pull requests. Your explicit approval is required.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-surface-border py-2 text-[13px] font-medium text-copy-secondary hover:border-bc-accent/40 hover:text-copy-primary transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onApprove}
            className="flex-1 rounded-lg bg-bc-accent py-2 text-[13px] font-semibold text-white hover:opacity-90 transition-all"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Connector Card ───────────────────────────────────────────────────────────

interface ConnectorCardProps {
  connector: (typeof CONNECTOR_META)[number]
  row: ConnectorRow | undefined
  busy: boolean
  onConnect: () => void
  onDisconnect: () => void
  onSync: () => void
}

function ConnectorCard({ connector: c, row, busy, onConnect, onDisconnect, onSync }: ConnectorCardProps) {
  const connected = row?.status === "CONNECTED"
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col rounded-2xl border border-surface-border bg-surface-raised p-5 hover:border-bc-accent/30 hover:shadow-card transition-all">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <ConnectorIcon connector={c} />
        {connected && (
          <span className="flex items-center gap-1 rounded-full bg-cache-hit/10 px-2 py-0.5 text-[10px] font-medium text-cache-hit">
            <Check size={10} /> Connected
          </span>
        )}
      </div>

      {/* Title + description */}
      <h3 className="text-[14px] font-semibold text-copy-primary">{c.name}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-copy-secondary">{c.description}</p>

      {/* Write badge */}
      {c.hasWriteActions && (
        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full border border-bc-accent/20 bg-bc-accent/5 px-2 py-0.5 text-[10px] text-bc-accent">
          <ShieldCheck size={9} /> Write actions require approval
        </span>
      )}

      {/* Connected state */}
      {connected ? (
        <div className="mt-4 space-y-2">
          {/* Account info */}
          {(row?.providerAccountEmail || row?.providerAccountId) && (
            <div className="rounded-lg border border-surface-border bg-surface-base px-3 py-2">
              <p className="text-[10px] text-copy-muted">Connected account</p>
              <p className="text-[12px] font-medium text-copy-primary truncate">
                {row?.providerAccountEmail ?? row?.providerAccountId}
              </p>
            </div>
          )}

          {/* Last synced */}
          <p className="text-[11px] text-copy-muted">
            Last synced {timeAgo(row?.lastSyncedAt ?? null)}
          </p>

          {/* Scopes toggle */}
          {row?.scopes && row.scopes.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-[11px] text-copy-muted hover:text-copy-primary transition-colors"
              >
                {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                Permissions ({row.scopes.length})
              </button>
              {expanded && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {row.scopes.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-copy-secondary"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onSync}
              disabled={busy}
              className="flex flex-1 h-8 items-center justify-center gap-1.5 rounded-lg border border-surface-border text-[12px] font-medium text-copy-secondary hover:border-bc-accent/40 hover:text-bc-accent transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Sync
            </button>
            <button
              onClick={onDisconnect}
              disabled={busy}
              className="flex flex-1 h-8 items-center justify-center gap-1.5 rounded-lg border border-surface-border text-[12px] font-medium text-copy-secondary hover:border-cache-err/40 hover:text-cache-err transition-all disabled:opacity-50"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onConnect}
          disabled={busy}
          className="mt-4 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-bc-accent text-[12px] font-semibold text-white hover:opacity-90 hover:shadow-bc-sm transition-all disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Plug2 size={12} />}
          Connect
        </button>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const { user } = useUser()
  const [rows, setRows] = useState<Record<string, ConnectorRow>>({})
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("All")
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const nangoReady = isNangoConfigured()
  const [approval, setApproval] = useState<{
    provider: string
    action: string
    resolve: (approved: boolean) => void
  } | null>(null)

  const load = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () => (category === "All" ? CONNECTOR_META : CONNECTOR_META.filter((c) => c.category === category)),
    [category]
  )

  // Generate a stable, unique Nango connection ID for this workspace+user+provider.
  // In production this should incorporate the workspace ID fetched from the API.
  const nangoConnectionId = (providerKey: string) =>
    `braincache_${user?.id ?? "anon"}_${providerKey.toLowerCase()}`

  const handleConnect = async (c: (typeof CONNECTOR_META)[number]) => {
    if (!user) return

    // Check Nango is configured before showing busy state
    if (!isNangoConfigured()) {
      setNotice({
        type: "error",
        text: "Nango is not configured. Add NEXT_PUBLIC_NANGO_PUBLIC_KEY to your .env.local file.",
      })
      return
    }

    setBusy(c.key)
    setNotice(null)
    try {
      const connectionId = nangoConnectionId(c.key)
      // nango.auth() opens the OAuth popup — must be the first await in this handler.
      // If the browser blocks the popup, instruct the user to allow popups.
      const result = await connectProvider(c.nangoProviderConfigKey, connectionId)

      const res = await fetch(`/api/connectors/${c.key.toLowerCase()}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nangoConnectionId: result.connectionId,
          scopes: c.scopes,
        }),
      })

      if (res.ok) {
        setNotice({ type: "success", text: `${c.name} connected successfully.` })
        await load()
      } else {
        setNotice({ type: "error", text: `Failed to save ${c.name} connection.` })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      // Ignore explicit user cancellations
      if (msg.includes("cancelled") || msg.includes("user_cancelled") || msg === "window_closed") {
        setBusy(null)
        return
      }
      // Surface popup blocking as an actionable message
      if (msg.includes("blocked") || msg.includes("popup") || msg.includes("window")) {
        setNotice({
          type: "error",
          text: `Popup blocked by browser. Allow popups for this site and try again.`,
        })
      } else if (msg === "NANGO_NOT_CONFIGURED") {
        setNotice({
          type: "error",
          text: "Nango is not configured. Add NEXT_PUBLIC_NANGO_PUBLIC_KEY to .env.local.",
        })
      } else {
        setNotice({ type: "error", text: `Could not connect ${c.name}: ${msg}` })
      }
    } finally {
      setBusy(null)
    }
  }

  const handleDisconnect = async (key: string) => {
    setBusy(key)
    try {
      await fetch(`/api/connectors/${key.toLowerCase()}/disconnect`, { method: "DELETE" })
      await load()
      setNotice({ type: "success", text: "Disconnected." })
    } finally {
      setBusy(null)
    }
  }

  const handleSync = async (key: string) => {
    setBusy(key)
    try {
      const res = await fetch(`/api/connectors/${key.toLowerCase()}/sync`, { method: "POST" })
      if (res.ok) {
        setNotice({ type: "success", text: "Sync complete." })
        await load()
      }
    } finally {
      setBusy(null)
    }
  }

  // Request human approval before performing a write action
  const requestApproval = (provider: string, action: string): Promise<boolean> =>
    new Promise((resolve) => {
      setApproval({ provider, action, resolve })
    })

  const handleApprovalResult = (approved: boolean) => {
    approval?.resolve(approved)
    setApproval(null)
  }

  return (
    <div className="flex h-screen bg-surface-base">
      {approval && (
        <ApprovalDialog
          provider={approval.provider}
          action={approval.action}
          onApprove={() => handleApprovalResult(true)}
          onCancel={() => handleApprovalResult(false)}
        />
      )}

      <AppNav />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-8 animate-fade-in">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-[22px] font-semibold tracking-tight text-copy-primary">
              Integrations
            </h1>
            <p className="mt-1 text-[13px] text-copy-muted">
              Connect your stack. BrainCache indexes and acts on everything you authorize via secure
              OAuth — no API keys required.
            </p>
          </div>

          {/* Nango not configured warning */}
          {!nangoReady && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-[13px] text-amber-600">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                <strong>Nango not configured.</strong> Add{" "}
                <code className="rounded bg-amber-400/20 px-1 py-0.5 text-[11px]">
                  NEXT_PUBLIC_NANGO_PUBLIC_KEY
                </code>{" "}
                to <code className="rounded bg-amber-400/20 px-1 py-0.5 text-[11px]">.env.local</code> to
                enable OAuth connections.{" "}
                <a
                  href="https://app.nango.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  Get your key at app.nango.dev →
                </a>
              </span>
            </div>
          )}

          {/* Notice banner */}
          {notice && (
            <div
              className={`mb-5 flex items-center justify-between rounded-lg border px-4 py-3 text-[13px] ${
                notice.type === "success"
                  ? "border-cache-hit/30 bg-cache-hit/10 text-cache-hit"
                  : "border-cache-err/30 bg-cache-err/10 text-cache-err"
              }`}
            >
              <span className="flex items-center gap-2">
                {notice.type === "error" ? <AlertCircle size={14} /> : <Check size={14} />}
                {notice.text}
              </span>
              <button onClick={() => setNotice(null)}>
                <X size={14} />
              </button>
            </div>
          )}

          {/* Category filter */}
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

          {/* Stats row */}
          {!loading && (
            <div className="mb-6 flex items-center gap-6 text-[12px] text-copy-muted">
              <span>
                <span className="font-semibold text-copy-primary">
                  {Object.values(rows).filter((r) => r.status === "CONNECTED").length}
                </span>{" "}
                connected
              </span>
              <span>
                <span className="font-semibold text-copy-primary">{CONNECTOR_META.length}</span>{" "}
                available
              </span>
            </div>
          )}

          {/* Cards grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-copy-muted">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <ConnectorCard
                  key={c.key}
                  connector={c}
                  row={rows[c.key]}
                  busy={busy === c.key}
                  onConnect={() => handleConnect(c)}
                  onDisconnect={() => handleDisconnect(c.key)}
                  onSync={() => handleSync(c.key)}
                />
              ))}
            </div>
          )}

          {/* Refresh */}
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

          {/* Security note */}
          <div className="mt-6 rounded-xl border border-surface-border bg-surface-raised p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck size={16} className="mt-0.5 flex-shrink-0 text-cache-hit" />
              <div>
                <p className="text-[12px] font-medium text-copy-primary">Secure OAuth via Nango</p>
                <p className="mt-0.5 text-[11px] text-copy-muted">
                  OAuth credentials are managed by Nango and never stored in BrainCache. Tokens are
                  refreshed automatically. Write actions (sending emails, creating tickets, posting
                  messages) always require your explicit approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
