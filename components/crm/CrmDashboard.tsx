"use client";

import { useCallback, useEffect, useState } from "react";
import { CrmActivityInbox } from "@/components/crm/CrmActivityInbox";
import { CrmHeader } from "@/components/crm/CrmHeader";
import type { CrmFeedItem } from "@/lib/crm-feed";
import { isCrmFeedItemUnread } from "@/lib/crm-feed";

export function CrmDashboard() {
  const [items, setItems] = useState<CrmFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "lead" | "contact">("all");

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

  const visible = items.filter((i) => filter === "all" || i.source === filter);
  const unreadCount = visible.filter(isCrmFeedItemUnread).length;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Activity"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread · ${visible.length} total`
            : `${visible.length} ${filter === "all" ? "messages" : filter === "lead" ? "leads" : "contacts"}`
        }
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

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 pb-24 md:px-8">
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
        {error && (
          <p className="text-sm text-warn">
            {error}{" "}
            <span className="text-ink-soft">
              If read/unread was just added, run the CRM read migration in Supabase or POST
              /api/admin/migrate-crm-read.
            </span>
          </p>
        )}

        {!loading && !error && visible.length === 0 && (
          <p className="text-sm text-ink-soft">No activity yet.</p>
        )}

        {!loading && !error && visible.length > 0 && (
          <CrmActivityInbox
            items={visible}
            onItemsChange={(updater) => {
              setItems((prev) => {
                const vis =
                  filter === "all" ? prev : prev.filter((i) => i.source === filter);
                const nextVisible = updater(vis);
                const byKey = new Map(
                  nextVisible.map((i) => [`${i.source}-${i.id}`, i] as const)
                );
                return prev.map((i) => byKey.get(`${i.source}-${i.id}`) ?? i);
              });
            }}
            onReload={load}
          />
        )}
      </main>
    </div>
  );
}
