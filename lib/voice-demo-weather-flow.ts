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

/** Jarvis asked permission to email the coupon. */
export function isAssistantPromoAsk(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (!lower) return false;
  if (lower.includes(VOICE_DEMO_PROMO_EMAIL_ASK_LINE.toLowerCase())) return true;
  return (
    /send you a coupon/i.test(lower) ||
    /coupon code via email/i.test(lower) ||
    (/\bcoupon\b/.test(lower) && /\bemail\b/.test(lower))
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
    /\bwhat(?:'s| is) your zip\b/i.test(lower) ||
    /\brepeat.*zip\b/i.test(lower) ||
    (/\bzip\b/.test(lower) &&
      /\b(code|forecast|weather)\b/.test(lower) &&
      /\b(give|share|tell|need|provide|repeat)\b/.test(lower))
  );
}

export function isAssistantZipReadBackPrompt(text: string): boolean {
  const lower = text.toLowerCase();
  return /is that correct\?/i.test(text) && /\bzip\b/i.test(lower);
}

/** Minimum gap between hidden client weather nudges (avoids double prompts). */
export const WEATHER_CLIENT_NUDGE_COOLDOWN_MS = 4500;
