"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Check, Search, Zap, Lock, GitBranch, ChevronDown } from "lucide-react";
import BrainCacheLogo from "@/components/BrainCacheLogo";

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    description: "For solo explorers who are tired of Ctrl+F.",
    features: [
      "Up to 3 connectors",
      "100 queries per month",
      "Source citations on every answer",
      "Community support",
    ],
    cta: "Start for free",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "per month",
    description: "For teams who have officially given up on manual searching.",
    features: [
      "Unlimited connectors",
      "Unlimited queries",
      "Human-approval gates on write actions",
      "Priority support (actual humans)",
      "Slack and email notifications",
      "Advanced usage analytics",
    ],
    cta: "Get started",
    href: "/signup",
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "talk to us",
    description: "For orgs with trust issues. The healthy kind.",
    features: [
      "Everything in Pro",
      "SSO / SAML",
      "Dedicated instance",
      "99.9% uptime SLA",
      "Custom integrations on request",
      "On-premise option",
    ],
    cta: "Talk to sales",
    href: "mailto:sales@braincache.ai",
    highlighted: false,
  },
];

const FEATURES = [
  {
    icon: Search,
    title: "Searches everything at once",
    body: "GitHub, Slack, Notion, Jira, HubSpot and 28 more. No tab switching, no asking Dave.",
  },
  {
    icon: Zap,
    title: "Answers in under a second",
    body: "Every response streams in real-time with citations attached. Hallucinations are not on the menu.",
  },
  {
    icon: Lock,
    title: "Approval gates on writes",
    body: "The agent asks before it acts. Role-based permissions for the people who like to sleep at night.",
  },
  {
    icon: GitBranch,
    title: "Multi-agent pipeline",
    body: "Classify, retrieve, plan, execute, cite. In that order, every time. No cowboy routing.",
  },
];

