import { createHmac } from "crypto";
import { describe, expect, it, vi } from "vitest";
import {
  extractCalendlyInviteePayload,
  verifyCalendlyWebhookSignature,
} from "@/lib/calendly-webhook";
import { buildDiscoveryBookCallUrl } from "@/lib/discovery-scheduling";

describe("verifyCalendlyWebhookSignature", () => {
  it("accepts a valid signature", () => {
    vi.stubEnv("CALENDLY_WEBHOOK_SIGNING_KEY", "test-signing-key");
    const body = '{"event":"invitee.created"}';
    const timestamp = "1700000000";
    const signature = createHmac("sha256", "test-signing-key")
      .update(`${timestamp}.${body}`)
      .digest("hex");

    expect(
      verifyCalendlyWebhookSignature(body, `t=${timestamp},v1=${signature}`)
    ).toBe(true);
    vi.unstubAllEnvs();
  });

  it("rejects invalid signatures", () => {
    vi.stubEnv("CALENDLY_WEBHOOK_SIGNING_KEY", "test-signing-key");
    expect(verifyCalendlyWebhookSignature("{}", "t=1,v1=deadbeef")).toBe(false);
    vi.unstubAllEnvs();
  });
});

describe("extractCalendlyInviteePayload", () => {
  it("reads email, start time, and utm_campaign prospect id", () => {
    const payload = extractCalendlyInviteePayload({
      email: "lex@example.com",
      uri: "https://api.calendly.com/scheduled_events/abc/invitees/def",
      scheduled_event: { start_time: "2026-06-21T15:00:00.000000Z" },
      tracking: { utm_campaign: "prospect-uuid-1" },
    });

    expect(payload).toEqual({
      email: "lex@example.com",
      uri: "https://api.calendly.com/scheduled_events/abc/invitees/def",
      eventStartAt: "2026-06-21T15:00:00.000000Z",
      prospectId: "prospect-uuid-1",
    });
  });
});

describe("buildDiscoveryBookCallUrl", () => {
  it("prefills Calendly and tags utm_campaign with prospect id", () => {
    const url = buildDiscoveryBookCallUrl({
      fullName: "Lexxy T",
      email: "lex@example.com",
      prospectId: "11111111-2222-3333-4444-555555555555",
    });

    const parsed = new URL(url);
    expect(parsed.hostname).toBe("calendly.com");
    expect(parsed.pathname).toContain("998webdesigns");
    expect(parsed.searchParams.get("name")).toBe("Lexxy T");
    expect(parsed.searchParams.get("email")).toBe("lex@example.com");
    expect(parsed.searchParams.get("utm_campaign")).toBe(
      "11111111-2222-3333-4444-555555555555"
    );
    expect(parsed.searchParams.get("embed_domain")).toBe("998webdesigns.com");
    expect(parsed.searchParams.get("embed_type")).toBe("Inline");
  });

  it("ignores stale NEXT_PUBLIC_BOOK_CALL_URL on production", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv(
      "NEXT_PUBLIC_BOOK_CALL_URL",
      "https://calendly.com/bearllc555/discovery-call-998-web-designs"
    );

    const url = buildDiscoveryBookCallUrl({
      fullName: "Test",
      email: "test@example.com",
      prospectId: "abc",
    });

    expect(url).toContain("calendly.com/998webdesigns/");
    expect(url).not.toContain("bearllc555");
    vi.unstubAllEnvs();
  });
});
