"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Loader2, UserPlus, Trash2, Shield, Clock } from "lucide-react"
import AppNav from "@/components/AppNav"
import { useSession } from "@/lib/auth-client"

interface Member {
  id: string
  role: string
  createdAt: string
  user: { id: string; name: string | null; email: string }
}

interface AuditEntry {
  id: string
  action: string
  target: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

const ROLES = ["OWNER", "ADMIN", "MEMBER", "VIEWER"]

function roleColor(role: string) {
  if (role === "OWNER") return "bg-bc-accent/15 text-bc-accent"
  if (role === "ADMIN") return "bg-bc-700/15 text-bc-700"
  if (role === "MEMBER") return "bg-surface-over text-copy-secondary"
  return "bg-surface-over text-copy-muted"
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function SettingsPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("MEMBER")
  const [inviting, setInviting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [tab, setTab] = useState<"members" | "audit">("members")

  useEffect(() => {
    if (!isPending && !session) router.replace("/login")
  }, [session, isPending, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [membersRes, auditRes] = await Promise.all([
        fetch("/api/workspace/members"),
        fetch("/api/workspace/audit"),
      ])
      if (membersRes.ok) setMembers(await membersRes.json())
      if (auditRes.ok) setAuditLogs(await auditRes.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviting(true)
    try {
      const res = await fetch("/api/workspace/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      if (res.ok) {
        setNotice(`Invited ${inviteEmail}`)
        setInviteEmail("")
        await load()
      } else {
        const err = await res.json()
        setNotice(err.error ?? "Failed to invite")
      }
    } finally {
      setInviting(false)
      setTimeout(() => setNotice(null), 4000)
    }
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member?")) return
    await fetch(`/api/workspace/members?id=${memberId}`, { method: "DELETE" })
    await load()
  }

  if (isPending || !session) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <AppNav />

      <main className="flex flex-1 flex-col overflow-y-auto bg-surface-base">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <h1 className="text-[22px] font-semibold text-copy-primary mb-1">Workspace Settings</h1>
          <p className="text-[13px] text-copy-muted mb-8">Manage members, roles, and audit history.</p>

          {notice && (
            <div className="mb-6 rounded-xl border border-bc-accent/30 bg-bc-accent/10 px-4 py-3 text-[13px] text-bc-accent">
              {notice}
            </div>
          )}

          {/* Tab switcher */}
          <div className="mb-6 flex gap-1 rounded-xl border border-surface-border bg-surface-raised p-1 w-fit">
            {(["members", "audit"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-medium capitalize transition-all ${
                  tab === t ? "bg-bc-accent text-white shadow-bc-sm" : "text-copy-secondary hover:text-copy-primary"
                }`}
              >
                {t === "members" ? <Shield size={13} /> : <Clock size={13} />}
                {t}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-copy-disabled">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : tab === "members" ? (
            <>
              {/* Invite form */}
              <div className="mb-6 rounded-2xl border border-surface-border bg-surface-raised p-5">
                <h2 className="text-[14px] font-semibold text-copy-primary mb-4">Invite member</h2>
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 rounded-lg border border-surface-border bg-surface-over px-3.5 py-2 text-[13px] text-copy-primary placeholder:text-copy-disabled focus:border-bc-accent/60 focus:outline-none focus:ring-2 focus:ring-bc-accent/15 transition-all"
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="rounded-lg border border-surface-border bg-surface-over px-3 py-2 text-[13px] text-copy-primary focus:border-bc-accent/60 focus:outline-none transition-all"
                  >
                    {ROLES.filter(r => r !== "OWNER").map(r => (
                      <option key={r} value={r}>{r[0] + r.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex h-9 items-center gap-1.5 rounded-lg bg-bc-accent px-4 text-[13px] font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {inviting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                    Invite
                  </button>
                </form>
              </div>

              {/* Members table */}
              <div className="rounded-2xl border border-surface-border bg-surface-raised overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-surface-border bg-surface-over">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted">Member</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted">Role</span>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted">Joined</span>
                </div>
                {members.map((m) => (
                  <div key={m.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 border-b border-surface-border last:border-0 hover:bg-surface-over/50 transition-colors">
                    <div>
                      <p className="text-[13px] font-medium text-copy-primary">{m.user.name ?? m.user.email}</p>
                      <p className="text-[11px] text-copy-muted">{m.user.email}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${roleColor(m.role)}`}>
                      {m.role}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-copy-muted">{relativeTime(m.createdAt)}</span>
                      {m.role !== "OWNER" && m.user.id !== session.user.id && (
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="flex h-6 w-6 items-center justify-center rounded text-copy-disabled hover:bg-cache-err/10 hover:text-cache-err transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Audit log */
            <div className="rounded-2xl border border-surface-border bg-surface-raised overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-3 border-b border-surface-border bg-surface-over">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted">Action</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted">By</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted">When</span>
              </div>
              {auditLogs.length === 0 ? (
                <p className="px-5 py-8 text-center text-[13px] text-copy-muted">No audit events yet.</p>
              ) : auditLogs.map((log) => (
                <div key={log.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3 border-b border-surface-border last:border-0 hover:bg-surface-over/50 transition-colors">
                  <div>
                    <p className="text-[13px] font-mono text-copy-primary">{log.action}</p>
                    {log.target && <p className="text-[11px] text-copy-muted">{log.target}</p>}
                  </div>
                  <span className="text-[12px] text-copy-secondary">{log.user.name ?? log.user.email}</span>
                  <span className="text-[11px] text-copy-muted">{relativeTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
