import { randomBytes } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { getLatestPlumbingJobForLead } from "@/lib/voice-demo-plumbing-db";

/** Client-facing coupon prefix — Metro Plumbing & Drain demo. */
export const PLUMBING_PROMO_CODE_PREFIX = "MPD-";

const PROMO_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** e.g. MPD-K7N2P4 — avoids O/0 and I/1 for phone/readability. */
export function generatePlumbingPromoCode(): string {
  const bytes = randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += PROMO_ALPHABET[bytes[i]! % PROMO_ALPHABET.length];
  }
  return `${PLUMBING_PROMO_CODE_PREFIX}${suffix}`;
}

export function isPlumbingPromoCode(value: string): boolean {
  return /^MPD-[A-Z2-9]{6}$/.test(value.trim().toUpperCase());
}

/** Allocate a unique code for this job (retries on rare collision). */
export async function allocateUniquePlumbingPromoCode(): Promise<string | null> {
  const supa = supabaseAdmin();
  if (!supa) return null;

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generatePlumbingPromoCode();
    const { data, error } = await supa
      .from("jarvis_plumbing_jobs")
      .select("id")
      .eq("promo_code", code)
      .maybeSingle();
    if (error) continue;
    if (!data) return code;
  }
  return null;
}

/** Reuse an existing job code or allocate a new unique one for lead tracking. */
export async function resolvePlumbingPromoCodeForLead(
  leadId: string,
  grantPromo: boolean
): Promise<string | null> {
  if (!grantPromo) return null;
  const existing = await getLatestPlumbingJobForLead(leadId);
  if (existing?.promo_code) return existing.promo_code;
  return allocateUniquePlumbingPromoCode();
}
