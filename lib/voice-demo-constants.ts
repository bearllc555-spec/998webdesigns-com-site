/** Gemini Live model for the homepage voice assistant. */
export const VOICE_DEMO_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

/** Calm, even delivery — closest prebuilt match to a Jarvis-style butler. */
export const VOICE_DEMO_VOICE_NAME = "Schedar";

/** Jarvis assistant audio playback rate (1 = normal; <1 = slower). */
export const VOICE_DEMO_PLAYBACK_RATE = 0.95;

/** Channel-specific promo — design fee only; not on public FAQ. */
export const VOICE_DEMO_PROMO_CODE = "VOICE20";

/** Permission ask before emailing the coupon — must wait for yes before send_promo_email. */
export const VOICE_DEMO_PROMO_EMAIL_ASK_LINE =
  "Do you mind if I send you a coupon code via email?";

/** Standard sign-off before end_conversation — spoken verbatim on weather silence timeout. */
export const VOICE_DEMO_GOODBYE_LINE =
  "Thank you for contacting 998 web designs — goodbye.";

export const VOICE_DEMO_SESSION_COOKIE = "voice_demo_session";

export const VOICE_DEMO_OTP_TTL_MS = 15 * 60 * 1000;

export const VOICE_DEMO_MAX_VERIFY_ATTEMPTS = 8;

export const VOICE_DEMO_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
