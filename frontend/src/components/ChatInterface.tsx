"use client";

import { useState, useRef, useCallback } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import MessageList, { Message } from "./MessageList";
function genId() {
  return Math.random().toString(36).slice(2);
}

export default function ChatInterface() {
  const accessToken = null; // Clerk handles auth via middleware
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => genId());
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const updateLastAssistant = useCallback((updater: (msg: Message) => Message) => {
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.role === "assistant");
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      const updated = [...prev];
      updated[realIdx] = updater(updated[realIdx]);
      return updated;
    });
  }, []);

  const sendQuery = useCallback(
    async (query: string) => {
      if (!query.trim() || isLoading) return;

      setInput("");
      setIsLoading(true);

      const userMsg: Message = { id: genId(), role: "user", content: query };
      const assistantMsg: Message = {
        id: genId(),
        role: "assistant",
        content: "",
        isStreaming: true,
        activeNode: null,
        completedNodes: [],
        citations: [],
      };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({ message: query, session_id: sessionId }),
        });

        if (!res.ok) throw new Error(await res.text());

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No response stream");

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;
            try {
              const event = JSON.parse(raw);
              if (event.type === "node_start") {
                updateLastAssistant((m) => ({ ...m, activeNode: event.node, completedNodes: m.completedNodes ?? [] }));
              } else if (event.type === "node_end") {
                updateLastAssistant((m) => ({ ...m, activeNode: null, completedNodes: [...(m.completedNodes ?? []), event.node] }));
              } else if (event.type === "answer_chunk") {
                updateLastAssistant((m) => ({ ...m, content: m.content + (event.content ?? "") }));
              } else if (event.type === "done") {
                updateLastAssistant((m) => ({ ...m, isStreaming: false, activeNode: null }));
              } else if (event.type === "citations") {
                updateLastAssistant((m) => ({ ...m, citations: event.citations ?? [] }));
              } else if (event.type === "metadata") {
                updateLastAssistant((m) => ({ ...m, intent: event.intent, sources: event.sources_used }));
              }
            } catch { /* non-JSON line */ }
          }
        }
      } catch (err) {
        updateLastAssistant((m) => ({
          ...m,
          content: err instanceof Error ? err.message : "Something went wrong. Please try again.",
          isStreaming: false,
        }));
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    },
    [isLoading, sessionId, accessToken, updateLastAssistant]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendQuery(input.trim());
    },
    [input, sendQuery]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuery(input.trim());
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MessageList messages={messages} onPrompt={(q) => sendQuery(q)} />

      {/* ── Input bar ── */}
      <div className="shrink-0 border-t border-surface-border bg-surface-raised px-4 py-3 sm:px-8 sm:py-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl items-end gap-2 rounded-xl border border-surface-border bg-surface-over px-3 py-2 focus-within:border-bc-accent/40 focus-within:bg-surface-raised focus-within:shadow-card transition-all"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your company knowledge…"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[14px] text-copy-primary placeholder:text-copy-disabled focus:outline-none leading-relaxed"
            style={{ maxHeight: "160px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bc-accent text-white transition-all hover:opacity-90 hover:shadow-bc-sm active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <ArrowUp size={14} />}
          </button>
        </form>
        <p className="mt-2 text-center text-[11px] text-copy-disabled">
          Press <kbd className="rounded border border-surface-border px-1 py-px font-mono text-[10px]">↵</kbd> to send · <kbd className="rounded border border-surface-border px-1 py-px font-mono text-[10px]">⇧↵</kbd> for new line
        </p>
      </div>
    </div>
  );
}
