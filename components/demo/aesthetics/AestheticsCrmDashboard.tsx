"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CrmHeader } from "@/components/crm/CrmHeader";
import type { AestheticsCrmSnapshot, AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";

type Tab = "leads" | "appointments" | "sms" | "emails" | "conversations";

const TABS: { id: Tab; label: string }[] = [
  { id: "leads", label: "Leads" },
  { id: "appointments", label: "Appointments" },
  { id: "sms", label: "SMS" },
  { id: "emails", label: "Email" },
  { id: "conversations", label: "Conversations" },
];

function formatAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function NewBadge() {
  return (
    <span className="ml-2 inline-flex animate-pulse rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
      new
    </span>
  );
}

type AestheticsCrmDashboardProps = {
  brand: AestheticsDemoBrand;
};

export function AestheticsCrmDashboard({ brand }: AestheticsCrmDashboardProps) {
  const config = getDemoBrandConfigByVertical(brand);
  const feedPath = `/api/demo/${brand === "clinical" ? "clinical" : "wellness"}/crm/feed`;
  const sessionPath = `/api/demo/${brand === "clinical" ? "clinical" : "wellness"}/crm/session`;

  const [snapshot, setSnapshot] = useState<AestheticsCrmSnapshot | null>(null);
  const [tab, setTab] = useState<Tab>("leads");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(feedPath, { credentials: "include" });
      if (res.status === 401) {
        window.location.href = config.crmRoute;
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { snapshot: AestheticsCrmSnapshot; error?: string };
      if (data.error) {
        setError(data.error);
        return;
      }
      setSnapshot(data.snapshot);
    } catch {
      setError("Could not load demo CRM.");
    } finally {
      setLoading(false);
    }
  }, [config.crmRoute, feedPath]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 4000);
    return () => window.clearInterval(id);
  }, [load]);

  const tiles = snapshot?.tiles;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Med spa demo CRM"
        subtitle={config.brandName}
        brandLabel={`${config.brandName} demo`}
        hideAdmin
        sessionApiPath={sessionPath}
        afterLogoutPath={config.crmRoute}
        messagesHref={config.crmRoute}
        secondaryNavLink={{ href: config.demoRoute, label: "Voice demo" }}
        actions={
          <Link
            href={config.demoRoute}
            className="rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-accent hover:text-ink"
          >
            Demo Jarvis
          </Link>
        }
        onRefresh={load}
        refreshDisabled={loading}
      />

      <main className={`${CRM_PAGE_CONTAINER} flex-1 space-y-8 py-8 pb-24`}>
        {loading && !snapshot && <p className="text-sm text-ink-soft">Loading…</p>}
        {error && <p className="text-sm text-warn">{error}</p>}

        {tiles && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {[
              ["Leads (7d)", tiles.leadsCaptured],
              ["Booked", tiles.appointmentsBooked],
              ["After hours", tiles.afterHoursSaves],
              ["Revenue", `$${tiles.revenueBooked.toLocaleString()}`],
              ["Memberships", tiles.membershipsStarted],
              ["Jarvis", `${tiles.avgJarvisResponseSec}s`],
              ["Coverage", tiles.coverage],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-xl border border-rule bg-bg px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-ink-soft">{label as string}</p>
                <p className="mt-1 font-display text-lg font-semibold">{value as string | number}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-rule pb-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                tab === t.id ? "bg-accent text-on-accent" : "text-ink-soft hover:bg-rule-soft"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {snapshot && tab === "leads" && (
          <Table
            headers={["Name", "Interest", "Source", "Status", "When"]}
            rows={snapshot.leads.map((l) => [
              <>
                {l.name}
                {l.isNew && <NewBadge />}
              </>,
              l.interest,
              l.source,
              l.status,
              formatAt(l.at),
            ])}
          />
        )}

        {snapshot && tab === "appointments" && (
          <Table
            headers={["Service", "Provider", "Status", "Value", "When"]}
            rows={snapshot.appointments.map((a) => [
              <>
                {a.service}
                {a.isNew && <NewBadge />}
              </>,
              a.provider,
              a.status,
              a.value ? `$${a.value}` : "—",
              formatAt(a.at),
            ])}
          />
        )}

        {snapshot && tab === "sms" && (
          <Table
            headers={["Direction", "Type", "Body", "When"]}
            rows={snapshot.sms.map((s) => [
              <>
                {s.direction}
                {s.isNew && <NewBadge />}
              </>,
              s.type,
              s.body,
              formatAt(s.at),
            ])}
          />
        )}

        {snapshot && tab === "emails" && (
          <Table
            headers={["Subject", "Type", "Status", "When"]}
            rows={snapshot.emails.map((e) => [
              <>
                {e.subject}
                {e.isNew && <NewBadge />}
              </>,
              e.type,
              e.status,
              formatAt(e.at),
            ])}
          />
        )}

        {snapshot && tab === "conversations" && (
          <div className="space-y-3">
            {snapshot.conversations.map((c) => (
              <article
                key={c.id}
                className={`rounded-xl border border-rule px-4 py-3 ${c.isNew ? "ring-2 ring-emerald-400/40" : ""}`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                  <span className="font-medium uppercase">{c.channel}</span>
                  <span>·</span>
                  <span>{c.intent}</span>
                  <span>·</span>
                  <span>{c.outcome}</span>
                  <span>·</span>
                  <span>{formatAt(c.at)}</span>
                  {c.isNew && <NewBadge />}
                </div>
                <p className="mt-2 text-sm leading-relaxed">{c.snippet}</p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: React.ReactNode[][];
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-ink-soft">No rows.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-rule">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-rule bg-rule-soft/50 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-rule last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="max-w-xs truncate px-4 py-3 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
