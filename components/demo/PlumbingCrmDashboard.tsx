"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CrmInboxFlagButton } from "@/components/crm/CrmInboxFlagButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { type CrmFeedItem, isCrmFeedItemUnread } from "@/lib/crm-feed";
import { nextCrmInboxFlag } from "@/lib/crm-inbox-flag";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";
import { PLUMBING_CRM_VERSION } from "@/lib/plumbing-crm-version";
import { PLUMBING_DEMO_BUSINESS_NAME } from "@/lib/voice-demo-plumbing-constants";

type PlumbingJobPayload = {
  status?: string;
  serviceType?: string | null;
  serviceAddress?: string | null;
  appointmentDate?: string | null;
  timeWindow?: string | null;
  priceRange?: string | null;
  isEmergency?: boolean;
  promoApplied?: boolean;
  customerEmail?: string | null;
  confirmationEmailSentAt?: string | null;
};

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function jobFromItem(item: CrmFeedItem): PlumbingJobPayload | null {
  const raw = item.payload?.plumbingJob;
  if (!raw || typeof raw !== "object") return null;
  return raw as PlumbingJobPayload;
}

export function PlumbingCrmDashboard() {
  const [items, setItems] = useState<CrmFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/plumbers/crm/feed?limit=50", {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/crm/login?next=/demo/plumbers/crm";
        return;
      }
      if (!res.ok) throw new Error("Failed to load feed");
      const data = (await res.json()) as { items: CrmFeedItem[]; error?: string | null };
      if (data.error) {
        setError(data.error);
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
    } catch {
      setError("Could not load plumbing demo activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const bookedCount = useMemo(
    () =>
      items.filter((i) => {
        const job = jobFromItem(i);
        return job?.status === "booked" || job?.status === "emergency";
      }).length,
    [items]
  );
  const unreadCount = items.filter(isCrmFeedItemUnread).length;

  async function patchItem(
    id: string,
    patch: { read?: boolean; inboxFlag?: string | null }
  ) {
    const res = await fetch(`/api/crm/items/voice_demo/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(patch),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { readAt?: string | null; inboxFlag?: string | null };
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              readAt: patch.read === false ? null : (data.readAt ?? item.readAt),
              inboxFlag:
                patch.inboxFlag !== undefined
                  ? (data.inboxFlag as CrmFeedItem["inboxFlag"])
                  : item.inboxFlag,
            }
          : item
      )
    );
  }

  async function logout() {
    await fetch("/api/crm/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/crm/login?next=/demo/plumbers/crm";
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <header className="shrink-0 border-b border-rule bg-bg">
        <div className={`${CRM_PAGE_CONTAINER} py-4`}>
          <p className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-rule-soft px-2 py-0.5 text-[10px] font-medium tracking-wider text-slate">
              {PLUMBING_CRM_VERSION}
            </span>
          </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                {PLUMBING_DEMO_BUSINESS_NAME} demo
              </p>
              <h1 className="font-display text-2xl font-medium">Demo CRM</h1>
              <p className="mt-1 text-sm text-ink-soft">
                {unreadCount > 0 ? `${unreadCount} unread · ` : ""}
                {items.length} callers · {bookedCount} appointments
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/demo/plumbers"
                className="rounded-full border border-rule px-4 py-1.5 text-sm font-medium text-ink-soft transition hover:border-accent hover:text-ink"
              >
                Voice demo
              </Link>
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="rounded-full border border-rule px-4 py-1.5 text-sm font-medium text-ink-soft transition hover:border-accent hover:text-ink disabled:opacity-50"
              >
                Refresh
              </button>
              <ThemeToggle />
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full border border-rule px-4 py-1.5 text-sm font-medium text-ink-soft transition hover:border-accent hover:text-ink"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className={`${CRM_PAGE_CONTAINER} flex-1 py-8 pb-24`}>
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}
        {error && <p className="text-sm text-warn">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-ink-soft">
            No plumbing demo callers yet. Run a session at{" "}
            <Link href="/demo/plumbers" className="text-accent hover:underline">
              /demo/plumbers
            </Link>
            .
          </p>
        )}

        <ul className="grid gap-2">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const unread = isCrmFeedItemUnread(item);
            const job = jobFromItem(item);
            return (
              <li
                key={item.id}
                className={`rounded-2xl border border-rule bg-bg transition ${
                  unread ? "border-accent/40 bg-accent-soft/20" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(expanded ? null : item.id);
                    if (unread) void patchItem(item.id, { read: true });
                  }}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-ink">{item.title}</span>
                      {job?.status && (
                        <span className="rounded-full bg-rule-soft px-2 py-0.5 text-xs text-ink-soft">
                          {job.status.replace(/_/g, " ")}
                        </span>
                      )}
                      {job?.isEmergency && (
                        <span className="rounded-full bg-warn/15 px-2 py-0.5 text-xs text-warn">
                          emergency
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {item.email || "No email"} · {formatWhen(item.at)}
                    </p>
                    {item.message && (
                      <p className="mt-1 text-sm text-ink-soft">{item.message}</p>
                    )}
                  </div>
                  <CrmInboxFlagButton
                    flag={item.inboxFlag}
                    onCycle={() =>
                      void patchItem(item.id, {
                        inboxFlag: nextCrmInboxFlag(item.inboxFlag),
                      })
                    }
                  />
                </button>

                {expanded && (
                  <div className="border-t border-rule px-4 py-4 text-sm">
                    <dl className="grid gap-2">
                      <div>
                        <dt className="text-ink-soft">Phone</dt>
                        <dd>{item.phone || "—"}</dd>
                      </div>
                      {job ? (
                        <>
                          <div>
                            <dt className="text-ink-soft">Service</dt>
                            <dd>{job.serviceType || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-ink-soft">Address</dt>
                            <dd>{job.serviceAddress || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-ink-soft">Appointment</dt>
                            <dd>
                              {[job.appointmentDate, job.timeWindow].filter(Boolean).join(" · ") ||
                                "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-ink-soft">Estimate</dt>
                            <dd>{job.priceRange || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-ink-soft">Customer email on job</dt>
                            <dd>{job.customerEmail || item.email || "—"}</dd>
                          </div>
                          <div>
                            <dt className="text-ink-soft">$50 promo</dt>
                            <dd>{job.promoApplied ? "Applied" : "Not applied"}</dd>
                          </div>
                          <div>
                            <dt className="text-ink-soft">Confirmation email</dt>
                            <dd>
                              {job.confirmationEmailSentAt
                                ? `Sent ${formatWhen(job.confirmationEmailSentAt)}`
                                : "Not recorded yet"}
                            </dd>
                          </div>
                        </>
                      ) : (
                        <p className="text-ink-soft">No appointment saved yet.</p>
                      )}
                    </dl>
                    {item.notes && (
                      <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-rule bg-rule-soft/40 p-3 text-xs text-ink-soft">
                        {item.notes}
                      </pre>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
