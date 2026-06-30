import { describe, expect, it } from "vitest";
import { resolveCheckoutOrigin } from "@/lib/checkout-origin";
import { SITE_ORIGIN } from "@/lib/site-origin";

describe("resolveCheckoutOrigin", () => {
  it("defaults to production when origin missing", () => {
    expect(resolveCheckoutOrigin(null, {})).toBe(SITE_ORIGIN);
  });

  it("allows production domain", () => {
    expect(resolveCheckoutOrigin(SITE_ORIGIN, {})).toBe(SITE_ORIGIN);
  });

  it("normalizes www to apex canonical", () => {
    expect(resolveCheckoutOrigin("https://www.998webdesigns.com", {})).toBe(
      SITE_ORIGIN,
    );
  });

  it("blocks unknown origins", () => {
    expect(resolveCheckoutOrigin("https://evil.example", {})).toBe(SITE_ORIGIN);
  });

  it("allows localhost in development", () => {
    expect(
      resolveCheckoutOrigin("http://localhost:3000", { NODE_ENV: "development" })
    ).toBe("http://localhost:3000");
  });

  it("allows Cloudflare Pages preview origin", () => {
    expect(
      resolveCheckoutOrigin("https://fix-cf-opennext-migration.998webdesigns-com-site.pages.dev", {
        CF_PAGES: "1",
        CF_PAGES_BRANCH: "fix-cf-opennext-migration",
      })
    ).toBe("https://fix-cf-opennext-migration.998webdesigns-com-site.pages.dev");
  });

  it("allows Cloudflare Workers preview origin", () => {
    expect(
      resolveCheckoutOrigin("https://998webdesigns-com-site.bearllc555.workers.dev", {
        HOST_PLATFORM: "cloudflare-workers",
        APP_ENV: "preview",
      })
    ).toBe("https://998webdesigns-com-site.bearllc555.workers.dev");
  });
});
