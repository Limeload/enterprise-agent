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

export default function MessageList({ messages }: { messages: Message[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-4">
        <div className="text-4xl">🏢</div>
        <h2 className="text-xl font-semibold text-slate-700">Enterprise Knowledge Agent</h2>
        <p className="max-w-sm text-sm text-slate-500">
          Ask me anything about your company knowledge — GitHub PRs, Notion docs, Slack threads, HubSpot contacts, and more.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {[
            "What are our open P0 bugs?",
            "Summarize last week's #eng-oncall Slack thread",
            "Find the product roadmap doc in Notion",
            "Which customers churned this quarter?",
          ].map((q) => (
            <button
              key={q}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 hover:bg-brand-50 hover:border-brand-300 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-2xl w-full ${msg.role === "user" ? "ml-12" : "mr-12"}`}>
            {msg.role === "assistant" && msg.isStreaming && (
              <div className="mb-2">
                <AgentStatus
                  activeNode={msg.activeNode ?? null}
                  completedNodes={msg.completedNodes ?? []}
                />
              </div>
            )}

            <div
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand-600 text-white rounded-br-sm"
                  : "bg-white border border-slate-100 text-slate-800 rounded-bl-sm shadow-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">
                {msg.content}
                {msg.isStreaming && <span className="cursor-blink ml-0.5">▋</span>}
              </p>
            </div>

            {msg.role === "assistant" && msg.intent && (
              <div className="mt-1 flex items-center gap-2 px-1">
                <span className="text-[10px] text-slate-400">Intent: {msg.intent}</span>
                {msg.sources && msg.sources.length > 0 && (
                  <span className="text-[10px] text-slate-400">· Sources: {msg.sources.join(", ")}</span>
                )}
              </div>
            )}

            {msg.role === "assistant" && msg.citations && msg.citations.length > 0 && (
              <div className="mt-2 flex flex-col gap-1.5">
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
