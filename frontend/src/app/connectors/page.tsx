"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Key, Loader2, Unlink, X, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import BrainCacheLogo from "@/components/BrainCacheLogo";
import {
  disconnectConnector,
  getConnectorStatuses,
  submitApiKey,
  type ConnectorStatus,
} from "@/lib/api";

interface ConnectorMeta {
  label: string;
  hint: string;
  placeholder: string;
  color: string;
  textColor: string;
  abbr: string;
  category: string;
}

const META: Record<string, ConnectorMeta> = {
  github:           { label: "GitHub",           abbr: "GH", color: "bg-surface-muted",   textColor: "text-copy-primary",  hint: "Personal Access Token (repo, read:org scopes)",           placeholder: "ghp_...",           category: "Engineering" },
  notion:           { label: "Notion",           abbr: "No", color: "bg-surface-over",     textColor: "text-copy-primary",  hint: "Internal Integration Token",                              placeholder: "secret_...",        category: "Knowledge" },
  slack:            { label: "Slack",            abbr: "Sl", color: "bg-bc-accent",        textColor: "text-white",         hint: "Bot User OAuth Token",                                    placeholder: "xoxb-...",          category: "Communication" },
  hubspot:          { label: "HubSpot",          abbr: "HS", color: "bg-cache-miss",       textColor: "text-white",         hint: "Private App Access Token",                                placeholder: "pat-...",           category: "CRM" },
  gmail:            { label: "Gmail",            abbr: "Gm", color: "bg-cache-err",        textColor: "text-white",         hint: "OAuth refresh token",                                     placeholder: "ya29...",           category: "Communication" },
  google_drive:     { label: "Google Drive",     abbr: "GD", color: "bg-bc-700",           textColor: "text-white",         hint: "OAuth refresh token or service account key",              placeholder: "ya29...",           category: "Knowledge" },
  confluence:       { label: "Confluence",       abbr: "Cf", color: "bg-bc-700",           textColor: "text-white",         hint: "API token (Atlassian account)",                           placeholder: "ATATT...",          category: "Knowledge" },
  sharepoint:       { label: "SharePoint",       abbr: "SP", color: "bg-bc-700",           textColor: "text-white",         hint: "Azure AD app client secret",                              placeholder: "",                  category: "Knowledge" },
  gitlab:           { label: "GitLab",           abbr: "GL", color: "bg-cache-miss",       textColor: "text-white",         hint: "Personal or project access token",                        placeholder: "glpat-...",         category: "Engineering" },
  bitbucket:        { label: "Bitbucket",        abbr: "BB", color: "bg-bc-700",           textColor: "text-white",         hint: "App password or OAuth token",                             placeholder: "",                  category: "Engineering" },
  jira:             { label: "Jira",             abbr: "Ji", color: "bg-bc-700",           textColor: "text-white",         hint: "API token (Atlassian account)",                           placeholder: "ATATT...",          category: "Engineering" },
  linear:           { label: "Linear",           abbr: "Li", color: "bg-bc-accent",        textColor: "text-white",         hint: "Personal API key",                                        placeholder: "lin_api_...",       category: "Engineering" },
  azure_devops:     { label: "Azure DevOps",     abbr: "Az", color: "bg-bc-700",           textColor: "text-white",         hint: "Personal Access Token",                                   placeholder: "",                  category: "Engineering" },
  salesforce:       { label: "Salesforce",       abbr: "SF", color: "bg-bc-700",           textColor: "text-white",         hint: "Connected app OAuth refresh token",                       placeholder: "",                  category: "CRM" },
  zendesk:          { label: "Zendesk",          abbr: "Zd", color: "bg-cache-hit",        textColor: "text-white",         hint: "API token",                                               placeholder: "",                  category: "CRM" },
  intercom:         { label: "Intercom",         abbr: "In", color: "bg-bc-700",           textColor: "text-white",         hint: "Access token",                                            placeholder: "",                  category: "CRM" },
  freshdesk:        { label: "Freshdesk",        abbr: "Fd", color: "bg-cache-hit",        textColor: "text-white",         hint: "API key",                                                 placeholder: "",                  category: "CRM" },
  google_calendar:  { label: "Google Calendar",  abbr: "GC", color: "bg-bc-700",           textColor: "text-white",         hint: "OAuth refresh token",                                     placeholder: "ya29...",           category: "Productivity" },
  outlook_calendar: { label: "Outlook Calendar", abbr: "OC", color: "bg-bc-700",           textColor: "text-white",         hint: "Azure AD OAuth refresh token",                            placeholder: "",                  category: "Productivity" },
  asana:            { label: "Asana",            abbr: "As", color: "bg-cache-err",        textColor: "text-white",         hint: "Personal access token",                                   placeholder: "",                  category: "Productivity" },
  monday:           { label: "Monday.com",       abbr: "Mo", color: "bg-cache-miss",       textColor: "text-white",         hint: "Personal API token",                                      placeholder: "",                  category: "Productivity" },
  trello:           { label: "Trello",           abbr: "Tr", color: "bg-bc-700",           textColor: "text-white",         hint: "API key + token — paste as key:token",                    placeholder: "key:token",         category: "Productivity" },
  snowflake:        { label: "Snowflake",        abbr: "Sn", color: "bg-bc-700",           textColor: "text-white",         hint: "User:password@account connection string",                 placeholder: "",                  category: "Data" },
  bigquery:         { label: "BigQuery",         abbr: "BQ", color: "bg-bc-700",           textColor: "text-white",         hint: "Service account JSON key (paste full JSON)",              placeholder: "{...}",             category: "Data" },
  databricks:       { label: "Databricks",       abbr: "Db", color: "bg-cache-err",        textColor: "text-white",         hint: "Personal access token",                                   placeholder: "dapi...",           category: "Data" },
  redshift:         { label: "Redshift",         abbr: "Rs", color: "bg-cache-err",        textColor: "text-white",         hint: "Connection string",                                       placeholder: "postgresql://...",  category: "Data" },
  postgres:         { label: "PostgreSQL",       abbr: "Pg", color: "bg-bc-600",           textColor: "text-white",         hint: "Connection string",                                       placeholder: "postgresql://...",  category: "Data" },
  mysql:            { label: "MySQL",            abbr: "My", color: "bg-bc-700",           textColor: "text-white",         hint: "Connection string",                                       placeholder: "mysql://...",       category: "Data" },
  microsoft_teams:  { label: "Microsoft Teams",  abbr: "MS", color: "bg-bc-accent",        textColor: "text-white",         hint: "Azure AD OAuth token",                                    placeholder: "",                  category: "Communication" },
  dropbox:          { label: "Dropbox",          abbr: "Dx", color: "bg-bc-700",           textColor: "text-white",         hint: "OAuth access token",                                      placeholder: "",                  category: "Knowledge" },
  box:              { label: "Box",              abbr: "Bx", color: "bg-bc-700",           textColor: "text-white",         hint: "Developer token",                                         placeholder: "",                  category: "Knowledge" },
  onedrive:         { label: "OneDrive",         abbr: "OD", color: "bg-bc-700",           textColor: "text-white",         hint: "Azure AD OAuth token",                                    placeholder: "",                  category: "Knowledge" },
};

