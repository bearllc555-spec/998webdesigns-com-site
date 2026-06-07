import { afterEach, describe, expect, it, vi } from "vitest";
import {
  etDateKey,
  isVoiceDemoAllowlisted,
  msUntilNextEtMidnight,
  normalizeQuotaEmail,
  parseVoiceDemoAllowlistEmails,
  voiceDemoDailyMax,
} from "@/lib/voice-demo-daily-quota";

describe("voice-demo-daily-quota", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalizes email for quota keys", () => {
    expect(normalizeQuotaEmail("  Anthony@Example.COM ")).toBe("anthony@example.com");
    expect(normalizeQuotaEmail("")).toBeNull();
  });

  it("reads daily max from env with sane bounds", () => {
    expect(voiceDemoDailyMax()).toBe(3);
    vi.stubEnv("VOICE_DEMO_DAILY_MAX", "2");
    expect(voiceDemoDailyMax()).toBe(2);
    vi.stubEnv("VOICE_DEMO_DAILY_MAX", "99");
    expect(voiceDemoDailyMax()).toBe(20);
  });

  it("parses allowlist emails", () => {
    vi.stubEnv("VOICE_DEMO_ALLOWLIST_EMAILS", "Dev@998.com, bearllc555@gmail.com");
    expect(parseVoiceDemoAllowlistEmails()).toEqual(
      new Set(["dev@998.com", "bearllc555@gmail.com"])
    );
    expect(isVoiceDemoAllowlisted({ email: "bearllc555@gmail.com" })).toBe(true);
    expect(isVoiceDemoAllowlisted({ email: "stranger@example.com" })).toBe(false);
  });

  it("allowlists configured IPs", () => {
    vi.stubEnv("VOICE_DEMO_ALLOWLIST_IPS", "127.0.0.1, 192.168.1.5");
    expect(isVoiceDemoAllowlisted({ email: "a@b.com", ip: "127.0.0.1" })).toBe(true);
    expect(isVoiceDemoAllowlisted({ email: "a@b.com", ip: "8.8.8.8" })).toBe(false);
  });

  it("formats ET date keys", () => {
    expect(etDateKey(new Date("2026-06-07T12:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(msUntilNextEtMidnight()).toBeGreaterThan(0);
  });
});
