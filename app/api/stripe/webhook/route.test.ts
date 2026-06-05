import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const constructEvent = vi.fn();
const claimStripeWebhookEvent = vi.fn();
const releaseStripeWebhookClaim = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent,
    },
  },
}));

vi.mock("@/lib/stripe-webhook-idempotency", () => ({
  claimStripeWebhookEvent,
  releaseStripeWebhookClaim,
  markStripeWebhookProcessedInMemory: vi.fn(),
}));

vi.mock("@/lib/wd-leads-sync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/wd-leads-sync")>();
  return {
    ...actual,
    syncWdLeadPaidInFull: vi.fn(async () => {}),
    syncWdLeadAwaitingBankSettlement: vi.fn(async () => {}),
    syncWdLeadBankPaymentFailed: vi.fn(async () => {}),
  };
});

vi.mock("@/lib/internal-lead-email", () => ({
  sendInternalPaymentEmail: vi.fn(async () => {}),
  sendInternalLifetimeHostingPaidEmail: vi.fn(async () => {}),
  sendInternalAchFailedEmail: vi.fn(async () => {}),
}));

vi.mock("@/lib/crm-notify-stripe", () => ({
  notifyLeadPaid: vi.fn(),
  notifyLeadAchPending: vi.fn(),
  notifyLeadAchFailed: vi.fn(),
  notifyLifetimeHostingPaid: vi.fn(),
  notifyLifetimeHostingAchPending: vi.fn(),
}));

vi.mock("@/lib/subscription-webhooks", () => ({
  handleInvoicePaymentFailed: vi.fn(async () => {}),
  handleSubscriptionDeleted: vi.fn(async () => {}),
}));

function webhookRequest(body = "{}") {
  return new NextRequest("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("POST /api/stripe/webhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    claimStripeWebhookEvent.mockResolvedValue("new");
    releaseStripeWebhookClaim.mockResolvedValue(undefined);
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(webhookRequest());
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "sig",
      },
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("short-circuits duplicate events without running handlers", async () => {
    constructEvent.mockReturnValue({
      id: "evt_dup",
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", payment_status: "paid", metadata: {} } },
    });
    claimStripeWebhookEvent.mockResolvedValue("duplicate");

    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "sig",
      },
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, duplicate: true });

    const { syncWdLeadPaidInFull } = await import("@/lib/wd-leads-sync");
    expect(syncWdLeadPaidInFull).not.toHaveBeenCalled();
  });

  it("alerts lifetime hosting paid without design-fee alerts", async () => {
    constructEvent.mockReturnValue({
      id: "evt_lifetime",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_lifetime",
          payment_status: "paid",
          metadata: {
            paymentType: "lifetime_hosting",
            businessName: "Acme Plumbing",
            fullName: "Jane Doe",
            email: "jane@example.com",
          },
        },
      },
    });

    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "stripe-signature": "sig",
      },
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const { syncWdLeadPaidInFull } = await import("@/lib/wd-leads-sync");
    const { sendInternalPaymentEmail, sendInternalLifetimeHostingPaidEmail } =
      await import("@/lib/internal-lead-email");
    const { notifyLeadPaid, notifyLifetimeHostingPaid } =
      await import("@/lib/crm-notify-stripe");

    expect(syncWdLeadPaidInFull).toHaveBeenCalled();
    expect(sendInternalLifetimeHostingPaidEmail).toHaveBeenCalled();
    expect(notifyLifetimeHostingPaid).toHaveBeenCalled();
    expect(sendInternalPaymentEmail).not.toHaveBeenCalled();
    expect(notifyLeadPaid).not.toHaveBeenCalled();
  });
});
