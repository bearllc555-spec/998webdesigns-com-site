import { describe, expect, it } from "vitest";
import { FunctionResponseScheduling } from "@google/genai";
import {
  buildVoiceDemoToolResponse,
  shouldUseSilentToolScheduling,
} from "@/lib/voice-demo-tool-response";

describe("voice-demo-tool-response", () => {
  it("silences promo and error tool responses", () => {
    expect(shouldUseSilentToolScheduling("send_promo_email", { ok: true })).toBe(true);
    expect(shouldUseSilentToolScheduling("capture_email_for_promo", { ok: true })).toBe(true);
    expect(shouldUseSilentToolScheduling("save_name", { ok: false, error: "nope" })).toBe(true);
  });

  it("does not silence save_name or phone staging on success", () => {
    expect(shouldUseSilentToolScheduling("save_name", { ok: true })).toBe(false);
    expect(shouldUseSilentToolScheduling("stage_phone_number", { ok: true })).toBe(false);
  });

  it("adds scheduling SILENT on build when appropriate", () => {
    const silent = buildVoiceDemoToolResponse("id-1", "send_promo_email", { ok: true });
    expect(silent.scheduling).toBe(FunctionResponseScheduling.SILENT);

    const spoken = buildVoiceDemoToolResponse("id-2", "save_name", { ok: true, name: "Anthony" });
    expect(spoken.scheduling).toBeUndefined();
  });
});
