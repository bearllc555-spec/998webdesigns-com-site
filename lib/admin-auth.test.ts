import { describe, expect, it } from "vitest";
import { verifyBearerSecret } from "@/lib/admin-auth";

describe("verifyBearerSecret", () => {
  const secret = "test-secret-value-32chars-min!!!!";

  it("accepts matching bearer token", () => {
    expect(verifyBearerSecret(`Bearer ${secret}`, secret)).toBe(true);
  });

  it("rejects wrong token", () => {
    expect(verifyBearerSecret("Bearer wrong", secret)).toBe(false);
  });

  it("rejects missing bearer prefix", () => {
    expect(verifyBearerSecret(secret, secret)).toBe(false);
  });
});
