import { afterEach, describe, expect, it } from "vitest";
import { crmAdminSecret, crmAdminSecretSource } from "@/lib/crm-admin-secret";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("crmAdminSecret", () => {
  it("prefers CRM_ADMIN_SECRET when set", () => {
    process.env.CRM_ADMIN_SECRET = "crm-only-secret";
    process.env.BALANCE_CAPTURE_SECRET = "ops-secret";
    expect(crmAdminSecret()).toBe("crm-only-secret");
    expect(crmAdminSecretSource()).toBe("dedicated");
  });

  it("does not fall back to BALANCE_CAPTURE_SECRET in production", () => {
    process.env.APP_ENV = "production";
    delete process.env.CRM_ADMIN_SECRET;
    process.env.BALANCE_CAPTURE_SECRET = "ops-secret";
    expect(crmAdminSecret()).toBeNull();
    expect(crmAdminSecretSource()).toBe("missing");
  });

  it("allows balance fallback outside production", () => {
    delete process.env.APP_ENV;
    delete process.env.CF_PAGES;
    delete process.env.VERCEL_ENV;
    delete process.env.CRM_ADMIN_SECRET;
    process.env.BALANCE_CAPTURE_SECRET = "ops-secret";
    expect(crmAdminSecret()).toBe("ops-secret");
    expect(crmAdminSecretSource()).toBe("balance_fallback");
  });
});
