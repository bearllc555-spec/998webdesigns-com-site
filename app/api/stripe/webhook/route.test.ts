import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const constructEvent = vi.fn();
const claimStripeWebhookEvent = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent,
    },
  },
}));

vi.mock("@/lib/stripe-webhook-idempotency", () => ({
  claimStripeWebhookEvent,
}));

vi.mock("@/lib/wd-leads-sync", () => ({
  syncWdLeadPaidInFull: vi.fn(async () => {}),
  syncWdLeadAwaitingBankSettlement: vi.fn(async () => {}),
  syncWdLeadBankPaymentFailed: vi.fn(async () => {}),
}));

vi.mock("@/lib/internal-lead-email", () => ({
  sendInternalPaymentEmail: vi.fn(async () => {}),
  sendInternalAchFailedEmail: vi.fn(async () => {}),
}));

vi.mock("@/lib/crm-notify-stripe", () => ({
  notifyLeadPaid: vi.fn(),
  notifyLeadAchPending: vi.fn(),
  notifyLeadAchFailed: vi.fn(),
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
});