const STATS = [
  { value: "32+", label: "integrations" },
  { value: "<1s", label: "avg response" },
  { value: "100%", label: "source-cited" },
  { value: "0", label: "hallucinations allowed" },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-copy-primary">

      {/* ── Sticky nav ── */}
      <header className={`sticky top-0 z-50 bg-white transition-shadow duration-200 ${scrolled ? "shadow-sm border-b border-surface-border" : ""}`}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <BrainCacheLogo size={30} />
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-copy-secondary">
            <a href="#product" className="hover:text-copy-primary transition-colors">Product</a>
            <a href="#pricing" className="hover:text-copy-primary transition-colors">Pricing</a>
            <Link href="/login" className="hover:text-copy-primary transition-colors">Sign in</Link>
          </nav>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-lg bg-bc-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 hover:shadow-bc-sm transition-all"
          >
            Get started <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-bc-accent/20 bg-bc-accent/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cache-hit animate-pulse-dot" />
          <span className="text-[12px] font-medium text-bc-accent">AI that read your docs so you don&apos;t have to</span>
        </div>

        <h1 className="mx-auto max-w-3xl text-[3.6rem] font-bold leading-[1.08] tracking-tight">
          Your company&apos;s knowledge,{" "}
          <span className="text-gradient">
            actually organized.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-copy-secondary">
          Brain Cache indexes your entire stack so you can stop pestering Dave in Engineering.
          Ask anything in plain English, get cited answers in under a second.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-xl bg-bc-gradient px-6 py-3 text-[14px] font-semibold text-white shadow-bc-sm hover:shadow-bc-glow hover:opacity-95 transition-all"
          >
            Start for free <ArrowRight size={14} />
          </Link>
          <a
            href="#product"
            className="flex items-center gap-2 rounded-xl border border-surface-border px-6 py-3 text-[14px] font-medium text-copy-secondary hover:border-bc-accent/40 hover:text-copy-primary transition-all"
          >
            See how it works <ChevronDown size={14} />
          </a>
        </div>

        <p className="mt-4 text-[12px] text-copy-muted">No credit card required. Cancel whenever.</p>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-surface-border bg-surface-base py-10">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-[2rem] font-bold text-gradient leading-none">{value}</p>
                <p className="mt-1.5 text-[12px] text-copy-muted">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Product preview ── */}
      <section id="product" className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-[2.2rem] font-bold tracking-tight">
            See it in action.{" "}
            <span className="text-copy-muted font-normal text-[1.8rem]">No missing context, no tab shuffle.</span>
          </h2>
          <p className="mt-3 text-[15px] text-copy-secondary">
            Ask one question and get grounded answers across the tools your team already uses.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-surface-border bg-bc-navy shadow-[0_8px_40px_rgba(108,92,231,0.12)]">
          <div className="flex items-center gap-2 border-b border-white/10 bg-white/5 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-cache-err" />
            <span className="h-2.5 w-2.5 rounded-full bg-cache-miss" />
            <span className="h-2.5 w-2.5 rounded-full bg-cache-hit" />
            <span className="ml-3 text-[12px] font-medium text-white/60">Brain Cache workspace</span>
          </div>
          <div className="grid gap-0 md:grid-cols-[240px_1fr]">
            <aside className="border-b border-white/10 bg-white/[0.03] p-4 md:border-b-0 md:border-r">
              {["Slack", "GitHub", "Notion", "Jira"].map((source, idx) => (
                <div key={source} className="mb-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-white">{source}</span>
                    <span className="h-2 w-2 rounded-full bg-cache-hit" />
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-bc-accent" style={{ width: `${72 - idx * 9}%` }} />
                  </div>
                </div>
              ))}
            </aside>
            <div className="p-5 md:p-8">
              <div className="mb-5 rounded-xl bg-white px-4 py-3 text-[14px] font-medium text-copy-primary shadow-sm">
                What changed in the customer onboarding flow this week?
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <BrainCacheLogo size={28} variant="mark" />
                  <div>
                    <p className="text-[13px] font-semibold text-white">Synthesized answer</p>
                    <p className="text-[11px] text-white/55">Slack, GitHub, Notion, and Jira cited</p>
                  </div>
                </div>
                <p className="text-[14px] leading-relaxed text-white/82">
                  The team shipped workspace bootstrap, tightened connector permissions, and moved billing copy to the new credit model.
                  Two Jira tickets remain open around onboarding plan selection and document upload.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-3">
                  {["Slack thread", "GitHub PR", "Jira sprint"].map((item) => (
                    <div key={item} className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2">
                      <p className="text-[11px] font-medium text-white/80">{item}</p>
                      <p className="mt-1 text-[10px] text-white/45">source cited</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="bg-surface-base py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-14 text-center">
            <h2 className="text-[2.2rem] font-bold tracking-tight">
              Built for teams who hate searching.{" "}
              <span className="text-bc-accent">Which is everyone.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-surface-border bg-white p-6 hover:border-bc-accent/30 hover:shadow-card-hover transition-all"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-bc-accent/10 border border-bc-accent/15">
                  <Icon size={18} className="text-bc-accent" />
                </div>
                <h3 className="mb-2 text-[14px] font-semibold text-copy-primary">{title}</h3>
                <p className="text-[13px] leading-relaxed text-copy-secondary">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-[2.2rem] font-bold tracking-tight">
            Honest pricing.{" "}
            <span className="text-copy-muted font-normal">No hidden fees, no surprise invoices.</span>
          </h2>
          <p className="mt-3 text-[15px] text-copy-secondary">
            Start free. Upgrade when you&apos;ve run out of excuses to keep searching manually.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {PRICING.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 transition-all ${
                tier.highlighted
                  ? "border-bc-accent bg-white shadow-[0_0_0_1px_rgba(108,92,231,0.3),0_8px_32px_rgba(108,92,231,0.12)]"
                  : "border-surface-border bg-white hover:border-bc-accent/30 hover:shadow-card-hover"
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-bc-gradient px-3 py-1 text-[11px] font-semibold text-white shadow-bc-sm">
                    {tier.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <p className="text-[13px] font-semibold uppercase tracking-wider text-copy-muted">{tier.name}</p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-[2.6rem] font-bold leading-none text-copy-primary">{tier.price}</span>
                  {tier.price !== "Custom" && (
                    <span className="mb-1 text-[13px] text-copy-muted">/ mo</span>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-copy-muted">{tier.period}</p>
                <p className="mt-3 text-[13px] leading-relaxed text-copy-secondary">{tier.description}</p>
              </div>

              <ul className="mb-8 flex flex-col gap-2.5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13px] text-copy-secondary">
                    <Check size={14} className="mt-0.5 shrink-0 text-cache-hit" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  href={tier.href}
                  className={`flex h-11 w-full items-center justify-center rounded-xl text-[13px] font-semibold transition-all ${
                    tier.highlighted
                      ? "bg-bc-gradient text-white hover:shadow-bc-glow hover:opacity-95"
                      : "border border-surface-border text-copy-primary hover:border-bc-accent/40 hover:text-bc-accent"
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="bg-bc-navy py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-[2.2rem] font-bold text-white leading-tight">
            Your knowledge base is already in there.<br />
            <span className="text-gradient">You just can&apos;t find it.</span>
          </h2>
          <p className="mt-4 text-[15px] text-white/60">
            Brain Cache fixes that. No PhD in search required.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-[14px] font-semibold text-bc-accent hover:shadow-[0_0_32px_rgba(255,255,255,0.3)] transition-all"
          >
            Get started for free <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-surface-border bg-white py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <BrainCacheLogo size={26} />
          <p className="text-[12px] text-copy-muted">
            &copy; {new Date().getFullYear()} Brain Cache. Store Knowledge. Retrieve Intelligence.
          </p>
          <div className="flex items-center gap-5 text-[12px] text-copy-muted">
            <Link href="/login" className="hover:text-copy-primary transition-colors">Sign in</Link>
            <a href="mailto:hello@braincache.ai" className="hover:text-copy-primary transition-colors">Contact</a>
            <span className="cursor-pointer hover:text-copy-primary transition-colors">Privacy</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
