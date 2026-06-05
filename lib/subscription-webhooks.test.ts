import { describe, expect, it, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

const {
  updateLatestWdLeadBySubscriptionId,
  sendInternalHostingRenewalFailedEmail,
  sendInternalHostingCanceledEmail,
} = vi.hoisted(() => ({
  updateLatestWdLeadBySubscriptionId: vi.fn(),
  sendInternalHostingRenewalFailedEmail: vi.fn(),
  sendInternalHostingCanceledEmail: vi.fn(),
}));

vi.mock("@/lib/leads-db", () => ({
  updateLatestWdLeadBySubscriptionId,
}));

vi.mock("@/lib/internal-lead-email", () => ({
  sendInternalHostingRenewalFailedEmail,
  sendInternalHostingCanceledEmail,
}));

vi.mock("@/lib/crm-notify-stripe", () => ({
  notifyHostingRenewalFailed: vi.fn(),
  notifyHostingCanceled: vi.fn(),
}));

import {
  handleInvoicePaymentFailed,
  handleSubscriptionDeleted,
} from "@/lib/subscription-webhooks";

describe("subscription webhooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateLatestWdLeadBySubscriptionId.mockResolvedValue(undefined);
    sendInternalHostingRenewalFailedEmail.mockResolvedValue(undefined);
    sendInternalHostingCanceledEmail.mockResolvedValue(undefined);
  });

  it("ignores invoice.payment_failed without a subscription", async () => {
    await handleInvoicePaymentFailed({
      id: "in_1",
      parent: null,
      lines: { data: [] },
    } as Stripe.Invoice);
    expect(updateLatestWdLeadBySubscriptionId).not.toHaveBeenCalled();
    expect(sendInternalHostingRenewalFailedEmail).not.toHaveBeenCalled();
  });

  it("syncs and emails on subscription invoice failure", async () => {
    await handleInvoicePaymentFailed({
      id: "in_1",
      amount_due: 19800,
      currency: "usd",
      parent: {
        type: "subscription_details",
        subscription_details: { subscription: "sub_123" },
      },
      lines: { data: [] },
    } as Stripe.Invoice);
    expect(updateLatestWdLeadBySubscriptionId).toHaveBeenCalledWith("sub_123", {
      status: "hosting_payment_failed",
    });
    expect(sendInternalHostingRenewalFailedEmail).toHaveBeenCalled();
  });

  it("marks hosting canceled on subscription.deleted", async () => {
    await handleSubscriptionDeleted({
      id: "sub_123",
      status: "canceled",
    } as Stripe.Subscription);
    expect(updateLatestWdLeadBySubscriptionId).toHaveBeenCalledWith("sub_123", {
      status: "hosting_canceled",
      stripe_subscription_id: null,
    });
    expect(sendInternalHostingCanceledEmail).toHaveBeenCalled();
  });
});
