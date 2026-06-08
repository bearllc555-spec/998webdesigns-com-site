import { createHmac } from "crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  isPlumbingVertical,
  parseVoiceDemoVertical,
} from "@/lib/voice-demo-vertical";
import {
  createVoiceDemoSessionToken,
  verifyVoiceDemoSessionToken,
} from "@/lib/voice-demo-session";

describe("voice-demo-vertical", () => {
  it("parses plumbers vertical", () => {
    expect(parseVoiceDemoVertical("plumbers")).toBe("plumbers");
    expect(parseVoiceDemoVertical("marketing")).toBe("marketing");
    expect(parseVoiceDemoVertical(undefined)).toBe("marketing");
  });

  it("detects plumbing vertical", () => {
    expect(isPlumbingVertical("plumbers")).toBe(true);
    expect(isPlumbingVertical("marketing")).toBe(false);
  });
});

describe("voice-demo-session vertical", () => {
  const prev = process.env.BALANCE_CAPTURE_SECRET;

  beforeAll(() => {
    process.env.BALANCE_CAPTURE_SECRET = "test-secret-for-session-vertical";
  });

  afterAll(() => {
    if (prev === undefined) delete process.env.BALANCE_CAPTURE_SECRET;
    else process.env.BALANCE_CAPTURE_SECRET = prev;
  });

  it("round-trips vertical in session token", () => {
    const token = createVoiceDemoSessionToken("lead-1", true, "plumbers");
    expect(token).toBeTruthy();
    const payload = verifyVoiceDemoSessionToken(token!);
    expect(payload?.leadId).toBe("lead-1");
    expect(payload?.verified).toBe(true);
    expect(payload?.vertical).toBe("plumbers");
  });

  it("defaults legacy tokens to marketing", () => {
    const secret = process.env.BALANCE_CAPTURE_SECRET!;
    const encoded = Buffer.from(
      JSON.stringify({ leadId: "x", verified: true, exp: Date.now() + 60_000 })
    ).toString("base64url");
    const sig = createHmac("sha256", secret).update(encoded).digest("base64url");
    const payload = verifyVoiceDemoSessionToken(`${encoded}.${sig}`);
    expect(payload?.vertical).toBe("marketing");
  });
});