function meta(source: string): ConnectorMeta {
  return META[source] ?? { label: source, abbr: source.slice(0, 2).toUpperCase(), color: "bg-surface-muted", textColor: "text-white", hint: "Paste your API token", placeholder: "", category: "Other" };
}

// ── API Key Modal ──────────────────────────────────────────────────────────

function ApiKeyModal({ source, onSubmit, onClose }: {
  source: string;
  onSubmit: (key: string) => Promise<void>;
  onClose: () => void;
}) {
  const m = meta(source);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(value.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save token");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-in rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-card">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${m.color} ${m.textColor}`}>
              {m.abbr}
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-copy-primary">Connect {m.label}</h2>
              <p className="text-[12px] text-copy-muted">{m.hint}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-copy-disabled hover:text-copy-secondary transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-copy-secondary">API token or secret</label>
            <input
              type="password"
              required
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={m.placeholder || "Paste your token here"}
              className="w-full rounded-lg border border-surface-border bg-surface-over px-3.5 py-2.5 font-mono text-[13px] text-copy-primary placeholder:text-copy-disabled focus:border-bc-accent/60 focus:outline-none focus:ring-2 focus:ring-bc-accent/20 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-cache-err/30 bg-cache-err/10 px-3 py-2 text-[12px] text-cache-err">
              <AlertCircle size={13} /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={submitting || !value.trim()}
              className="flex flex-1 h-9 items-center justify-center gap-2 rounded-lg bg-bc-gradient text-[13px] font-medium text-white hover:shadow-bc-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Key size={13} />}
              Save & Connect
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 items-center rounded-lg border border-surface-border px-4 text-[13px] text-copy-secondary hover:bg-surface-over hover:text-copy-primary transition-all"
            >
              Cancel
            </button>
          </div>
        </form>

        <p className="mt-4 text-[11px] text-copy-disabled">
          Your token is encrypted at rest and only ever used to make API calls on your behalf.
        </p>
      </div>
    </div>
  );
}

// ── Connector Card ──────────────────────────────────────────────────────────

function ConnectorCard({
  connector,
  onConnect,
  onDisconnect,
  pending,
}: {
  connector: ConnectorStatus;
  onConnect: (s: string) => void;
  onDisconnect: (s: string) => void;
  pending: string | null;
}) {
  const m = meta(connector.source);
  const isBusy = pending === connector.source;

  return (
    <div
      className={`group relative flex flex-col gap-3 rounded-xl border p-4 transition-all ${
        connector.connected
          ? "border-cache-hit/30 bg-surface-raised shadow-card"
          : connector.accessible
          ? "border-surface-border bg-surface-raised hover:border-bc-accent/30 hover:shadow-card-hover"
          : "border-surface-border bg-surface-raised opacity-40"
      }`}
    >
      {connector.connected && (
        <div className="absolute right-3 top-3">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cache-hit/15">
            <CheckCircle2 size={11} className="text-cache-hit" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold ${m.color} ${m.textColor}`}>
          {m.abbr}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-copy-primary leading-tight">{m.label}</p>
          <p className="text-[11px] text-copy-muted">{m.category}</p>
        </div>
      </div>

      <p className="text-[11px] leading-snug text-copy-secondary line-clamp-2">
        {connector.connected
          ? "Connected — agent can search and act on your behalf."
          : connector.accessible
          ? m.hint
          : "Not available for your current role."}
      </p>

      {connector.accessible && (
        <div className="mt-auto">
          {connector.connected ? (
            <button
              onClick={() => onDisconnect(connector.source)}
              disabled={isBusy}
              className="flex w-full h-8 items-center justify-center gap-1.5 rounded-lg border border-surface-border text-[12px] font-medium text-copy-secondary hover:border-cache-err/40 hover:text-cache-err transition-all disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={11} className="animate-spin" /> : <Unlink size={11} />}
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => onConnect(connector.source)}
              disabled={isBusy}
              className="flex w-full h-8 items-center justify-center gap-1.5 rounded-lg bg-bc-accent text-[12px] font-medium text-white hover:shadow-bc-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isBusy ? <Loader2 size={11} className="animate-spin" /> : <Key size={11} />}
              Connect
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

const CATEGORIES = ["Engineering", "Knowledge", "CRM", "Communication", "Productivity", "Data"];

export default function ConnectorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading: sessionLoading, accessToken } = useAuth();
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !session) router.replace("/login");
  }, [session, sessionLoading, router]);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try { setConnectors(await getConnectorStatuses(accessToken)); }
    finally { setLoading(false); }
  }, [accessToken]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    const source = searchParams.get("source");
    const status = searchParams.get("status");
    if (source && status) {
      setNotice({ text: status === "connected" ? `${meta(source).label} connected.` : `Couldn't connect ${meta(source).label}.`, ok: status === "connected" });
      refresh();
    }
  }, [searchParams, refresh]);

  const handleApiKeySubmit = async (source: string, key: string) => {
    if (!accessToken) return;
    await submitApiKey(source, key, accessToken);
    setModal(null);
    setNotice({ text: `${meta(source).label} connected successfully.`, ok: true });
    await refresh();
  };

  const handleDisconnect = async (source: string) => {
    if (!accessToken) return;
    setPending(source);
    try {
      await disconnectConnector(source, accessToken);
      await refresh();
      setNotice({ text: `${meta(source).label} disconnected.`, ok: true });
    } finally { setPending(null); }
  };

  const connected = connectors.filter((c) => c.connected);
  const displayed = activeCategory
    ? connectors.filter((c) => meta(c.source).category === activeCategory)
    : connectors;

  return (
    <>
      {modal && (
        <ApiKeyModal
          source={modal}
          onSubmit={(key) => handleApiKeySubmit(modal, key)}
          onClose={() => setModal(null)}
        />
      )}

      <div className="min-h-screen bg-surface-base">
        {/* ── Top bar ── */}
        <header className="flex items-center gap-3 border-b border-surface-border bg-surface-raised px-6 py-4">
          <Link href="/chat" className="flex items-center gap-2 text-[13px] text-copy-muted hover:text-copy-primary transition-colors">
            <ArrowLeft size={14} /> Back to chat
          </Link>
          <div className="mx-2 h-4 w-px bg-surface-border" />
          <BrainCacheLogo />
          <span className="text-[13px] font-medium text-copy-muted">/ Connectors</span>
        </header>

        <div className="mx-auto max-w-5xl px-6 py-8">
          {/* ── Header ── */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-copy-primary">Your integrations</h1>
            <p className="mt-1.5 text-[14px] text-copy-secondary">
              Connect your own accounts — Brain Cache uses your credentials to search and act on your behalf.
            </p>

            <div className="mt-5 flex items-center gap-6">
              <div className="flex items-center gap-2 text-[13px] text-copy-secondary">
                <CheckCircle2 size={14} className="text-cache-hit" />
                <span className="font-semibold text-copy-primary">{connected.length}</span> connected
              </div>
              <div className="flex items-center gap-2 text-[13px] text-copy-muted">
                <span className="font-semibold text-copy-secondary">{connectors.filter(c => c.accessible && !c.connected).length}</span> available
              </div>
              <div className="flex items-center gap-2 text-[13px] text-copy-disabled">
                <span className="font-medium">{connectors.length}</span> total
              </div>
            </div>
          </div>

          {/* ── Notice ── */}
          {notice && (
            <div className={`mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px] ${notice.ok ? "border-cache-hit/30 bg-cache-hit/10 text-cache-hit" : "border-cache-err/30 bg-cache-err/10 text-cache-err"}`}>
              {notice.ok ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {notice.text}
            </div>
          )}

          {/* ── Category filter ── */}
          <div className="mb-5 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all ${!activeCategory ? "border-bc-accent bg-bc-accent text-white" : "border-surface-border text-copy-secondary hover:border-bc-accent/40 hover:text-copy-primary"}`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => {
              const count = connectors.filter((c) => meta(c.source).category === cat && c.connected).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-all ${activeCategory === cat ? "border-bc-accent bg-bc-accent text-white" : "border-surface-border text-copy-secondary hover:border-bc-accent/40 hover:text-copy-primary"}`}
                >
                  {cat}
                  {count > 0 && (
                    <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ${activeCategory === cat ? "bg-white/20 text-white" : "bg-cache-hit/20 text-cache-hit"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Grid ── */}
          {loading ? (
            <div className="flex items-center justify-center py-20 text-copy-disabled">
              <Loader2 className="animate-spin" size={22} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayed.map((c) => (
                <ConnectorCard
                  key={c.source}
                  connector={c}
                  onConnect={(s) => setModal(s)}
                  onDisconnect={handleDisconnect}
                  pending={pending}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
