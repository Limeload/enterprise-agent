"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Sparkles, Shield, Zap, Globe } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { login, signup } from "@/lib/api";

const FEATURES = [
  { icon: Sparkles, text: "Ask questions across GitHub, Slack, Notion, HubSpot and 28 more tools" },
  { icon: Shield, text: "Role-based access with human-in-the-loop approval for write actions" },
  { icon: Zap, text: "Streaming answers with cited sources — no hallucinations, no blind trust" },
  { icon: Globe, text: "Connect your own accounts in seconds — no code, no IT ticket needed" },
];

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
    if (!sessionLoading && session) router.replace("/");
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
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between bg-ink-950 px-16 py-12 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-ink-950 font-bold text-sm tracking-tight">
              EA
            </div>
            <span className="text-white font-semibold text-base tracking-tight">Enterprise Agent</span>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 max-w-sm">
          <h1 className="text-[2.6rem] font-semibold leading-[1.15] tracking-tight text-white">
            One place to ask.<br />
            Every tool answers.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-400">
            Stop hopping between 10 tabs to piece together an answer. Enterprise Agent connects your entire stack and gives you cited, accurate answers in seconds.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/10">
                  <Icon size={13} className="text-white/70" />
                </div>
                <p className="text-[13px] leading-relaxed text-ink-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom social proof */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {["A", "M", "S", "R"].map((l) => (
                <div key={l} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[11px] font-medium text-white ring-2 ring-ink-950">
                  {l}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-ink-400">Trusted by engineering, ops & revenue teams</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-white">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-950 text-white font-bold text-xs">EA</div>
          <span className="font-semibold text-ink-900 text-sm">Enterprise Agent</span>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-ink-950">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1.5 text-[14px] text-ink-400">
              {mode === "login"
                ? "Log in to access your enterprise knowledge agent."
                : "Set up your workspace in under a minute."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === "signup" && (
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-700">Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:border-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink-950/10 transition-all"
                  placeholder="Ada Lovelace"
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-ink-700">Work email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:border-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink-950/10 transition-all"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-medium text-ink-700">Password</label>
                {mode === "login" && (
                  <button type="button" className="text-[12px] text-ink-400 hover:text-ink-950 transition-colors">
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
                className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-950 placeholder:text-ink-400 focus:border-ink-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ink-950/10 transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-ink-950 text-[14px] font-medium text-white transition-all hover:bg-ink-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <>
                  {mode === "login" ? "Log in" : "Create account"}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          {mode === "signup" && (
            <p className="mt-4 text-center text-[12px] text-ink-400">
              By signing up you agree to our{" "}
              <span className="underline underline-offset-2 cursor-pointer hover:text-ink-950 transition-colors">Terms</span>{" "}
              and{" "}
              <span className="underline underline-offset-2 cursor-pointer hover:text-ink-950 transition-colors">Privacy Policy</span>.
            </p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-100" />
            <span className="text-[12px] text-ink-300">or</span>
            <div className="h-px flex-1 bg-ink-100" />
          </div>

          <button
            type="button"
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }}
            className="mt-4 w-full text-center text-[13px] text-ink-500 hover:text-ink-950 transition-colors"
          >
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span className="font-medium text-ink-950 underline underline-offset-2">
              {mode === "login" ? "Sign up free" : "Log in"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
