import { crmAdminSecretSource } from "@/lib/crm-admin-secret";
import { stripeKeyMode, type StripeKeyMode } from "@/lib/stripe-env";
import { probeStripeOps, type StripeOpsSnapshot } from "@/lib/stripe-ops-check";
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
  crmAdminSecretSource: "dedicated" | "balance_fallback" | "missing";
  cronSecretConfigured: boolean;
  twilioVerifyConfigured: boolean;
  stripeOps: StripeOpsSnapshot | null;
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

  const { snapshot: stripeOps, warnings: stripeWarnings } = await probeStripeOps();
  warnings.push(...stripeWarnings);
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
  } else if (!supabase.stripeSubscriptionColumn) {
    warnings.push(
      "wd_leads.stripe_subscription_id column missing — run supabase/migrations/20260602120000_wd_leads_stripe_subscription.sql."
    );
  } else if (!supabase.hostingBillingColumns) {
    warnings.push(
      "wd_leads hosting billing columns missing — POST /api/admin/migrate-hosting-billing with BALANCE_CAPTURE_SECRET."
    );
  } else if (!supabase.crmTelegramSettingsTable) {
    warnings.push(
      "crm_telegram_settings table missing — POST /api/admin/migrate-crm-telegram with BALANCE_CAPTURE_SECRET."
    );
  } else if (!supabase.processedStripeEventsTable) {
    warnings.push(
      "processed_stripe_events table missing — run supabase/migrations/20260605140000_processed_stripe_events.sql."
    );
  } else if (!supabase.discoveryProspectsTable) {
    warnings.push(
      "discovery_prospects table missing — POST /api/admin/migrate-discovery with BALANCE_CAPTURE_SECRET."
    );
  }
  const crmSecretSource = crmAdminSecretSource();
  if (vercelEnv === "production" && crmSecretSource !== "dedicated") {
    warnings.push(
      "CRM_ADMIN_SECRET missing on Production — /crm login disabled until set (do not reuse BALANCE_CAPTURE_SECRET)."
    );
  }
  if (!process.env.BALANCE_CAPTURE_SECRET?.trim()) {
    warnings.push("BALANCE_CAPTURE_SECRET missing — env-status API returns 503.");
  }
  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());
  if (vercelEnv === "production" && !cronSecretConfigured) {
    warnings.push(
      "CRON_SECRET not set — ten-year hosting cron uses BALANCE_CAPTURE_SECRET fallback."
    );
  }
  const twilioVerifyConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_VERIFY_SERVICE_SID?.trim()
  );
  if (vercelEnv === "production" && !twilioVerifyConfigured) {
    warnings.push(
      "Twilio Verify env missing — /book discovery SMS step disabled until TWILIO_* vars are set."
    );
  }

  const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
  const supabaseConfigured =
    supabase.configured && supabase.wdLeadsTable && supabase.apiRateLimitsTable;
  const adminAuthConfigured = Boolean(process.env.BALANCE_CAPTURE_SECRET?.trim());

  const readyForLiveCharges =
    mode === "live" &&
    webhookSecretPresent &&
    resendConfigured &&
    !modeMismatch &&
    supabaseConfigured &&
    supabase.stripeSubscriptionColumn &&
    supabase.hostingBillingColumns;

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
    crmAdminSecretSource: crmSecretSource,
    cronSecretConfigured,
    twilioVerifyConfigured,
    stripeOps,
    warnings,
    readyForLiveCharges,
  };
}
