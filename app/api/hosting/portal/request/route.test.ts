import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/hosting-portal-leads", () => ({
  findHostingPortalLeadByEmail: vi.fn(async () => null),
}));

vi.mock("@/lib/hosting-portal-email", () => ({
  sendHostingPortalMagicLinkEmail: vi.fn(async () => true),
}));

import { POST } from "./route";

function portalRequest(body: unknown) {
  return new NextRequest("http://localhost/api/hosting/portal/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/hosting/portal/request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BALANCE_CAPTURE_SECRET = "test-portal-secret-32chars-min";
  });

  it("returns generic ok without throwing when rate limit path is registered", async () => {
    const res = await POST(portalRequest({ email: "ademeo@gmail.com", website: "" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(portalRequest({ email: "not-an-email", website: "" }));
    expect(res.status).toBe(400);
  });
});
