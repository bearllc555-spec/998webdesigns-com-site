import { afterEach, describe, expect, it } from "vitest";
import { appEnv, hostPlatformLabel, isProductionApp } from "@/lib/app-env";

const env = process.env;

afterEach(() => {
  process.env = { ...env };
});

describe("appEnv", () => {
  it("prefers APP_ENV when set", () => {
    process.env.APP_ENV = "preview";
    delete process.env.CF_PAGES;
    delete process.env.VERCEL_ENV;
    expect(appEnv()).toBe("preview");
    expect(isProductionApp()).toBe(false);
  });

  it("treats CF Pages main branch as production", () => {
    delete process.env.APP_ENV;
    process.env.CF_PAGES = "1";
    process.env.CF_PAGES_BRANCH = "main";
    expect(appEnv()).toBe("production");
    expect(hostPlatformLabel()).toBe("cloudflare-pages");
  });

  it("treats CF Pages feature branch as preview", () => {
    delete process.env.APP_ENV;
    process.env.CF_PAGES = "1";
    process.env.CF_PAGES_BRANCH = "fix/cf-opennext-migration";
    expect(appEnv()).toBe("preview");
  });
});
