"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Plug } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const { session, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [session, loading, router]);

  if (loading || !session) return null;

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white font-bold text-sm">
          EA
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900">Enterprise Agent</h1>
          <p className="text-xs text-slate-500">Knowledge · Engineering · Operations · Actions</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/connectors"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Plug size={12} /> Connectors
          </Link>
          <button
            onClick={() => signOut().then(() => router.replace("/login"))}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <LogOut size={12} /> Log out
          </button>
        </div>
      </header>
      <ChatInterface />
    </main>
  );
}
