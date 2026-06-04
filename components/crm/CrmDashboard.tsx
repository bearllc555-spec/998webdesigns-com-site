"use client";

import { useCallback, useEffect, useState } from "react";
import type { CrmFeedItem } from "@/lib/crm-feed";

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

function statusClass(status: string | null): string {
  if (!status) return "bg-rule-soft text-ink-soft";
  if (status === "paid_in_full") return "bg-success/15 text-success";
  if (status.includes("failed") || status === "bank_payment_failed") {
    return "bg-warn-soft text-warn";
  }
  if (status.includes("awaiting")) return "bg-accent/10 text-accent";
  return "bg-rule-soft text-ink-soft";
}

export function CrmDashboard() {
  const [items, setItems] = useState<CrmFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "lead" | "contact">("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/feed?limit=80", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load feed");
      const data = (await res.json()) as { items: CrmFeedItem[] };
      setItems(data.items);
    } catch {
      setError("Could not load activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/crm/session", { method: "DELETE", credentials: "include" });
    window.location.href = "/crm/login";
  }

  async function saveNotes(leadId: string) {
    const res = await fetch(`/api/crm/leads/${leadId}/notes`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: notesDraft }),
    });
    if (!res.ok) return;
    setEditingNotes(null);
    await load();
  }

  const visible = items.filter((i) => filter === "all" || i.source === filter);

  return (
    <div className="min-h-screen bg-bg text-ink">
      <header className="border-b border-rule bg-bg">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
              998 CRM
            </p>
            <h1 className="font-display text-2xl font-medium">Activity</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={load}
              className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {(["all", "lead", "contact"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${
                filter === f
                  ? "bg-accent text-white"
                  : "border border-rule text-ink-soft hover:border-accent/50"
              }`}
            >
              {f === "all" ? "All" : f === "lead" ? "Leads" : "Contact"}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-ink-soft">Loading…</p>}
        {error && <p className="text-sm text-warn">{error}</p>}

        {!loading && !error && visible.length === 0 && (
          <p className="text-sm text-ink-soft">No activity yet.</p>
        )}

        <ul className="space-y-4">
          {visible.map((item) => (
            <li
              key={`${item.source}-${item.id}`}
              className="rounded-2xl border border-rule bg-bg p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate">
                    {item.source === "lead" ? "Lead" : "Contact"} · {formatWhen(item.at)}
                  </p>
                  <p className="mt-1 font-display text-lg font-medium">{item.title}</p>
                  <p className="text-sm text-ink-soft">
                    {item.businessName ? `${item.businessName} · ` : ""}
                    {item.email}
                  </p>
                </div>
                {item.status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(item.status)}`}
                  >
                    {item.status.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {item.message && (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
                  {item.message}
                </p>
              )}

              {item.source === "lead" && (
                <div className="mt-4 border-t border-rule pt-4">
                  {editingNotes === item.id ? (
                    <div className="grid gap-2">
                      <textarea
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        rows={3}
                        className="w-full rounded-xl border border-rule bg-bg px-3 py-2 text-sm"
                        placeholder="Internal notes…"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveNotes(item.id)}
                          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingNotes(null)}
                          className="rounded-full border border-rule px-4 py-2 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNotes(item.id);
                        setNotesDraft(item.notes ?? "");
                      }}
                      className="text-sm text-accent hover:underline"
                    >
                      {item.notes ? "Edit notes" : "Add notes"}
                    </button>
                  )}
                  {item.notes && editingNotes !== item.id && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">
                      {item.notes}
                    </p>
                  )}
                </div>
              )}

              {item.stripeSessionId && (
                <p className="mt-2 text-xs text-ink-soft">
                  Stripe session: {item.stripeSessionId}
                </p>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
