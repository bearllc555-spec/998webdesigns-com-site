import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createHostingPortalToken,
  verifyHostingPortalToken,
} from "@/lib/hosting-portal-token";

describe("hosting-portal-token", () => {
  const prev = process.env.BALANCE_CAPTURE_SECRET;

  beforeEach(() => {
    process.env.BALANCE_CAPTURE_SECRET = "test-portal-secret-32chars-min";
  });

  afterEach(() => {
    process.env.BALANCE_CAPTURE_SECRET = prev;
  });

  it("round-trips a valid token", () => {
    const token = createHostingPortalToken("Client@Example.com", "cus_abc123", 1_700_000_000_000);
    expect(token).toBeTruthy();
    const payload = verifyHostingPortalToken(token!, 1_700_000_000_000);
    expect(payload?.email).toBe("client@example.com");
    expect(payload?.customerId).toBe("cus_abc123");
  });

  it("rejects expired tokens", () => {
    const token = createHostingPortalToken("a@b.co", "cus_x", 1_700_000_000_000);
    const payload = verifyHostingPortalToken(token!, 1_700_000_000_000 + 16 * 60 * 1000);
    expect(payload).toBeNull();
  });

  it("rejects tampered tokens", () => {
    const token = createHostingPortalToken("a@b.co", "cus_x", 1_700_000_000_000)!;
    const tampered = `${token}x`;
    expect(verifyHostingPortalToken(tampered, 1_700_000_000_000)).toBeNull();
  });

  it("returns null when secret missing", () => {
    delete process.env.BALANCE_CAPTURE_SECRET;
    expect(createHostingPortalToken("a@b.co", "cus_x")).toBeNull();
  });
});
