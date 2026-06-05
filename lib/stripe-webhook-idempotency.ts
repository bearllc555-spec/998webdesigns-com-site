import { supabaseAdmin } from "@/lib/supabase";

export type WebhookClaimResult = "new" | "duplicate" | "unavailable";

/**
 * Insert event_id before handling. Returns duplicate when Stripe retries the same event.
 * unavailable = no Supabase or table missing — caller may still process (legacy behavior).
 */
export async function claimStripeWebhookEvent(eventId: string): Promise<WebhookClaimResult> {
  const supa = supabaseAdmin();
  if (!supa) return "unavailable";

  const { error } = await supa.from("processed_stripe_events").insert({ event_id: eventId });

  if (!error) return "new";

  const code = error.code ?? "";
  const msg = error.message ?? "";
  if (code === "23505" || /duplicate key/i.test(msg)) return "duplicate";
  if (code === "PGRST205" || code === "42P01" || /does not exist/i.test(msg)) {
    console.warn("[webhook] processed_stripe_events table missing — run latest Supabase migration");
    return "unavailable";
  }

  console.error("[webhook] idempotency insert failed:", error.message);
  return "unavailable";
}
