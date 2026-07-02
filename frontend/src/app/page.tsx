"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Plug2 } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  if (loading || !session) return null;

  const email = session.email;
  const initials = email ? email.slice(0, 2).toUpperCase() : "EA";

  return (
    <main className="flex h-screen flex-col bg-white">
      {/* ── Top navigation ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-ink-100 bg-white px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-950 text-white text-[11px] font-bold tracking-tight">
            EA
          </div>
          <div className="hidden sm:block">
            <span className="text-[13px] font-semibold text-ink-900 tracking-tight">Enterprise Agent</span>
            <span className="ml-2 text-[11px] text-ink-400">Beta</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/connectors"
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-[12px] font-medium text-ink-700 hover:bg-ink-50 hover:border-ink-300 transition-all"
          >
            <Plug2 size={12} />
            Connectors
          </Link>

          <div className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white pl-2 pr-1.5 py-1 cursor-pointer hover:bg-ink-50 hover:border-ink-300 transition-all group"
               onClick={() => signOut().then(() => router.replace("/login"))}>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-[9px] font-semibold text-white">
              {initials}
            </div>
            <span className="hidden sm:block text-[12px] font-medium text-ink-700 max-w-[140px] truncate">
              {email}
            </span>
            <LogOut size={11} className="text-ink-400 group-hover:text-ink-700 transition-colors ml-0.5" />
          </div>
        </div>
      </header>

      {/* ── Chat area ── */}
      <ChatInterface />
    </main>
  );
}
