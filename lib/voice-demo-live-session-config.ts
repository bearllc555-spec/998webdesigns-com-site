import type { ContextWindowCompressionConfig } from "@google/genai";

/** Google Live API best-practice: compress before audio token buildup ends the session. */
export const VOICE_DEMO_CONTEXT_WINDOW_COMPRESSION: ContextWindowCompressionConfig = {
  triggerTokens: "25000",
  slidingWindow: { targetTokens: "12000" },
};

/** Wired into ephemeral live tokens (server-locked connect config). */
export function voiceDemoLiveConnectExtras() {
  return {
    sessionResumption: {},
    contextWindowCompression: VOICE_DEMO_CONTEXT_WINDOW_COMPRESSION,
  };
}
