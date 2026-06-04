import { isCrmInboxFlag, type CrmInboxFlag } from "@/lib/crm-inbox-flag";
import { supabaseAdmin } from "@/lib/supabase";

export type { CrmInboxFlag };

export type CrmFeedItem = {
  id: string;
  source: "lead" | "contact";
  at: string;
  title: string;
  email: string;
  businessName: string;
  status: string | null;
  notes: string | null;
  stripeSessionId: string | null;
  stripeSubscriptionId: string | null;
  message: string | null;
  payload: Record<string, unknown> | null;
  /** null = unread */
  readAt: string | null;
  /** null = outline star; cycles star → check → alert → null */
  inboxFlag: CrmInboxFlag | null;
};

function parseInboxFlag(value: unknown): CrmInboxFlag | null {
  return isCrmInboxFlag(value) ? value : null;
}

export function isCrmFeedItemUnread(item: CrmFeedItem): boolean {
  return item.readAt == null;
}

export type CrmFeedResult = {
  items: CrmFeedItem[];
  /** Set when Supabase is misconfigured or the schema query failed. */
  error?: string;
};

export async function fetchCrmFeed(limit = 80): Promise<CrmFeedResult> {
  const supa = supabaseAdmin();
  if (!supa) {
    return {
      items: [],
      error:
        "Supabase not configured locally. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (helmet: xwldbxburzqryxlzocck — see DEV.md).",
    };
  }

  const [leadsRes, contactsRes] = await Promise.all([
    supa
      .from("wd_leads")
      .select(
        "id, submitted_at, email, business_name, full_name, status, notes, stripe_deposit_invoice_id, stripe_subscription_id, payload, read_at, inbox_flag"
      )
      .order("submitted_at", { ascending: false })
      .limit(limit),
    supa
      .from("contact_submissions")
      .select("id, submitted_at, email, name, business_name, message, read_at, inbox_flag")
      .order("submitted_at", { ascending: false })
      .limit(limit),
  ]);

  const errors: string[] = [];
  if (leadsRes.error) {
    console.warn("[crm-feed] wd_leads:", leadsRes.error.message);
    errors.push(`leads: ${leadsRes.error.message}`);
  }
  if (contactsRes.error) {
    console.warn("[crm-feed] contact_submissions:", contactsRes.error.message);
    errors.push(`contacts: ${contactsRes.error.message}`);
  }
  if (errors.length) {
    const hint = /inbox_flag|read_at|does not exist/i.test(errors.join(" "))
      ? " Run CRM migrations in Supabase (read_at, inbox_flag) or POST /api/admin/migrate-crm-read and migrate-crm-inbox-flag."
      : "";
    return { items: [], error: errors.join("; ") + hint };
  }

  const items: CrmFeedItem[] = [];

  for (const row of leadsRes.data ?? []) {
    items.push({
      id: row.id,
      source: "lead",
      at: row.submitted_at,
      title: row.full_name,
      email: row.email,
      businessName: row.business_name,
      status: row.status,
      notes: row.notes,
      stripeSessionId: row.stripe_deposit_invoice_id,
      stripeSubscriptionId: row.stripe_subscription_id,
      message: null,
      payload: (row.payload as Record<string, unknown>) ?? null,
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  for (const row of contactsRes.data ?? []) {
    items.push({
      id: row.id,
      source: "contact",
      at: row.submitted_at,
      title: row.name,
      email: row.email,
      businessName: row.business_name ?? "",
      status: null,
      notes: null,
      stripeSessionId: null,
      stripeSubscriptionId: null,
      message: row.message,
      payload: null,
      readAt: (row as { read_at?: string | null }).read_at ?? null,
      inboxFlag: parseInboxFlag((row as { inbox_flag?: unknown }).inbox_flag),
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return { items: items.slice(0, limit) };
}
