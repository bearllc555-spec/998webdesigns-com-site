import Stripe from "stripe";
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
  let snapshot: StripeOpsSnapshot = {
    achEnabled: null,
    webhookFound: false,
    webhookEvents: [],
    missingWebhookEvents: [...REQUIRED_WEBHOOK_EVENTS],
    missingSubscriptionWebhookEvents: [...RECOMMENDED_SUBSCRIPTION_WEBHOOK_EVENTS],
  };

  try {
    const stripe = new Stripe(key);
    const configs = await stripe.paymentMethodConfigurations.list({ limit: 10 });
    const pmc =
      configs.data.find((c) => c.is_default) ??
      configs.data.find((c) => c.active) ??
      configs.data[0];

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

    const endpoints = await stripe.webhookEndpoints.list({ limit: 20 });
    const hook = endpoints.data.find(
      (e) => e.url === PRODUCTION_WEBHOOK_URL && e.status === "enabled"
    );

    if (!hook) {
      warnings.push(
        `Stripe: no enabled webhook at ${PRODUCTION_WEBHOOK_URL}.`
      );
    } else {
      snapshot.webhookFound = true;
      snapshot.webhookEvents = hook.enabled_events;
      snapshot.missingWebhookEvents = REQUIRED_WEBHOOK_EVENTS.filter(
        (ev) => !hook.enabled_events.includes(ev)
      );
      snapshot.missingSubscriptionWebhookEvents =
        RECOMMENDED_SUBSCRIPTION_WEBHOOK_EVENTS.filter(
          (ev) => !hook.enabled_events.includes(ev)
        );
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
    snapshot = {
      achEnabled: null,
      webhookFound: false,
      webhookEvents: [],
      missingWebhookEvents: [...REQUIRED_WEBHOOK_EVENTS],
      missingSubscriptionWebhookEvents: [...RECOMMENDED_SUBSCRIPTION_WEBHOOK_EVENTS],
    };
  }

  return { snapshot, warnings };
}
