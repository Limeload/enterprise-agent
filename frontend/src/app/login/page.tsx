"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { login, signup } from "@/lib/api";
import BrainCacheLogo from "@/components/BrainCacheLogo";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, setSession } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sessionLoading && session) router.replace("/chat");
  }, [session, sessionLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const s = mode === "login"
        ? await login(email, password)
        : await signup(email, password);
      setSession(s);
      router.replace("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-base px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-bc-accent/8 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-bc-teal/6 blur-[100px]" />
      </div>

      <div className="relative w-full max-w-[400px] animate-fade-in">
        {/* Card */}
        <div className="rounded-2xl border border-surface-border bg-surface-raised p-8 shadow-card">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <BrainCacheLogo size={36} />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-[22px] font-semibold tracking-tight text-copy-primary">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1.5 text-[13px] text-copy-muted">
              {mode === "login"
                ? "Sign in to access Brain Cache."
                : "Get your workspace running in under a minute."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                minLength={6}
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
              className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-bc-gradient text-[14px] font-semibold text-white transition-all hover:shadow-bc-sm hover:opacity-95 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Sign in" : "Create account"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {mode === "signup" && (
            <p className="mt-4 text-center text-[11px] text-copy-muted">
              By signing up you agree to our{" "}
              <span className="underline underline-offset-2 cursor-pointer hover:text-bc-accent transition-colors">Terms</span>{" "}
              and{" "}
              <span className="underline underline-offset-2 cursor-pointer hover:text-bc-accent transition-colors">Privacy Policy</span>.
            </p>
          )}

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-surface-border" />
            <span className="text-[11px] text-copy-disabled">or</span>
            <div className="h-px flex-1 bg-surface-border" />
          </div>

          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            className="mt-4 w-full text-center text-[13px] text-copy-muted hover:text-copy-primary transition-colors"
          >
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span className="font-semibold text-bc-accent">
              {mode === "login" ? "Sign up free" : "Sign in"}
            </span>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-copy-disabled">
          &copy; {new Date().getFullYear()} Brain Cache &middot; Store Knowledge. Retrieve Intelligence.
        </p>
      </div>
    </div>
  );
}
