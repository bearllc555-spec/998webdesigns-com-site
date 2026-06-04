import { supabaseAdmin } from "@/lib/supabase";

export type SupabaseHealth = {
  configured: boolean;
  wdLeadsTable: boolean;
  apiRateLimitsTable: boolean;
  contactSubmissionsTable: boolean;
  stripeSubscriptionColumn: boolean;
};

/** Lightweight schema probe (no row data returned). */
export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const supa = supabaseAdmin();
  if (!supa) {
    return {
      configured: false,
      wdLeadsTable: false,
      apiRateLimitsTable: false,
      contactSubmissionsTable: false,
      stripeSubscriptionColumn: false,
    };
  }

  const [leads, limits, contacts, subscriptionCol] = await Promise.all([
    supa.from("wd_leads").select("id", { head: true, count: "exact" }).limit(0),
    supa
      .from("api_rate_limits")
      .select("rate_key", { head: true, count: "exact" })
      .limit(0),
    supa
      .from("contact_submissions")
      .select("id", { head: true, count: "exact" })
      .limit(0),
    supa
      .from("wd_leads")
      .select("stripe_subscription_id", { head: true, count: "exact" })
      .limit(0),
  ]);

  return {
    configured: true,
    wdLeadsTable: !isMissingTable(leads.error),
    apiRateLimitsTable: !isMissingTable(limits.error),
    contactSubmissionsTable: !isMissingTable(contacts.error),
    stripeSubscriptionColumn: !isMissingColumn(subscriptionCol.error),
  };
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? "";
  const msg = error.message ?? "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    /schema cache/i.test(msg) ||
    /does not exist/i.test(msg)
  );
}

function isMissingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = error.message ?? "";
  return /column/i.test(msg) && /does not exist/i.test(msg);
}
