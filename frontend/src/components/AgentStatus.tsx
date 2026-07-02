"use client";

const NODES: { key: string; label: string }[] = [
  { key: "classify_intent",      label: "Classifying intent" },
  { key: "select_sources",       label: "Selecting sources" },
  { key: "validate_permissions", label: "Checking permissions" },
  { key: "retrieve",             label: "Retrieving documents" },
  { key: "plan",                 label: "Planning steps" },
  { key: "execute_tools",        label: "Executing tools" },
  { key: "generate_answer",      label: "Generating answer" },
  { key: "validate_citations",   label: "Validating citations" },
  { key: "log_audit",            label: "Logging" },
];

interface Props {
  activeNode: string | null;
  completedNodes: string[];
}

export default function AgentStatus({ activeNode, completedNodes }: Props) {
  const activeIdx = NODES.findIndex((n) => n.key === activeNode);
  const lastDone = NODES.reduce((acc, n, i) => completedNodes.includes(n.key) ? i : acc, -1);
  const showUpTo = Math.max(activeIdx, lastDone);

  if (showUpTo < 0 && !activeNode) return null;

  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-ink-100 bg-ink-50 p-3">
      {NODES.slice(0, showUpTo + 2).map((node) => {
        const done = completedNodes.includes(node.key);
        const active = activeNode === node.key;
        if (!done && !active && showUpTo < NODES.findIndex((n) => n.key === node.key)) return null;

        return (
          <div
            key={node.key}
            className={`flex items-center gap-2.5 py-0.5 text-[12px] transition-all ${
              done ? "text-ink-300" : active ? "text-ink-950 font-medium" : "text-ink-200"
            }`}
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center">
              {done ? (
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 text-ink-400">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : active ? (
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-ink-950 animate-pulse-dot" />
              ) : (
                <span className="inline-block h-1 w-1 rounded-full bg-ink-200" />
              )}
            </span>
            <span className="leading-none">{node.label}</span>
          </div>
        );
      })}
    </div>
  );
}
