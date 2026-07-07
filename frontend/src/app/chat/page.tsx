"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle } from "lucide-react"
import ChatInterface from "@/components/ChatInterface"
import AppNav from "@/components/AppNav"
import { useSession } from "@/lib/auth-client"
import { useCredits } from "@/lib/hooks"

export default function ChatPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const { credits } = useCredits()

  useEffect(() => {
    if (!isPending && !session) router.replace("/login")
  }, [session, isPending, router])

  if (isPending || !session) return null

  const pct = credits ? Math.round((credits.balance / credits.monthlyLimit) * 100) : 100
  const lowCredits = credits && pct < 20

  return (
    <div className="flex h-screen overflow-hidden">
      <AppNav />

      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Low-credit warning */}
        {lowCredits && (
          <div className="flex shrink-0 items-center gap-2 border-b border-cache-err/20 bg-cache-err/8 px-5 py-2 text-[12px] text-cache-err">
            <AlertTriangle size={13} />
            <span>
              Only <strong>{credits!.balance}</strong> credits remaining.{" "}
              <a href="/billing" className="underline underline-offset-2 hover:opacity-80">Upgrade to continue.</a>
            </span>
          </div>
        )}

        {/* Credit bar in header */}
        <div className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface-raised px-5 py-2.5">
          <p className="text-[12px] text-copy-muted">
            <span className="font-medium text-copy-primary">{credits?.balance ?? "—"}</span> / {credits?.monthlyLimit ?? "—"} credits
          </p>
          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-over">
            <div
              className={`h-full rounded-full transition-all ${pct > 50 ? "bg-cache-hit" : pct >= 20 ? "bg-cache-miss" : "bg-cache-err"}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        <ChatInterface />
      </main>
    </div>
  )
}
