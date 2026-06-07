/** Shared weather-flow detection helpers (client + prompt). */

import { VOICE_DEMO_PROMO_EMAIL_ASK_LINE } from "@/lib/voice-demo-constants";

export type WeatherZipFlowRefs = {
  awaitingWeatherYesNo: boolean;
  awaitingZipDigits: boolean;
  awaitingZipConfirm: boolean;
  awaitingWeatherForecastDelivery: boolean;
  zipDigitsHeardMax: number;
  weatherDemoAccepted: boolean;
};

/** Weather demo started but not finished — promo and goodbye must wait. */
export function isWeatherZipFlowActive(refs: WeatherZipFlowRefs): boolean {
  return (
    refs.awaitingWeatherYesNo ||
    refs.awaitingZipDigits ||
    refs.awaitingZipConfirm ||
    refs.awaitingWeatherForecastDelivery ||
    refs.zipDigitsHeardMax > 0 ||
    refs.weatherDemoAccepted
  );
}

export type WeatherDemoProgress = WeatherZipFlowRefs & {
  stagedZipPending: boolean;
  zipLookupTriggered: boolean;
  forecastComplete: boolean;
};

/** Weather pitch accepted but spoken forecast not delivered yet. */
export function isWeatherDemoIncomplete(progress: WeatherDemoProgress): boolean {
  if (progress.forecastComplete) return false;
  if (progress.awaitingWeatherForecastDelivery || progress.zipLookupTriggered) return true;
  if (
    progress.awaitingZipConfirm ||
    progress.awaitingZipDigits ||
    progress.awaitingWeatherYesNo ||
    progress.stagedZipPending
  ) {
    return true;
  }
  return progress.weatherDemoAccepted;
}

/** Block client auto-hangup until weather demo finishes or client authorizes goodbye. */
export function shouldBlockClientFarewellHangup(opts: {
  goodbyeNudgeSent: boolean;
  progress: WeatherDemoProgress;
}): boolean {
  if (isWeatherDemoIncomplete(opts.progress)) return true;
  if (opts.goodbyeNudgeSent) return false;
  return isWeatherZipFlowActive(opts.progress);
}

/** Jarvis asked permission to email the coupon (or mentioned VOICE20 / discount). */
export function isAssistantPromoAsk(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  if (lower.includes(VOICE_DEMO_PROMO_EMAIL_ASK_LINE.toLowerCase())) return true;
  return (
    /send you a coupon/i.test(lower) ||
    /coupon code via email/i.test(lower) ||
    /email you a coupon/i.test(lower) ||
    /mind if i (send|email)/i.test(lower) ||
    /\bvoice\s*20\b/i.test(lower) ||
    /\b20\s*% off/i.test(lower) ||
    /\bdiscount code\b/i.test(lower) ||
    (/\bcoupon\b/.test(lower) && /\b(email|send)\b/.test(lower))
  );
}

export function isAssistantWeatherOfferPrompt(text: string): boolean {
  return /something cool/.test(text.toLowerCase());
}

export function isAssistantZipCollectionPrompt(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /give me your zip|your zip code|five-digit zip|5-digit zip|zip code.*forecast/i.test(
      lower
    ) ||
    /\bwhat(?:'s| is) your (?:zip|five.?digit)/i.test(lower) ||
    /\brepeat.*zip\b/i.test(lower) ||
    /\b(share|tell|give|provide|need|repeat).{0,48}\bzip\b/i.test(lower) ||
    /\bzip\b.{0,48}\b(forecast|weather)\b/i.test(lower) ||
    (/\bzip\b/.test(lower) &&
      /\b(code|forecast|weather)\b/.test(lower) &&
      /\b(give|share|tell|need|provide|repeat)\b/.test(lower))
  );
}

export function isAssistantZipReadBackPrompt(text: string): boolean {
  const lower = text.toLowerCase();
  if (!/is that correct\??/i.test(text)) return false;
  if (/\bzip\b/i.test(lower)) return true;
  if (/\bfor [a-z][\w\s.'-]{1,40},\s*[a-z][\w\s.'-]{1,24}/i.test(lower)) return true;
  return /\d/.test(lower) && /\b(correct|right)\b/i.test(lower);
}

/** Jarvis asked to confirm ZIP digits but omitted the staged city/state read-back. */
export function assistantZipReadBackMissingStagedCity(
  text: string,
  staged: { city: string; spokenConfirm: string }
): boolean {
  const trimmed = text.trim();
  if (!trimmed || !staged.spokenConfirm.trim()) return false;
  if (trimmed.includes(staged.spokenConfirm)) return false;
  if (new RegExp(`\\b${staged.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(trimmed)) {
    return false;
  }
  return /is that correct\??/i.test(trimmed) && /\d/.test(trimmed);
}

/** Minimum gap between hidden client weather nudges (avoids double prompts). */
export const WEATHER_CLIENT_NUDGE_COOLDOWN_MS = 4500;
