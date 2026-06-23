"use client";

import { ExternalLink } from "lucide-react";

const SOURCE_COLORS: Record<string, string> = {
  github:    "bg-slate-800 text-white",
  notion:    "bg-black text-white",
  slack:     "bg-purple-600 text-white",
  hubspot:   "bg-orange-500 text-white",
  jira:      "bg-blue-600 text-white",
  confluence:"bg-blue-500 text-white",
  gmail:     "bg-red-500 text-white",
  default:   "bg-slate-500 text-white",
};

export interface Citation {
  source: string;
  title: string;
  url: string;
  excerpt: string;
}

export default function SourceCitation({ citation }: { citation: Citation }) {
  const chip = SOURCE_COLORS[citation.source] ?? SOURCE_COLORS.default;

  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${chip}`}>
              {citation.source}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800 truncate">{citation.title}</p>
          {citation.excerpt && (
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{citation.excerpt}</p>
          )}
        </div>
        {citation.url && (
          <a
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-slate-400 hover:text-brand-600 transition-colors"
          >
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
