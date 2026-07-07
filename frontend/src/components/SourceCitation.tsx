"use client";

import { ExternalLink } from "lucide-react";

const SOURCE_STYLE: Record<string, { dot: string; label: string }> = {
  github:     { dot: "bg-copy-secondary",  label: "GitHub" },
  notion:     { dot: "bg-copy-primary",    label: "Notion" },
  slack:      { dot: "bg-bc-accent",       label: "Slack" },
  hubspot:    { dot: "bg-cache-miss",      label: "HubSpot" },
  jira:       { dot: "bg-bc-700",          label: "Jira" },
  confluence: { dot: "bg-bc-700",          label: "Confluence" },
  gmail:      { dot: "bg-cache-err",       label: "Gmail" },
  linear:     { dot: "bg-bc-accent",       label: "Linear" },
  salesforce: { dot: "bg-bc-700",          label: "Salesforce" },
  default:    { dot: "bg-surface-muted",   label: "" },
};

export interface Citation {
  source: string;
  title: string;
  url: string;
  excerpt: string;
}

export default function SourceCitation({ citation }: { citation: Citation }) {
  const style = SOURCE_STYLE[citation.source] ?? SOURCE_STYLE.default;

  return (
    <a
      href={citation.url || undefined}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-start gap-3 rounded-xl border border-surface-border bg-surface-over p-3 transition-all hover:border-bc-accent/30 hover:shadow-card ${!citation.url ? "pointer-events-none" : ""}`}
    >
      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-copy-muted">
            {style.label || citation.source}
          </span>
        </div>
        <p className="text-[13px] font-medium text-copy-primary truncate leading-snug">{citation.title}</p>
        {citation.excerpt && (
          <p className="mt-1 text-[12px] leading-snug text-copy-secondary line-clamp-2">{citation.excerpt}</p>
        )}
      </div>

      {citation.url && (
        <ExternalLink
          size={12}
          className="mt-0.5 shrink-0 text-copy-disabled group-hover:text-bc-violet transition-colors"
        />
      )}
    </a>
  );
}
