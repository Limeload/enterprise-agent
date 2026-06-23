"use client";

const NODE_LABELS: Record<string, string> = {
  classify_intent:      "Classifying intent",
  select_sources:       "Selecting sources",
  validate_permissions: "Checking permissions",
  retrieve:             "Retrieving documents",
  plan:                 "Planning steps",
  execute_tools:        "Executing tools",
  generate_answer:      "Generating answer",
  validate_citations:   "Validating citations",
  log_audit:            "Logging",
};

interface Props {
  activeNode: string | null;
  completedNodes: string[];
}

export default function AgentStatus({ activeNode, completedNodes }: Props) {
  const nodes = Object.keys(NODE_LABELS);

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
      {nodes.map((node) => {
        const done = completedNodes.includes(node);
        const active = activeNode === node;
        return (
          <div key={node} className={`flex items-center gap-2 ${done ? "text-slate-400" : active ? "text-brand-600 font-medium" : "text-slate-300"}`}>
            <span className="w-4 text-center">
              {done ? "✓" : active ? "●" : "○"}
            </span>
            <span>{NODE_LABELS[node]}</span>
            {active && <span className="cursor-blink">_</span>}
          </div>
        );
      })}
    </div>
  );
}
