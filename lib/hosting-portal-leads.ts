import { supabaseAdmin } from "@/lib/supabase";

export type HostingPortalLead = {
  id: string;
  email: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
};

const INACTIVE_STATUSES = new Set(["hosting_canceled"]);

/** Latest paid monthly client with an active Stripe subscription on file. */
export async function findHostingPortalLeadByEmail(
  email: string
): Promise<HostingPortalLead | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const { data, error } = await supa
    .from("wd_leads")
    .select("id, email, stripe_customer_id, stripe_subscription_id, status, payload")
    .ilike("email", normalized)
    .not("stripe_customer_id", "is", null)
    .not("stripe_subscription_id", "is", null)
    .order("submitted_at", { ascending: false })
    .limit(5);

  if (error) {
    console.warn("[hosting-portal] lead lookup failed:", error.message);
    return null;
  }

  for (const row of data ?? []) {
    if (INACTIVE_STATUSES.has(row.status ?? "")) continue;

    const payload = row.payload as Record<string, unknown> | null;
    const choice = payload?.hostingChoice;
    if (choice && choice !== "monthly") continue;

    const customerId = row.stripe_customer_id?.trim();
    const subscriptionId = row.stripe_subscription_id?.trim();
    if (!customerId || !subscriptionId) continue;

    return {
      id: row.id,
      email: row.email,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
    };
  }

  return null;
}
