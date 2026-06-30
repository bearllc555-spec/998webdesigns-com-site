import { afterEach, describe, expect, it, vi } from "vitest";
import { probeStripeOps } from "@/lib/stripe-ops-check";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
  vi.unstubAllGlobals();
});

describe("probeStripeOps", () => {
  it("returns null snapshot when not live", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
    const result = await probeStripeOps();
    expect(result.snapshot).toBeNull();
    expect(result.warnings).toEqual([]);
  });

  it("reports webhook + ACH from Stripe REST responses", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_probe_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("payment_method_configurations")) {
          return new Response(
            JSON.stringify({
              data: [{ is_default: true, us_bank_account: { available: true } }],
            }),
            { status: 200 }
          );
        }
        if (String(url).includes("webhook_endpoints")) {
          return new Response(
            JSON.stringify({
              data: [
                {
                  url: "https://998webdesigns.com/api/stripe/webhook",
                  status: "enabled",
                  enabled_events: [
                    "checkout.session.completed",
                    "checkout.session.async_payment_succeeded",
                    "checkout.session.async_payment_failed",
                    "invoice.payment_failed",
                    "customer.subscription.deleted",
                  ],
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response("not found", { status: 404 });
      })
    );

    const result = await probeStripeOps();
    expect(result.warnings).toEqual([]);
    expect(result.snapshot).toMatchObject({
      achEnabled: true,
      webhookFound: true,
      missingWebhookEvents: [],
      missingSubscriptionWebhookEvents: [],
    });
  });

  it("warns when Stripe REST probe fails", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_probe_test";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("error", { status: 500 }))
    );

    const result = await probeStripeOps();
    expect(result.warnings).toContain(
      "Stripe dashboard probe failed - verify ACH and webhook manually in Stripe."
    );
    expect(result.snapshot?.webhookFound).toBe(false);
  });
});
