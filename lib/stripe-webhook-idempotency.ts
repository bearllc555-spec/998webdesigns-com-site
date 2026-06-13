import { supabaseAdmin } from "@/lib/supabase";

export type WebhookClaimResult = "new" | "duplicate" | "unavailable";

const MEMORY_MAX = 5_000;
const memoryProcessed = new Set<string>();

function markMemoryProcessed(eventId: string): void {
  memoryProcessed.add(eventId);
  if (memoryProcessed.size > MEMORY_MAX) {
    const oldest = memoryProcessed.values().next().value;
    if (oldest) memoryProcessed.delete(oldest);
  }
}

function isMemoryDuplicate(eventId: string): boolean {
  return memoryProcessed.has(eventId);
}

/**
 * Reserve event_id before handling. Returns duplicate when Stripe retries a completed event.
 * unavailable = no Supabase or table missing - in-memory dedup applies for this instance.
 */
export async function claimStripeWebhookEvent(eventId: string): Promise<WebhookClaimResult> {
  if (isMemoryDuplicate(eventId)) return "duplicate";

  const supa = supabaseAdmin();
  if (!supa) return "unavailable";

  const { error } = await supa.from("processed_stripe_events").insert({ event_id: eventId });

  if (!error) return "new";

  const code = error.code ?? "";
  const msg = error.message ?? "";
  if (code === "23505" || /duplicate key/i.test(msg)) return "duplicate";
  if (code === "PGRST205" || code === "42P01" || /does not exist/i.test(msg)) {
    console.warn("[webhook] processed_stripe_events table missing - run latest Supabase migration");
    return "unavailable";
  }

  console.error("[webhook] idempotency insert failed:", error.message);
  return "unavailable";
}

/**
 * Drop a failed claim so Stripe retries can re-run the handler (fixes poison-pill on 500).
 */
export async function releaseStripeWebhookClaim(eventId: string): Promise<void> {
  memoryProcessed.delete(eventId);

  const supa = supabaseAdmin();
  if (!supa) return;

  const { error } = await supa.from("processed_stripe_events").delete().eq("event_id", eventId);
  if (error) {
    console.error("[webhook] idempotency release failed:", error.message);
  }
}

/** Call after a successful handler when claim was unavailable (no Postgres row inserted). */
export function markStripeWebhookProcessedInMemory(eventId: string): void {
  markMemoryProcessed(eventId);
}
