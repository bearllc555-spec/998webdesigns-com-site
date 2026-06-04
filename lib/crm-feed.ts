import { supabaseAdmin } from "@/lib/supabase";

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
};

export async function fetchCrmFeed(limit = 80): Promise<CrmFeedItem[]> {
  const supa = supabaseAdmin();
  if (!supa) return [];

  const [leadsRes, contactsRes] = await Promise.all([
    supa
      .from("wd_leads")
      .select(
        "id, submitted_at, email, business_name, full_name, status, notes, stripe_deposit_invoice_id, stripe_subscription_id, payload"
      )
      .order("submitted_at", { ascending: false })
      .limit(limit),
    supa
      .from("contact_submissions")
      .select("id, submitted_at, email, name, business_name, message")
      .order("submitted_at", { ascending: false })
      .limit(limit),
  ]);

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
    });
  }

  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return items.slice(0, limit);
}
