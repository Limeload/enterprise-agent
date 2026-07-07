"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Check, Search, Zap, Lock, GitBranch, ChevronDown, Play } from "lucide-react";
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
    href: "/login",
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
    href: "/login",
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
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

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
            href="/login"
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
            href="/login"
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

      {/* ── Product video ── */}
      <section id="product" className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-12 text-center">
          <h2 className="text-[2.2rem] font-bold tracking-tight">
            See it in action.{" "}
            <span className="text-copy-muted font-normal text-[1.8rem]">It&apos;s shorter than a standup.</span>
          </h2>
          <p className="mt-3 text-[15px] text-copy-secondary">
            Thirty seconds. No sales pitch. Just the product doing its thing.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-surface-border shadow-[0_8px_40px_rgba(108,92,231,0.12)] bg-bc-navy aspect-video">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            src="/demo.mp4"
            poster="/demo-poster.png"
            onPlay={() => setPlaying(true)}
            onEnded={() => setPlaying(false)}
            controls={playing}
            playsInline
          />

          {!playing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-bc-navy/60 backdrop-blur-sm">
              <div className="mb-6 opacity-80">
                <BrainCacheLogo size={52} variant="mark" />
              </div>
              <button
                onClick={handlePlay}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-[0_0_40px_rgba(108,92,231,0.5)] hover:scale-105 transition-transform"
              >
                <Play size={22} className="text-bc-accent ml-1" fill="#6C5CE7" />
              </button>
              <p className="mt-4 text-[13px] font-medium text-white/80">Watch the 30-second demo</p>
            </div>
          )}
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
            href="/login"
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
