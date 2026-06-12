import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-rate-limit", () => ({
  enforceApiRateLimit: vi.fn(async () => ({ allowed: true, retryAfterSec: 0 })),
  rateLimitResponse: vi.fn(() => ({ error: "Too many requests", status: 429, headers: {} })),
}));

vi.mock("@/lib/leads-db", () => ({
  insertWdLead: vi.fn(async () => ({ ok: true, id: "lead-1" })),
}));

vi.mock("@/lib/crm-notify", () => ({
  notifyCrmActivity: vi.fn(),
}));

vi.mock("@/lib/internal-lead-email", () => ({
  sendInternalLeadSubmittedEmail: vi.fn(async () => {}),
}));

vi.mock("@/lib/wd-leads-sync", () => ({
  syncWdLeadCheckoutCreated: vi.fn(async () => {}),
}));

vi.mock("@/lib/lead-email", () => ({
  sendLeadCheckoutEmail: vi.fn(async () => {}),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(async () => ({ id: "cs_test", url: "https://checkout.stripe.test" })),
      },
    },
  },
}));

import { POST } from "./route";

function leadsRequest(body: unknown) {
  return new NextRequest("http://localhost/api/leads", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

const validLead = {
  fullName: "Jane Doe",
  email: "jane@example.com",
  businessName: "Jane Plumbing",
  businessType: "plumber",
  serviceArea: "Essex County, NJ",
  projectGoal: "more_calls",
  hostingChoice: "monthly",
  paymentChannel: "card",
  addons: [],
};

describe("POST /api/leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("silently accepts honeypot submissions", async () => {
    const res = await POST(leadsRequest({ ...validLead, website: "https://spam.test" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, ignored: true });
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when validation fails", async () => {
    const res = await POST(leadsRequest({ email: "bad" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBeTruthy();
  });
});
