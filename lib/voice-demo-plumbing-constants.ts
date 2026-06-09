import { VOICE_DEMO_CALL_IDLE_HANGUP_MS } from "@/lib/voice-demo-constants";

/** Metro Plumbing & Drain — demo business (docs/jarvis_plumbing_complete.md). */
export const PLUMBING_DEMO_BUSINESS_NAME = "Metro Plumbing & Drain";

export const PLUMBING_DEMO_TAGLINE = "Licensed & insured · Tri-State (NJ, NY, CT)";

export const PLUMBING_DEMO_EMAIL_DISPLAY = "demo@metroplumbingdrain.com";

export const PLUMBING_DEMO_PROMO_AMOUNT = 50;

export const PLUMBING_DEMO_EMERGENCY_DISPATCH_FEE = 150;

export const PLUMBING_DEMO_SESSION_START_CUE = "[plumbing-session-start]";

export const PLUMBING_DEMO_OPENING_LINE =
  "Thanks for calling Metro Plumbing and Drain — I'm Jarvis. How can I help you today?";

/** After booking or goodbye, end the call when both sides are quiet this long. */
/** @deprecated Use VOICE_DEMO_CALL_IDLE_HANGUP_MS — kept for plumbing imports. */
export const PLUMBING_IDLE_HANGUP_MS = VOICE_DEMO_CALL_IDLE_HANGUP_MS;
