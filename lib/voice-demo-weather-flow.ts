/** Shared weather-flow detection helpers (client + prompt). */

export function isAssistantWeatherOfferPrompt(text: string): boolean {
  return /something cool/.test(text.toLowerCase());
}

export function isAssistantZipCollectionPrompt(text: string): boolean {
  const lower = text.toLowerCase();
  return /give me your zip|your zip code|five-digit zip|5-digit zip|zip code.*forecast/i.test(
    lower
  );
}

export function isAssistantZipReadBackPrompt(text: string): boolean {
  const lower = text.toLowerCase();
  return /is that correct\?/i.test(text) && /\bzip\b/i.test(lower);
}

/** Minimum gap between hidden client weather nudges (avoids double prompts). */
export const WEATHER_CLIENT_NUDGE_COOLDOWN_MS = 4500;
