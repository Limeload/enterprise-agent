"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Loader2 } from "lucide-react";
import MessageList, { Message } from "./MessageList";
import { v4 as uuidv4 } from "crypto";

function genId() {
  return Math.random().toString(36).slice(2);
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(() => genId());
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const updateLastAssistantMessage = useCallback((updater: (msg: Message) => Message) => {
    setMessages((prev) => {
      const idx = [...prev].reverse().findIndex((m) => m.role === "assistant");
      if (idx === -1) return prev;
      const realIdx = prev.length - 1 - idx;
      const updated = [...prev];
      updated[realIdx] = updater(updated[realIdx]);
      return updated;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const query = input.trim();
      if (!query || isLoading) return;

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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: query, session_id: sessionId }),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

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
                updateLastAssistantMessage((msg) => ({
                  ...msg,
                  activeNode: event.node,
                  completedNodes: msg.completedNodes ?? [],
                }));
              } else if (event.type === "node_end") {
                updateLastAssistantMessage((msg) => ({
                  ...msg,
                  activeNode: null,
                  completedNodes: [...(msg.completedNodes ?? []), event.node],
                }));
              } else if (event.type === "answer_chunk") {
                updateLastAssistantMessage((msg) => ({
                  ...msg,
                  content: msg.content + (event.content ?? ""),
                }));
              } else if (event.type === "done") {
                updateLastAssistantMessage((msg) => ({
                  ...msg,
                  isStreaming: false,
                  activeNode: null,
                }));
              } else if (event.type === "citations") {
                updateLastAssistantMessage((msg) => ({
                  ...msg,
                  citations: event.citations ?? [],
                }));
              } else if (event.type === "metadata") {
                updateLastAssistantMessage((msg) => ({
                  ...msg,
                  intent: event.intent,
                  sources: event.sources_used,
                }));
              }
            } catch {
              // non-JSON line — skip
            }
          }
        }
      } catch (err) {
        updateLastAssistantMessage((msg) => ({
          ...msg,
          content: `Error: ${err instanceof Error ? err.message : "Unknown error"}`,
          isStreaming: false,
        }));
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [input, isLoading, sessionId, updateLastAssistantMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MessageList messages={messages} />

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 border-t border-slate-200 bg-white px-4 py-3"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about PRs, Slack threads, policies, customers..."
          rows={1}
          className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all"
          style={{ maxHeight: "120px", overflowY: "auto" }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
    </div>
  );
}
