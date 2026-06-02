import { describe, expect, it } from "vitest";
import { resolveCheckoutOrigin } from "@/lib/checkout-origin";

describe("resolveCheckoutOrigin", () => {
  it("defaults to production when origin missing", () => {
    expect(resolveCheckoutOrigin(null, {})).toBe("https://998webdesigns.com");
  });

  it("allows production domain", () => {
    expect(resolveCheckoutOrigin("https://998webdesigns.com", {})).toBe(
      "https://998webdesigns.com"
    );
  });

  it("blocks unknown origins", () => {
    expect(resolveCheckoutOrigin("https://evil.example", {})).toBe(
      "https://998webdesigns.com"
    );
  });

  it("allows localhost in development", () => {
    expect(
      resolveCheckoutOrigin("http://localhost:3000", { NODE_ENV: "development" })
    ).toBe("http://localhost:3000");
  });
});
