import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/api-rate-limit", () => ({
  enforceApiRateLimit: vi.fn(async () => ({ allowed: true, retryAfterSec: 0 })),
  rateLimitResponse: vi.fn(() => ({ error: "Too many requests", status: 429, headers: {} })),
}));

vi.mock("@/lib/contact-db", () => ({
  insertContactSubmission: vi.fn(async () => ({ ok: true })),
}));

vi.mock("@/lib/crm-notify", () => ({
  notifyCrmActivity: vi.fn(),
}));

function contactRequest(body: unknown) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it("silently accepts honeypot submissions", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      contactRequest({
        name: "Bot",
        email: "bot@example.com",
        message: "spam",
        website: "https://spam.test",
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("./route");
    const res = await POST(contactRequest({ email: "a@example.com", message: "hi" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/name/i);
  });

  it("returns 400 for invalid email", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      contactRequest({ name: "Ann", email: "not-an-email", message: "hello" })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/email/i);
  });

  it("returns 500 when Resend is not configured", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      contactRequest({ name: "Ann", email: "ann@example.com", message: "hello" })
    );
    expect(res.status).toBe(500);
  });
});
