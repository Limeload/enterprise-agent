"use client";

import { useRef, useEffect } from "react";
import SourceCitation, { Citation } from "./SourceCitation";
import { BCMark } from "./BrainCacheLogo";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  intent?: string;
  sources?: string[];
  activeNode?: string | null;
  completedNodes?: string[];
  isStreaming?: boolean;
}

const EXAMPLE_PROMPTS = [
  { label: "Open P0 bugs",      q: "What are our open P0 bugs this sprint?" },
  { label: "Slack thread",      q: "Summarize last week's #eng-oncall Slack thread" },
  { label: "Notion roadmap",    q: "Find the product roadmap doc in Notion" },
  { label: "Churned customers", q: "Which customers churned this quarter in HubSpot?" },
  { label: "PR review",         q: "Show PRs waiting for review in our main repo" },
  { label: "Jira sprint",       q: "What's the status of the current Jira sprint?" },
];

function EmptyState({ onPrompt }: { onPrompt: (q: string) => void }) {
  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-hidden px-6 animate-fade-in">
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-bc-accent/5 blur-[80px]" />

      <div className="relative text-center max-w-md">
        <div className="mb-5 inline-flex">
          <BCMark size={48} />
        </div>
        <h2 className="text-[22px] font-semibold tracking-tight text-copy-primary">
          What can we dig up for you?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-copy-secondary">
          Brain Cache searches across all your connected tools so you don&apos;t have to open 12 tabs. GitHub, Slack, Notion, Jira, HubSpot and more. Every answer comes with a receipt.
        </p>
      </div>

      <div className="relative grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
        {EXAMPLE_PROMPTS.map(({ label, q }) => (
          <button
            key={q}
            onClick={() => onPrompt(q)}
            className="group flex flex-col items-start rounded-xl border border-surface-border bg-surface-raised p-3.5 text-left transition-all hover:border-bc-accent/40 hover:shadow-card-hover active:scale-[0.98]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-copy-muted group-hover:text-bc-violet transition-colors">
              {label}
            </span>
            <span className="mt-1 text-[12px] leading-snug text-copy-secondary line-clamp-2">{q}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function MessageList({
  messages,
  onPrompt,
}: {
  messages: Message[];
  onPrompt?: (q: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState onPrompt={onPrompt ?? (() => {})} />;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 sm:px-8">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          <div className={`max-w-2xl w-full ${msg.role === "user" ? "ml-16" : "mr-16"}`}>
            <div className={`mb-1.5 flex items-center gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-copy-disabled">
                {msg.role === "user" ? "You" : "Brain Cache"}
              </span>
            </div>

            {msg.content && (
              <div
                className={
                  msg.role === "user"
                    ? "rounded-2xl rounded-tr-sm bg-bc-accent px-4 py-3 text-[14px] leading-relaxed text-white"
                    : "rounded-2xl rounded-tl-sm border border-surface-border bg-surface-raised px-4 py-3 text-[14px] leading-relaxed text-copy-primary shadow-card"
                }
              >
                <p className="whitespace-pre-wrap">
                  {msg.content}
                  {msg.isStreaming && msg.content && <span className="cursor-blink ml-0.5 text-copy-disabled">▋</span>}
                </p>
              </div>
            )}

            {msg.role === "assistant" && msg.intent && (
              <div className="mt-2 flex flex-wrap items-center gap-2 px-0.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-bc-accent/20 bg-bc-accent/10 px-2 py-0.5 text-[10px] font-medium text-bc-violet">
                  {msg.intent}
                </span>
                {msg.sources?.map((s) => (
                  <span key={s} className="inline-flex items-center rounded-full border border-surface-border bg-surface-over px-2 py-0.5 text-[10px] text-copy-muted">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-copy-disabled">Sources</p>
                {msg.citations.map((c, i) => (
                  <SourceCitation key={i} citation={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
