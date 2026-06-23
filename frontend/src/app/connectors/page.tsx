"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Link2, Loader2, Unlink } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { disconnectConnector, getConnectorStatuses, startConnectorConnect, type ConnectorStatus } from "@/lib/api";

const LABELS: Record<string, string> = {
  github: "GitHub",
  notion: "Notion",
  slack: "Slack",
  hubspot: "HubSpot",
  gmail: "Gmail",
  google_drive: "Google Drive",
  confluence: "Confluence",
  jira: "Jira",
  salesforce: "Salesforce",
  zendesk: "Zendesk",
};

export default function ConnectorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading: sessionLoading, accessToken } = useAuth();
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading && !session) router.replace("/login");
  }, [session, sessionLoading, router]);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      setConnectors(await getConnectorStatuses(accessToken));
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const source = searchParams.get("source");
    const status = searchParams.get("status");
    if (source && status) {
      setNotice(
        status === "connected"
          ? `${LABELS[source] ?? source} connected successfully.`
          : `Couldn't connect ${LABELS[source] ?? source}. Please try again.`
      );
      refresh();
    }
  }, [searchParams, refresh]);

  const handleConnect = async (source: string) => {
    if (!accessToken) return;
    setPending(source);
    try {
      const { redirect_url } = await startConnectorConnect(source, accessToken);
      window.location.href = redirect_url;
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to start connection");
      setPending(null);
    }
  };

  const handleDisconnect = async (source: string) => {
    if (!accessToken) return;
    setPending(source);
    try {
      await disconnectConnector(source, accessToken);
      await refresh();
    } finally {
      setPending(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft size={14} /> Back to chat
      </Link>

      <h1 className="text-xl font-semibold text-slate-900">Connectors</h1>
      <p className="mt-1 text-sm text-slate-500">
        Connect your own accounts so the agent can search and act on your behalf.
      </p>

      {notice && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {connectors.map((c) => (
            <li key={c.source} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{LABELS[c.source] ?? c.source}</p>
                <p className="text-xs text-slate-500">
                  {!c.accessible ? "Not available for your role" : c.connected ? "Connected" : "Not connected"}
                </p>
              </div>

              {c.connected ? (
                <button
                  onClick={() => handleDisconnect(c.source)}
                  disabled={pending === c.source}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {pending === c.source ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(c.source)}
                  disabled={!c.accessible || pending === c.source}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
                >
                  {pending === c.source ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : c.connected ? (
                    <Check size={12} />
                  ) : (
                    <Link2 size={12} />
                  )}
                  Connect
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
