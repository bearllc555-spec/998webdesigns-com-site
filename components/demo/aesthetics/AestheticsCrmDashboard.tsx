"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AestheticsCrmHeader } from "@/components/demo/aesthetics/AestheticsCrmHeader";
import type { AestheticsCrmSnapshot, AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";
import type { DemoBrandConfig } from "@/lib/demo-config/types";
import { brandBorder } from "@/lib/demo-config/brand-field-styles";

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

type AestheticsCrmDashboardProps = {
  brand: AestheticsDemoBrand;
};

export function AestheticsCrmDashboard({ brand }: AestheticsCrmDashboardProps) {
  const config = getDemoBrandConfigByVertical(brand);
  const feedPath = `/api/demo/${brand === "clinical" ? "clinical" : "wellness"}/crm/feed`;
  const sessionPath = `/api/demo/${brand === "clinical" ? "clinical" : "wellness"}/crm/session`;
  const line = brandBorder(config);

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
    <div
      className="flex min-h-dvh flex-col"
      style={{ backgroundColor: config.palette.bg, color: config.palette.ink, fontFamily: config.fonts.body }}
    >
      <AestheticsCrmHeader
        config={config}
        title="Med spa demo CRM"
        subtitle={config.tagline}
        sessionApiPath={sessionPath}
        afterLogoutPath={config.crmRoute}
        messagesHref={config.crmRoute}
        secondaryNavLink={{ href: config.demoRoute, label: "Voice demo" }}
        actions={
          <Link
            href={config.demoRoute}
            className="rounded-full border px-3 py-1.5 text-xs font-medium transition hover:opacity-80"
            style={{ borderColor: line, color: config.palette.muted }}
          >
            Demo Jarvis
          </Link>
        }
        onRefresh={load}
        refreshDisabled={loading}
      />

      <main className={`${CRM_PAGE_CONTAINER} flex-1 space-y-8 py-8 pb-24`}>
        {loading && !snapshot && (
          <p className="text-sm" style={{ color: config.palette.muted }}>
            Loading…
          </p>
        )}
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
              <div
                key={label as string}
                className="rounded-xl border px-3 py-3"
                style={{ borderColor: line, backgroundColor: config.palette.surface }}
              >
                <p className="text-[11px] uppercase tracking-wide" style={{ color: config.palette.muted }}>
                  {label as string}
                </p>
                <p
                  className="mt-1 text-lg font-semibold"
                  style={{ fontFamily: config.fonts.display, color: config.palette.headline }}
                >
                  {value as string | number}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b pb-2" style={{ borderColor: line }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="rounded-full px-3 py-1.5 text-sm font-medium transition"
              style={
                tab === t.id
                  ? { backgroundColor: config.palette.accent, color: "#fff" }
                  : { color: config.palette.muted, backgroundColor: `${config.palette.muted}18` }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {snapshot && tab === "leads" && (
          <Table
            config={config}
            headers={["Name", "Interest", "Source", "Status", "When"]}
            rows={snapshot.leads.map((l) => [
              <>
                {l.name}
                {l.isNew && <NewBadge config={config} />}
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
            config={config}
            headers={["Service", "Provider", "Status", "Value", "When"]}
            rows={snapshot.appointments.map((a) => [
              <>
                {a.service}
                {a.isNew && <NewBadge config={config} />}
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
            config={config}
            headers={["Direction", "Type", "Body", "When"]}
            rows={snapshot.sms.map((s) => [
              <>
                {s.direction}
                {s.isNew && <NewBadge config={config} />}
              </>,
              s.type,
              s.body,
              formatAt(s.at),
            ])}
          />
        )}

        {snapshot && tab === "emails" && (
          <Table
            config={config}
            headers={["Subject", "Type", "Status", "When"]}
            rows={snapshot.emails.map((e) => [
              <>
                {e.subject}
                {e.isNew && <NewBadge config={config} />}
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
                className="rounded-xl border px-4 py-3"
                style={{
                  borderColor: line,
                  backgroundColor: config.palette.surface,
                  boxShadow: c.isNew ? `0 0 0 2px ${config.palette.accent}55` : undefined,
                }}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: config.palette.muted }}>
                  <span className="font-medium uppercase">{c.channel}</span>
                  <span>·</span>
                  <span>{c.intent}</span>
                  <span>·</span>
                  <span>{c.outcome}</span>
                  <span>·</span>
                  <span>{formatAt(c.at)}</span>
                  {c.isNew && <NewBadge config={config} />}
                </div>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: config.palette.ink }}>
                  {c.snippet}
                </p>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NewBadge({ config }: { config: DemoBrandConfig }) {
  return (
    <span
      className="ml-2 inline-flex animate-pulse rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: `${config.palette.accent}22`, color: config.palette.headline }}
    >
      new
    </span>
  );
}

function Table({
  config,
  headers,
  rows,
}: {
  config: DemoBrandConfig;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  const line = brandBorder(config);
  if (rows.length === 0) {
    return (
      <p className="text-sm" style={{ color: config.palette.muted }}>
        No rows.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: line }}>
      <table className="min-w-full text-left text-sm">
        <thead
          className="border-b text-xs uppercase tracking-wide"
          style={{ borderColor: line, backgroundColor: `${config.palette.muted}14`, color: config.palette.muted }}
        >
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{ backgroundColor: config.palette.surface }}>
          {rows.map((row, i) => (
            <tr key={i} className="border-b last:border-0" style={{ borderColor: line }}>
              {row.map((cell, j) => (
                <td key={j} className="max-w-xs truncate px-4 py-3 align-top" style={{ color: config.palette.ink }}>
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
