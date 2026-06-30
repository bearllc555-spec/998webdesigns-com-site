import { stripeKeyMode } from "@/lib/stripe-env";

const PRODUCTION_WEBHOOK_URL = "https://998webdesigns.com/api/stripe/webhook";

export const REQUIRED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.async_payment_failed",
] as const;

/** Month-to-month hosting lifecycle - subscribe in Stripe when billing monthly hosting clients. */
export const RECOMMENDED_SUBSCRIPTION_WEBHOOK_EVENTS = [
  "invoice.payment_failed",
  "customer.subscription.deleted",
] as const;

export type StripeOpsSnapshot = {
  achEnabled: boolean | null;
  webhookFound: boolean;
  webhookEvents: string[];
  missingWebhookEvents: string[];
  missingSubscriptionWebhookEvents: string[];
};

type StripeListResponse<T> = { data?: T[] };

type PaymentMethodConfigurationRow = {
  is_default?: boolean;
  active?: boolean;
  us_bank_account?: { available?: boolean };
};

type WebhookEndpointRow = {
  url?: string;
  status?: string;
  enabled_events?: string[];
};

/** Fetch Stripe REST list endpoints (Workers-safe; no Node Stripe SDK). */
async function stripeList<T>(secretKey: string, path: string): Promise<T[]> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) {
    throw new Error(`Stripe GET /v1/${path} → ${res.status}`);
  }
  const json = (await res.json()) as StripeListResponse<T>;
  return json.data ?? [];
}

function emptySnapshot(): StripeOpsSnapshot {
  return {
    achEnabled: null,
    webhookFound: false,
    webhookEvents: [],
    missingWebhookEvents: [...REQUIRED_WEBHOOK_EVENTS],
    missingSubscriptionWebhookEvents: [...RECOMMENDED_SUBSCRIPTION_WEBHOOK_EVENTS],
  };
}

/** Live Stripe account probes for env-status (no secret values returned). */
export async function probeStripeOps(): Promise<{
  snapshot: StripeOpsSnapshot | null;
  warnings: string[];
}> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  const mode = stripeKeyMode();
  if (!key || mode !== "live") {
    return { snapshot: null, warnings: [] };
  }

  const warnings: string[] = [];
  let snapshot: StripeOpsSnapshot = emptySnapshot();

  try {
    const configs = await stripeList<PaymentMethodConfigurationRow>(
      key,
      "payment_method_configurations?limit=10"
    );
    const pmc =
      configs.find((c) => c.is_default) ??
      configs.find((c) => c.active) ??
      configs[0];

    if (pmc) {
      snapshot.achEnabled = Boolean(pmc.us_bank_account?.available);
      if (!snapshot.achEnabled) {
        warnings.push(
          "Stripe: US bank account (ACH Direct Debit) is off - Settings → Payment methods."
        );
      }
    } else {
      warnings.push("Stripe: could not read payment method configuration for ACH status.");
    }

    const endpoints = await stripeList<WebhookEndpointRow>(key, "webhook_endpoints?limit=20");
    const hook = endpoints.find(
      (e) => e.url === PRODUCTION_WEBHOOK_URL && e.status === "enabled"
    );

    if (!hook) {
      warnings.push(`Stripe: no enabled webhook at ${PRODUCTION_WEBHOOK_URL}.`);
    } else {
      const enabledEvents = hook.enabled_events ?? [];
      snapshot = {
        ...snapshot,
        webhookFound: true,
        webhookEvents: enabledEvents,
        missingWebhookEvents: REQUIRED_WEBHOOK_EVENTS.filter(
          (ev) => !enabledEvents.includes(ev)
        ),
        missingSubscriptionWebhookEvents: RECOMMENDED_SUBSCRIPTION_WEBHOOK_EVENTS.filter(
          (ev) => !enabledEvents.includes(ev)
        ),
      };
      if (snapshot.missingWebhookEvents.length) {
        warnings.push(
          `Stripe webhook missing events: ${snapshot.missingWebhookEvents.join(", ")}.`
        );
      }
      if (snapshot.missingSubscriptionWebhookEvents.length) {
        warnings.push(
          `Stripe webhook missing subscription events: ${snapshot.missingSubscriptionWebhookEvents.join(", ")}.`
        );
      }
    }
  } catch {
    warnings.push(
      "Stripe dashboard probe failed - verify ACH and webhook manually in Stripe."
    );
    snapshot = emptySnapshot();
  }

  return { snapshot, warnings };
}
