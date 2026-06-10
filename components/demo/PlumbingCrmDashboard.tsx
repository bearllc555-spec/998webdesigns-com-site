"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CrmActivityInbox } from "@/components/crm/CrmActivityInbox";
import { CrmHeader } from "@/components/crm/CrmHeader";
import { PlumbingDemoCrmBanner } from "@/components/demo/PlumbingDemoCrmBanner";
import type { CrmFeedItem } from "@/lib/crm-feed";
import { isCrmFeedItemUnread } from "@/lib/crm-feed";
import { CRM_PAGE_CONTAINER } from "@/lib/crm-layout";
import {
  applyPlumbingDemoCrmSessionPatches,
  clearPlumbingDemoCrmSessionStore,
} from "@/lib/plumbing-demo-crm-session-store";
import { PLUMBING_DEMO_BUSINESS_NAME } from "@/lib/voice-demo-plumbing-constants";

export function PlumbingCrmDashboard() {
  const [items, setItems] = useState<CrmFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/demo/plumbers/crm/feed?limit=80", {
        credentials: "include",
      });
      if (res.status === 401) {
        window.location.href = "/demo/plumbers/crm";
        return;
      }
      if (!res.ok) throw new Error("Failed to load feed");
      const data = (await res.json()) as { items: CrmFeedItem[]; error?: string | null };
      if (data.error) {
        setError(data.error);
        setItems([]);
        return;
      }
      setItems(applyPlumbingDemoCrmSessionPatches(data.items ?? []));
    } catch {
      setError("Could not load demo activity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
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
  const unreadCount = items.filter(isCrmFeedItemUnread).length;
  const countsLabel = `${contactItems.length} contacts · ${leadItems.length} leads · ${clientItems.length} clients · ${discoveryItems.length} discovery · ${smsItems.length} texts · ${blogItems.length} blog`;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title="Messages"
        subtitle={
          unreadCount > 0 ? `${unreadCount} unread · ${countsLabel}` : countsLabel
        }
        brandLabel={`${PLUMBING_DEMO_BUSINESS_NAME} demo`}
        hideAdmin
        sessionApiPath="/api/demo/plumbers/crm/session"
        afterLogoutPath="/demo/plumbers/crm"
        messagesHref="/demo/plumbers/crm"
        secondaryNavLink={{ href: "/demo/plumbers", label: "Voice demo" }}
        actions={
          <Link
            href="/demo/plumbers"
            className="rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-accent hover:text-ink"
          >
            Demo Jarvis
          </Link>
        }
        onRefresh={load}
        refreshDisabled={loading}
        onBeforeLogout={clearPlumbingDemoCrmSessionStore}
      />

      <PlumbingDemoCrmBanner />

      <main className={`${CRM_PAGE_CONTAINER} flex-1 py-8 pb-24`}>
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}
        {error && <p className="text-sm text-warn">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p className="text-sm text-ink-soft">No demo activity loaded.</p>
        )}

        {!loading && !error && items.length > 0 && (
          <CrmActivityInbox
            demoMode
            hideJarvisDemoSections
            loginPath="/demo/plumbers/crm"
            contactItems={contactItems}
            leadItems={leadItems}
            clientItems={clientItems}
            discoveryItems={discoveryItems}
            smsItems={smsItems}
            blogItems={blogItems}
            onItemsChange={(updater) => setItems((prev) => updater(prev))}
            onReload={load}
          />
        )}
      </main>
    </div>
  );
}
