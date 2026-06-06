import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createDiscoveryCloseToken,
  createDiscoveryIntakeToken,
  verifyDiscoveryToken,
} from "@/lib/discovery-token";

describe("discovery-token", () => {
  const prev = process.env.BALANCE_CAPTURE_SECRET;

  beforeEach(() => {
    process.env.BALANCE_CAPTURE_SECRET = "test-discovery-secret-32chars";
  });

  afterEach(() => {
    process.env.BALANCE_CAPTURE_SECRET = prev;
  });

  it("round-trips intake tokens", () => {
    const token = createDiscoveryIntakeToken("abc-123", 1_700_000_000_000);
    const payload = verifyDiscoveryToken(token!, "intake", 1_700_000_000_000);
    expect(payload?.prospectId).toBe("abc-123");
  });

  it("rejects wrong purpose", () => {
    const token = createDiscoveryIntakeToken("abc-123", 1_700_000_000_000);
    expect(verifyDiscoveryToken(token!, "close", 1_700_000_000_000)).toBeNull();
  });

  it("round-trips close tokens", () => {
    const token = createDiscoveryCloseToken("xyz", 1_700_000_000_000);
    expect(verifyDiscoveryToken(token!, "close", 1_700_000_000_000)?.prospectId).toBe("xyz");
  });
});
