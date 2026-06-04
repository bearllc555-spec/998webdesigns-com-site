"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CrmActivityInbox } from "@/components/crm/CrmActivityInbox";
import { CrmHeader } from "@/components/crm/CrmHeader";
import type { CrmFeedItem } from "@/lib/crm-feed";
import { isCrmFeedItemUnread } from "@/lib/crm-feed";

export function CrmDashboard() {
  const [items, setItems] = useState<CrmFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const contactItems = useMemo(
    () => items.filter((i) => i.source === "contact"),
    [items]
  );
  const leadItems = useMemo(() => items.filter((i) => i.source === "lead"), [items]);
  const unreadCount = items.filter(isCrmFeedItemUnread).length;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Messages"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread · ${contactItems.length} contacts · ${leadItems.length} leads`
            : `${contactItems.length} contacts · ${leadItems.length} leads`
        }
        onRefresh={load}
        refreshDisabled={loading}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 pb-24 md:px-8">
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

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-ink-soft">No activity yet.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <CrmActivityInbox
            contactItems={contactItems}
            leadItems={leadItems}
            onItemsChange={(updater) => setItems((prev) => updater(prev))}
            onReload={load}
          />
        )}
      </main>
    </div>
  );
}
