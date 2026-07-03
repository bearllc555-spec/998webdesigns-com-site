import { describe, expect, it } from "vitest";
import { voiceDemoPlumbingSystemPrompt } from "@/lib/voice-demo-plumbing-system-prompt";
import type { VoiceDemoLeadRow } from "@/lib/voice-demo-db";

function plumbingRow(email: string): VoiceDemoLeadRow {
  return {
    id: "test-lead",
    created_at: "2026-06-07T00:00:00.000Z",
    updated_at: "2026-06-07T00:00:00.000Z",
    email,
    phone: null,
    full_name: null,
    primary_channel: "email",
    email_verified_at: "2026-06-07T00:00:00.000Z",
    phone_verified_at: null,
    promo_code: null,
    promo_sent_at: null,
    session_summary: null,
    ops_log: null,
    vertical: "plumbers",
    verification_code_hash: null,
    verification_expires_at: null,
    verification_attempts: 0,
    secondary_declined_at: null,
    ip: null,
    location_zip: null,
    location_city: null,
    location_state: null,
    read_at: null,
    inbox_flag: null,
  };
}

describe("voice-demo-plumbing-system-prompt", () => {
  it("offers demo login email before asking caller to spell a new one", () => {
    const prompt = voiceDemoPlumbingSystemPrompt(plumbingRow("ademeo@gmail.com"));
    expect(prompt).toContain("DEMO LOGIN EMAIL");
    expect(prompt).toContain("ademeo@gmail.com");
    expect(prompt).toMatch(/signed in with/i);
    expect(prompt).toMatch(/pronounce the full address/i);
  });

  it("includes contact intake pacing for read-back pauses", () => {
    const prompt = voiceDemoPlumbingSystemPrompt(plumbingRow("ademeo@gmail.com"));
    expect(prompt).toMatch(/CONTACT INTAKE PACING/i);
    expect(prompt).toMatch(/never chain/i);
    expect(prompt).toMatch(/do not jump straight to phone/i);
  });

  it("mentions $50 coupon at the booking offer before intake", () => {
    const prompt = voiceDemoPlumbingSystemPrompt(plumbingRow("ademeo@gmail.com"));
    expect(prompt).toMatch(/BOOKING OFFER/i);
    expect(prompt).toMatch(/book an appointment with me right now/i);
    expect(prompt).toMatch(/\$50 coupon off any service/i);
    expect(prompt).toMatch(/BEFORE collecting name, address, phone, or email/i);
  });

  it("requires listen-first before coupon or booking pitch", () => {
    const prompt = voiceDemoPlumbingSystemPrompt(plumbingRow("ademeo@gmail.com"));
    expect(prompt).toMatch(/LISTEN FIRST/i);
    expect(prompt).toMatch(/NEVER mention the \$50 coupon/i);
    expect(prompt).toMatch(/same turn as a question/i);
  });

  it("requires dispatch consent before emergency book", () => {
    const prompt = voiceDemoPlumbingSystemPrompt(plumbingRow("ademeo@gmail.com"));
    expect(prompt).toMatch(/EMERGENCY DISPATCH/i);
    expect(prompt).toMatch(/emergencyDispatchConfirmed true/i);
    expect(prompt).toMatch(/\$150 dispatch fee/i);
  });
});
