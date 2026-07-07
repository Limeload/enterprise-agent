"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Check, Loader2 } from "lucide-react"
import BrainCacheLogo from "@/components/BrainCacheLogo"
import { useUser } from "@clerk/nextjs"

const USE_CASES = [
  { id: "engineering", label: "Engineering", desc: "GitHub, Jira, Linear, Confluence" },
  { id: "sales", label: "Sales & CRM", desc: "HubSpot, Salesforce, Zendesk" },
  { id: "operations", label: "Operations", desc: "Notion, Google Drive, Slack" },
  { id: "customer_success", label: "Customer Success", desc: "Zendesk, Intercom, Gmail" },
]

const CONNECTORS = [
  { key: "GITHUB", name: "GitHub", abbr: "GH", color: "bg-surface-muted text-copy-primary" },
  { key: "SLACK", name: "Slack", abbr: "Sl", color: "bg-bc-accent text-white" },
  { key: "NOTION", name: "Notion", abbr: "No", color: "bg-surface-over text-copy-primary" },
  { key: "GOOGLE_DRIVE", name: "Google Drive", abbr: "GD", color: "bg-bc-700 text-white" },
  { key: "JIRA", name: "Jira", abbr: "Ji", color: "bg-bc-700 text-white" },
  { key: "GMAIL", name: "Gmail", abbr: "Gm", color: "bg-cache-err text-white" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user: session } = useUser()
  const [step, setStep] = useState(0)
  const [workspaceName, setWorkspaceName] = useState(session?.fullName ? `${session.fullName}'s Workspace` : "My Workspace")
  const [useCase, setUseCase] = useState("")
  const [saving, setSaving] = useState(false)

  const steps = ["Workspace", "Use case", "Connect a tool", "Done"]

  const handleWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      })
    } finally {
      setSaving(false)
      setStep(1)
    }
  }

  const handleConnect = (key: string) => {
    window.location.href = `/api/connectors/${key.toLowerCase()}/connect`
  }

  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <BrainCacheLogo size={32} />
        </div>

        {/* Step indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold transition-all ${
                i < step ? "bg-cache-hit text-white" : i === step ? "bg-bc-accent text-white" : "bg-surface-over text-copy-muted"
              }`}>
                {i < step ? <Check size={11} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-8 ${i < step ? "bg-cache-hit" : "bg-surface-border"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card animate-fade-in">

          {/* Step 0: Workspace name */}
          {step === 0 && (
            <form onSubmit={handleWorkspace}>
              <h2 className="text-[20px] font-semibold text-copy-primary mb-1">Name your workspace</h2>
              <p className="text-[13px] text-copy-muted mb-6">This is how your team will identify your Brain Cache workspace.</p>
              <label className="mb-1.5 block text-[12px] font-medium text-copy-secondary">Workspace name</label>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-over px-3.5 py-2.5 text-sm text-copy-primary placeholder:text-copy-disabled focus:border-bc-accent/60 focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-bc-accent/15 transition-all mb-6"
                placeholder="Acme Corp"
              />
              <button type="submit" disabled={saving} className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-bc-gradient text-[14px] font-semibold text-white hover:shadow-bc-sm active:scale-[0.98] disabled:opacity-50 transition-all">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <><span>Continue</span><ArrowRight size={14} /></>}
              </button>
            </form>
          )}

          {/* Step 1: Use case */}
          {step === 1 && (
            <div>
              <h2 className="text-[20px] font-semibold text-copy-primary mb-1">What&apos;s your main use case?</h2>
              <p className="text-[13px] text-copy-muted mb-6">We&apos;ll suggest the most relevant integrations for you.</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {USE_CASES.map(({ id, label, desc }) => (
                  <button
                    key={id}
                    onClick={() => setUseCase(id)}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${
                      useCase === id
                        ? "border-bc-accent bg-bc-accent/5 shadow-bc-sm"
                        : "border-surface-border bg-surface-over hover:border-bc-accent/40"
                    }`}
                  >
                    <span className="text-[13px] font-semibold text-copy-primary">{label}</span>
                    <span className="mt-0.5 text-[11px] text-copy-muted">{desc}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(0)} className="flex h-10 items-center rounded-lg border border-surface-border px-4 text-[13px] text-copy-secondary hover:bg-surface-over transition-all">Back</button>
                <button onClick={() => setStep(2)} disabled={!useCase} className="flex flex-1 h-10 items-center justify-center gap-2 rounded-lg bg-bc-gradient text-[14px] font-semibold text-white hover:shadow-bc-sm disabled:opacity-40 transition-all">
                  Continue <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Connect first tool */}
          {step === 2 && (
            <div>
              <h2 className="text-[20px] font-semibold text-copy-primary mb-1">Connect your first tool</h2>
              <p className="text-[13px] text-copy-muted mb-6">Click to connect via OAuth — no tokens needed.</p>
              <div className="grid grid-cols-2 gap-2 mb-6">
                {CONNECTORS.map(({ key, name, abbr, color }) => (
                  <button
                    key={key}
                    onClick={() => handleConnect(key)}
                    className="flex items-center gap-2.5 rounded-xl border border-surface-border bg-surface-over p-3 text-left hover:border-bc-accent/40 hover:shadow-card-hover transition-all"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${color}`}>{abbr}</div>
                    <span className="text-[13px] font-medium text-copy-primary">{name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="flex h-10 items-center rounded-lg border border-surface-border px-4 text-[13px] text-copy-secondary hover:bg-surface-over transition-all">Back</button>
                <button onClick={() => setStep(3)} className="flex flex-1 h-10 items-center justify-center gap-1.5 rounded-lg border border-surface-border text-[13px] text-copy-secondary hover:bg-surface-over transition-all">
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-cache-hit/15">
                <Check size={28} className="text-cache-hit" />
              </div>
              <h2 className="text-[20px] font-semibold text-copy-primary mb-2">You&apos;re all set!</h2>
              <p className="text-[13px] text-copy-muted mb-8">
                Brain Cache is ready. Ask anything across your connected tools.
              </p>
              <button
                onClick={() => router.replace("/chat")}
                className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-bc-gradient text-[14px] font-semibold text-white hover:shadow-bc-sm transition-all"
              >
                Open Brain Cache <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
