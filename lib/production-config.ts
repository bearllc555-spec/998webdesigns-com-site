import { stripeKeyMode, type StripeKeyMode } from "@/lib/stripe-env";
import { checkSupabaseHealth, type SupabaseHealth } from "@/lib/supabase-health";

export type ProductionConfigStatus = {
  vercelEnv: string;
  supabase: SupabaseHealth;
  stripe: {
    mode: StripeKeyMode;
    keyPresent: boolean;
    webhookSecretPresent: boolean;
    expectedMode: string | null;
    modeMismatch: boolean;
  };
  resendConfigured: boolean;
  supabaseConfigured: boolean;
  adminAuthConfigured: boolean;
  warnings: string[];
  readyForLiveCharges: boolean;
};

/**
 * Snapshot of production-critical env wiring (no secret values returned).
 * Call from GET /api/admin/env-status with BALANCE_CAPTURE_SECRET.
 */
export async function getProductionConfigStatus(): Promise<ProductionConfigStatus> {
  const warnings: string[] = [];
  const vercelEnv = process.env.VERCEL_ENV ?? "local";
  const supabase = await checkSupabaseHealth();
  const mode = stripeKeyMode();
  const keyPresent = mode !== "missing";
  const webhookSecretPresent = Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
  const expectedMode = process.env.STRIPE_EXPECTED_MODE?.trim().toLowerCase() ?? null;

  let modeMismatch = false;
  if (expectedMode === "live" && mode !== "live") {
    modeMismatch = true;
    warnings.push(
      "STRIPE_EXPECTED_MODE=live but STRIPE_SECRET_KEY is not sk_live_. Real cards will fail."
    );
  }
  if (expectedMode === "test" && mode === "live") {
    modeMismatch = true;
    warnings.push(
      "STRIPE_EXPECTED_MODE=test but STRIPE_SECRET_KEY is sk_live_. Sandbox cards will fail."
    );
  }
  if (vercelEnv === "production" && mode === "test") {
    warnings.push(
      "Production is using sk_test_. Intentional until go-live; set STRIPE_EXPECTED_MODE=test to acknowledge."
    );
  }
  if (vercelEnv === "production" && mode === "live" && !webhookSecretPresent) {
    warnings.push("STRIPE_WEBHOOK_SECRET missing on Production.");
  }
  if (keyPresent && webhookSecretPresent) {
    warnings.push(
      "Stripe Dashboard: enable ACH Direct Debit (Payment methods) and subscribe the webhook to checkout.session.completed, checkout.session.async_payment_succeeded, and checkout.session.async_payment_failed."
    );
  }
  if (!process.env.RESEND_API_KEY?.trim()) {
    warnings.push("RESEND_API_KEY missing — contact and lead emails will fail.");
  }
  if (!supabase.configured) {
    warnings.push(
      "Supabase service role not configured — wd_leads and distributed rate limits degraded."
    );
  } else if (!supabase.wdLeadsTable) {
    warnings.push("wd_leads table missing — run supabase/schema.sql in Supabase SQL editor.");
  } else if (!supabase.apiRateLimitsTable) {
    warnings.push(
      "api_rate_limits table missing — run supabase/schema.sql for global rate limits."
    );
  } else if (!supabase.contactSubmissionsTable) {
    warnings.push(
      "contact_submissions table missing — run supabase/contact-submissions.sql in Supabase SQL editor."
    );
  }
  if (!process.env.BALANCE_CAPTURE_SECRET?.trim()) {
    warnings.push("BALANCE_CAPTURE_SECRET missing — env-status API returns 503.");
  }

  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const supabaseConfigured =
    supabase.configured && supabase.wdLeadsTable && supabase.apiRateLimitsTable;
  const adminAuthConfigured = Boolean(process.env.BALANCE_CAPTURE_SECRET?.trim());

  const readyForLiveCharges =
    mode === "live" &&
    webhookSecretPresent &&
    resendConfigured &&
    !modeMismatch;

  return {
    vercelEnv,
    supabase,
    stripe: {
      mode,
      keyPresent,
      webhookSecretPresent,
      expectedMode,
      modeMismatch,
    },
    resendConfigured,
    supabaseConfigured,
    adminAuthConfigured,
    warnings,
    readyForLiveCharges,
  };
}
