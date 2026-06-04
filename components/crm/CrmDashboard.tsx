"use client";

import { useCallback, useEffect, useState } from "react";
import { CrmHeader } from "@/components/crm/CrmHeader";
import { SubmissionFieldStack } from "@/components/form-field-stack";
import type { CrmFeedItem } from "@/lib/crm-feed";

type PendingDelete = {
  source: "lead" | "contact";
  id: string;
  label: string;
  step: 1 | 2;
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
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  function startDelete(item: CrmFeedItem) {
    setEditingNotes(null);
    setPendingDelete({
      source: item.source,
      id: item.id,
      label: item.businessName || item.title || item.email,
      step: 1,
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    if (pendingDelete.step === 1) {
      setPendingDelete({ ...pendingDelete, step: 2 });
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/crm/items/${pendingDelete.source}/${pendingDelete.id}`,
        { method: "DELETE", credentials: "include" }
      );
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) throw new Error("Delete failed");
      setPendingDelete(null);
      await load();
    } catch {
      setError("Could not delete record.");
    } finally {
      setDeleting(false);
    }
  }

  const visible = items.filter((i) => filter === "all" || i.source === filter);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Activity"
        subtitle={`${visible.length} ${filter === "all" ? "records" : filter === "lead" ? "leads" : "contacts"}`}
        actions={
          <button
            type="button"
            onClick={load}
            className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50"
          >
            Refresh
          </button>
        }
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 pb-24 md:px-8">
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
          {visible.map((item) => {
            const isDeletingThis =
              pendingDelete?.source === item.source && pendingDelete.id === item.id;

            return (
              <li
                key={`${item.source}-${item.id}`}
                className="rounded-2xl border border-rule bg-bg p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate">
                      {item.source === "lead" ? "Lead" : "Contact"} · {formatWhen(item.at)}
                    </p>
                    <p className="mt-1 font-display text-lg font-medium">
                      {item.source === "lead" ? "Lead brief" : "Contact"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {item.status && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${statusClass(item.status)}`}
                      >
                        {item.status.replace(/_/g, " ")}
                      </span>
                    )}
                    {!isDeletingThis && (
                      <button
                        type="button"
                        onClick={() => startDelete(item)}
                        className="rounded-full border border-warn/40 px-3 py-1 text-xs font-medium text-warn hover:bg-warn-soft/40"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {isDeletingThis && pendingDelete && (
                  <div className="mt-4 rounded-xl border border-warn/40 bg-warn-soft/30 p-4">
                    {pendingDelete.step === 1 ? (
                      <>
                        <p className="text-sm font-medium text-ink">
                          Delete this {item.source === "lead" ? "lead" : "contact"}?
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                          <span className="font-medium text-ink">{pendingDelete.label}</span>{" "}
                          will be removed from the CRM database.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-warn">
                          Final confirmation — this cannot be undone
                        </p>
                        <p className="mt-1 text-sm text-ink-soft">
                          Permanently delete{" "}
                          <span className="font-medium text-ink">{pendingDelete.label}</span>?
                        </p>
                      </>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={confirmDelete}
                        className="rounded-full bg-warn px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {deleting
                          ? "Deleting…"
                          : pendingDelete.step === 1
                            ? "Continue"
                            : "Delete permanently"}
                      </button>
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => setPendingDelete(null)}
                        className="rounded-full border border-rule px-4 py-2 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <SubmissionFieldStack
                  name={item.title}
                  company={item.businessName}
                  email={item.email}
                  message={item.message ?? undefined}
                  messagePlaceholder={
                    item.source === "lead" ? "Project brief — see notes and payload below." : undefined
                  }
                />

                {item.source === "lead" && !isDeletingThis && (
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
                          setPendingDelete(null);
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
                  <p className="mt-2 break-all text-xs text-ink-soft">
                    Stripe session: {item.stripeSessionId}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
