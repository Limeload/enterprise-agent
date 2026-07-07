"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Github } from "lucide-react"
import { signIn, signUp, useSession } from "@/lib/auth-client"
import BrainCacheLogo from "@/components/BrainCacheLogo"

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!isPending && session) router.replace("/chat")
  }, [session, isPending, router])

  const handleOAuth = async (provider: "github" | "google") => {
    setOauthLoading(provider)
    setError(null)
    try {
      await signIn.social({ provider, callbackURL: "/api/workspace/bootstrap-redirect" })
    } catch {
      setError("OAuth sign-in failed. Try again.")
      setOauthLoading(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === "signup") {
        const res = await signUp.email({ email, password, name })
        if (res.error) throw new Error(res.error.message)
      } else {
        const res = await signIn.email({ email, password })
        if (res.error) throw new Error(res.error.message)
      }
      // Bootstrap workspace
      await fetch("/api/workspace/bootstrap", { method: "POST" })
      router.replace("/chat")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-bc-accent/8 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[400px] animate-fade-in">
        <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card">
          <div className="mb-8 flex justify-center">
            <BrainCacheLogo size={36} />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-[22px] font-semibold tracking-tight text-copy-primary">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1.5 text-[13px] text-copy-muted">
              {mode === "login" ? "Sign in to Brain Cache." : "Start for free — no credit card needed."}
            </p>
          </div>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-2.5 mb-5">
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
              className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-surface-border bg-surface-raised text-[13px] font-medium text-copy-primary hover:bg-surface-over hover:border-bc-accent/30 transition-all disabled:opacity-50"
            >
              {oauthLoading === "google" ? <Loader2 size={14} className="animate-spin" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              disabled={!!oauthLoading}
              className="flex h-10 w-full items-center justify-center gap-2.5 rounded-lg border border-surface-border bg-surface-raised text-[13px] font-medium text-copy-primary hover:bg-surface-over hover:border-bc-accent/30 transition-all disabled:opacity-50"
            >
              {oauthLoading === "github" ? <Loader2 size={14} className="animate-spin" /> : <Github size={14} />}
              Continue with GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1 bg-surface-border" />
            <span className="text-[11px] text-copy-disabled">or continue with email</span>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-[12px] font-medium text-copy-secondary">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-over px-3.5 py-2.5 text-sm text-copy-primary placeholder:text-copy-disabled focus:border-bc-accent/60 focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-bc-accent/15 transition-all"
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-copy-secondary">Work email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-over px-3.5 py-2.5 text-sm text-copy-primary placeholder:text-copy-disabled focus:border-bc-accent/60 focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-bc-accent/15 transition-all"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[12px] font-medium text-copy-secondary">Password</label>
                {mode === "login" && (
                  <button type="button" className="text-[11px] text-copy-muted hover:text-bc-accent transition-colors">
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-over px-3.5 py-2.5 text-sm text-copy-primary placeholder:text-copy-disabled focus:border-bc-accent/60 focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-bc-accent/15 transition-all"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-cache-err/30 bg-cache-err/10 px-3.5 py-2.5 text-[13px] text-cache-err">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-bc-gradient text-[14px] font-semibold text-white hover:shadow-bc-sm hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : (
                <>{mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null) }}
            className="mt-5 w-full text-center text-[13px] text-copy-muted hover:text-copy-primary transition-colors"
          >
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span className="font-semibold text-bc-accent">{mode === "login" ? "Sign up free" : "Sign in"}</span>
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] text-copy-disabled">
          &copy; {new Date().getFullYear()} Brain Cache · Store Knowledge. Retrieve Intelligence.
        </p>
      </div>
    </div>
  )
}
