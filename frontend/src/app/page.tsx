import ChatInterface from "@/components/ChatInterface";

export default function Home() {
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
      </header>
      <ChatInterface />
    </main>
  );
}
