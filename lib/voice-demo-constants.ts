/** Gemini Live model for the homepage voice assistant. */
export const VOICE_DEMO_LIVE_MODEL = "gemini-2.5-flash-native-audio-preview-12-2025";

/** Calm, even delivery — closest prebuilt match to a Jarvis-style butler. */
export const VOICE_DEMO_VOICE_NAME = "Schedar";

/** Jarvis assistant audio playback rate (1 = normal; <1 = slower). */
export const VOICE_DEMO_PLAYBACK_RATE = 0.95;

/** End the voice session if the visitor leaves the mic muted this long (ms). */
export const VOICE_DEMO_MIC_MUTE_DISCONNECT_MS = 10_000;

/** Channel-specific promo — design fee only; not on public FAQ. */
export const VOICE_DEMO_PROMO_CODE = "VOICE20";

/** After weather + implement interest — permission before send_promo_email. */
export const VOICE_DEMO_PROMO_EMAIL_ASK_LINE =
  "Would you like me to send you a coupon code to save 20% off a web design package?";

/** Step after forecast — visitor reacts to the weather demo. */
export const VOICE_DEMO_WEATHER_COOL_REACTION_LINE = "Isn't that pretty cool?";

/** Step before promo — gauge interest in Jarvis-style features on their site. */
export const VOICE_DEMO_WEATHER_IMPLEMENT_ASK_LINE =
  "Is that something you want to implement into your website?";

/** Standard sign-off before end_conversation — spoken verbatim on weather silence timeout. */
export const VOICE_DEMO_GOODBYE_LINE =
  "Thank you for contacting 998 web designs — goodbye.";

export const VOICE_DEMO_SESSION_COOKIE = "voice_demo_session";

export const VOICE_DEMO_OTP_TTL_MS = 15 * 60 * 1000;

export const VOICE_DEMO_MAX_VERIFY_ATTEMPTS = 8;

export const VOICE_DEMO_SESSION_TTL_MS = 24 * 60 * 60 * 1000;
