"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CrmActivityInbox } from "@/components/crm/CrmActivityInbox";
import { CrmHeader } from "@/components/crm/CrmHeader";
import type { CrmFeedItem } from "@/lib/crm-feed";
import { isCrmFeedItemUnread } from "@/lib/crm-feed";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";

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
      const data = (await res.json()) as { items: CrmFeedItem[]; error?: string | null };
      if (data.error) {
        setError(data.error);
        setItems([]);
        return;
      }
      setItems(data.items ?? []);
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
  const clientItems = useMemo(() => items.filter((i) => i.source === "client"), [items]);
  const discoveryItems = useMemo(
    () => items.filter((i) => i.source === "discovery"),
    [items]
  );
  const smsItems = useMemo(() => items.filter((i) => i.source === "sms"), [items]);
  const blogItems = useMemo(() => items.filter((i) => i.source === "blog"), [items]);
  const voiceDemoItems = useMemo(
    () => items.filter((i) => i.source === "voice_demo"),
    [items]
  );
  const plumbingDemoItems = useMemo(
    () => items.filter((i) => i.source === "plumbing_demo"),
    [items]
  );
  const unreadCount = items.filter(isCrmFeedItemUnread).length;
  const countsLabel = `${contactItems.length} contacts · ${leadItems.length} leads · ${clientItems.length} clients · ${discoveryItems.length} discovery · ${smsItems.length} texts · ${blogItems.length} blog · ${voiceDemoItems.length} 998web Jarvis · ${plumbingDemoItems.length} plumbing Jarvis`;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Messages"
        subtitle={
          unreadCount > 0 ? `${unreadCount} unread · ${countsLabel}` : countsLabel
        }
        onRefresh={load}
        refreshDisabled={loading}
      />

      <main className={`${CRM_PAGE_CONTAINER} flex-1 py-8 pb-24`}>
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
            clientItems={clientItems}
            discoveryItems={discoveryItems}
            smsItems={smsItems}
            blogItems={blogItems}
            voiceDemoItems={voiceDemoItems}
            plumbingDemoItems={plumbingDemoItems}
            onItemsChange={(updater) => setItems((prev) => updater(prev))}
            onReload={load}
          />
        )}
      </main>
    </div>
  );
}
