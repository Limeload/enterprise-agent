"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Plug2 } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import BrainCacheLogo from "@/components/BrainCacheLogo";
import { useAuth } from "@/lib/auth";

export default function ChatPage() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  if (loading || !session) return null;

  const email = session.email;
  const initials = email ? email.slice(0, 2).toUpperCase() : "BC";

  return (
    <main className="flex h-screen flex-col bg-surface-base">
      {/* ── Top navigation ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface-raised px-5 py-3">
        <BrainCacheLogo />

        <div className="flex items-center gap-2">
          <Link
            href="/connectors"
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-over px-3 py-1.5 text-[12px] font-medium text-copy-secondary hover:border-bc-accent/40 hover:text-copy-primary transition-all"
          >
            <Plug2 size={12} />
            Connectors
          </Link>

          <div
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-over pl-2 pr-1.5 py-1 cursor-pointer hover:border-bc-accent/40 transition-all group"
            onClick={() => signOut().then(() => router.replace("/"))}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-bc-gradient text-[9px] font-semibold text-white">
              {initials}
            </div>
            <span className="hidden sm:block text-[12px] font-medium text-copy-secondary max-w-[140px] truncate group-hover:text-copy-primary transition-colors">
              {email}
            </span>
            <LogOut size={11} className="text-copy-disabled group-hover:text-copy-secondary transition-colors ml-0.5" />
          </div>
        </div>
      </header>

      {/* ── Chat area ── */}
      <ChatInterface />
    </main>
  );
}
