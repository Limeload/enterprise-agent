"use client";

import { useRef, useEffect } from "react";
import SourceCitation, { Citation } from "./SourceCitation";
import AgentStatus from "./AgentStatus";

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
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 animate-fade-in">
      <div className="text-center max-w-md">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-ink-100 bg-ink-50 text-ink-900 font-bold text-lg">
          EA
        </div>
        <h2 className="text-[22px] font-semibold tracking-tight text-ink-950">
          What do you need to know?
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-400">
          Ask anything across your connected tools — GitHub, Slack, Notion, Jira, HubSpot and more. Answers are cited to the source.
        </p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-2 sm:grid-cols-3">
        {EXAMPLE_PROMPTS.map(({ label, q }) => (
          <button
            key={q}
            onClick={() => onPrompt(q)}
            className="group flex flex-col items-start rounded-xl border border-ink-100 bg-ink-50 p-3.5 text-left transition-all hover:border-ink-200 hover:bg-white hover:shadow-sm active:scale-[0.98]"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400 group-hover:text-ink-600 transition-colors">
              {label}
            </span>
            <span className="mt-1 text-[12px] leading-snug text-ink-600 line-clamp-2">{q}</span>
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
            {/* Role label */}
            <div className={`mb-1.5 flex items-center gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-300">
                {msg.role === "user" ? "You" : "Agent"}
              </span>
            </div>

            {/* Agent pipeline status */}
            {msg.role === "assistant" && msg.isStreaming && (
              <div className="mb-2">
                <AgentStatus
                  activeNode={msg.activeNode ?? null}
                  completedNodes={msg.completedNodes ?? []}
                />
              </div>
            )}

            {/* Message bubble */}
            {msg.content && (
              <div
                className={
                  msg.role === "user"
                    ? "rounded-2xl rounded-tr-sm bg-ink-950 px-4 py-3 text-[14px] leading-relaxed text-white"
                    : "rounded-2xl rounded-tl-sm border border-ink-100 bg-white px-4 py-3 text-[14px] leading-relaxed text-ink-900 shadow-xs"
                }
              >
                <p className="whitespace-pre-wrap">
                  {msg.content}
                  {msg.isStreaming && msg.content && <span className="cursor-blink ml-0.5 text-ink-400">▋</span>}
                </p>
              </div>
            )}

            {/* Intent / sources metadata */}
            {msg.role === "assistant" && msg.intent && (
              <div className="mt-2 flex flex-wrap items-center gap-2 px-0.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-ink-100 bg-ink-50 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                  {msg.intent}
                </span>
                {msg.sources?.map((s) => (
                  <span key={s} className="inline-flex items-center rounded-full border border-ink-100 bg-ink-50 px-2 py-0.5 text-[10px] text-ink-400">
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Citations */}
            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-300">Sources</p>
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
