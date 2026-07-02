"use client";

import { ExternalLink } from "lucide-react";

const SOURCE_STYLE: Record<string, { dot: string; label: string }> = {
  github:     { dot: "bg-ink-900",      label: "GitHub" },
  notion:     { dot: "bg-ink-950",      label: "Notion" },
  slack:      { dot: "bg-purple-500",   label: "Slack" },
  hubspot:    { dot: "bg-orange-500",   label: "HubSpot" },
  jira:       { dot: "bg-blue-600",     label: "Jira" },
  confluence: { dot: "bg-blue-500",     label: "Confluence" },
  gmail:      { dot: "bg-red-500",      label: "Gmail" },
  linear:     { dot: "bg-violet-600",   label: "Linear" },
  salesforce: { dot: "bg-sky-600",      label: "Salesforce" },
  default:    { dot: "bg-ink-400",      label: "" },
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
      className={`group flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-3 transition-all hover:border-ink-200 hover:shadow-sm ${!citation.url ? "pointer-events-none" : ""}`}
    >
      {/* Coloured source dot */}
      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
            {style.label || citation.source}
          </span>
        </div>
        <p className="text-[13px] font-medium text-ink-900 truncate leading-snug">{citation.title}</p>
        {citation.excerpt && (
          <p className="mt-1 text-[12px] leading-snug text-ink-400 line-clamp-2">{citation.excerpt}</p>
        )}
      </div>

      {citation.url && (
        <ExternalLink
          size={12}
          className="mt-0.5 shrink-0 text-ink-200 group-hover:text-ink-500 transition-colors"
        />
      )}
    </a>
  );
}
