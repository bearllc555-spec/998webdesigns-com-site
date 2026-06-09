/** Gemini Live model for Jarvis voice demos (3.1 fixes 2.5 FC + audio race disconnects). */
export const VOICE_DEMO_LIVE_MODEL = "gemini-3.1-flash-live-preview";

/** Calm, even delivery — closest prebuilt match to a Jarvis-style butler. */
export const VOICE_DEMO_VOICE_NAME = "Schedar";

/** Jarvis assistant audio playback rate (1 = normal; <1 = slower). */
export const VOICE_DEMO_PLAYBACK_RATE = 0.95;

/** Legacy — mic is pause-only (no auto-hangup on mute) for all Jarvis demos. */
export const VOICE_DEMO_MIC_MUTE_DISCONNECT_MS = 10_000;

/** Idle hangup after callback logged or plumbing booking/goodbye wind-down (ms). */
export const VOICE_DEMO_CALL_IDLE_HANGUP_MS = 4_000;

/** After Jarvis final goodbye, end the call when both sides are quiet this long. */
export const VOICE_DEMO_POST_FAREWELL_IDLE_MS = 3_000;

/** Caller echoed goodbye/thanks after Jarvis signed off — shorter disconnect. */
export const VOICE_DEMO_POST_FAREWELL_ACK_MS = 1_000;

/** After Jarvis goodbye with no caller response, blink the End call button. */
export const VOICE_DEMO_END_CALL_BLINK_DELAY_MS = 1_000;

/** Channel-specific promo — design fee only; not on public FAQ. */
export const VOICE_DEMO_PROMO_CODE = "VOICE20";

/** Permission before send_promo_email at goodbye. */
export const VOICE_DEMO_PROMO_EMAIL_ASK_LINE =
  "Would you like me to send you a coupon code to save 20% off a web design package?";

/** Standard sign-off — spoken once; system ends the call after playback. */
export const VOICE_DEMO_GOODBYE_LINE =
  "Thank you for contacting 998 web designs — goodbye.";

export const VOICE_DEMO_SESSION_COOKIE = "voice_demo_session";

export const VOICE_DEMO_OTP_TTL_MS = 15 * 60 * 1000;

export const VOICE_DEMO_MAX_VERIFY_ATTEMPTS = 8;

export const VOICE_DEMO_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
