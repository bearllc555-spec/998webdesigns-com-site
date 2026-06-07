import { VOICE_DEMO_GOODBYE_LINE } from "@/lib/voice-demo-constants";
import { normalizeVerificationCode } from "@/lib/voice-demo-code";
import { speakInteger } from "@/lib/voice-demo-speak-money";

const FETCH_TIMEOUT_MS = 9000;

/** Pause after ZIP confirmation audio before weather API fetch (ms). */
export const WEATHER_POST_CONFIRM_PAUSE_MS = 1200;

/** Beat after the spoken forecast before FINAL GOODBYE (ms). */
export const WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS = 1000;

/** Re-send forecast nudge if lookup finished but Jarvis never spoke the report. */
export const WEATHER_FORECAST_DELIVERY_WATCHDOG_MS = 14_000;

/** Extract spoken forecast lines from lookup_weather tool result. */
export function weatherLookupSpeakLines(
  result: Record<string, unknown>
): { spokenLookup: string; briefReport: string } | null {
  const spokenLookup =
    typeof result.spokenLookup === "string" ? result.spokenLookup.trim() : "";
  const briefReport =
    typeof result.briefReport === "string" ? result.briefReport.trim() : "";
  if (!spokenLookup || !briefReport) return null;
  return { spokenLookup, briefReport };
}

/** Hidden client cue — weather demo done; nudges Jarvis to sign off, not wrap-up. */
export const VOICE_DEMO_WEATHER_FORECAST_DONE_CUE = "[weather-forecast-done]";

/** Hidden cue — client ran lookup_weather; Jarvis must speak the forecast. */
export const VOICE_DEMO_WEATHER_LOOKUP_READY_CUE = "[weather-lookup-ready]";

/** Hidden cue — lookup_weather failed; Jarvis apologizes and signs off. */
export const VOICE_DEMO_WEATHER_LOOKUP_FAILED_CUE = "[weather-lookup-failed]";

/** Hidden cue — Jarvis gave wrong temps or apologized instead of reading briefReport. */
export const VOICE_DEMO_WEATHER_FORECAST_CORRECTION_CUE = "[weather-forecast-correction]";

export function buildWeatherLookupSpeakNudge(
  spokenLookup: string,
  briefReport: string
): string {
  return (
    `${VOICE_DEMO_WEATHER_LOOKUP_READY_CUE} lookup_weather succeeded. ` +
    `VERBATIM SCRIPT — speak spokenLookup exactly once, word for word: "${spokenLookup}" ` +
    `Then speak briefReport exactly once, word for word — every temperature word must match briefReport: "${briefReport}" ` +
    `Do not invent, round, or swap Fahrenheit and Celsius. STOP after briefReport — no apology, no goodbye, no wrap-up.`
  );
}

export function buildWeatherForecastCorrectionNudge(briefReport: string): string {
  return (
    `${VOICE_DEMO_WEATHER_FORECAST_CORRECTION_CUE} Wrong or incomplete forecast. ` +
    `Speak ONLY briefReport verbatim — word for word, every temperature must match: "${briefReport}" ` +
    `STOP after briefReport. No apology. No goodbye. The close queue continues after the forecast.`
  );
}

export function buildWeatherLookupFailedNudge(errorDetail: string, opts?: { retriesExhausted?: boolean }): string {
  if (!opts?.retriesExhausted) {
    return (
      `${VOICE_DEMO_WEATHER_LOOKUP_FAILED_CUE} lookup_weather failed (${errorDetail}). ` +
      `Say "One moment — let me try that weather lookup again." Stay silent — the client will retry. ` +
      `Do not say goodbye or ask wrap-up questions yet.`
    );
  }
  return (
    `${VOICE_DEMO_WEATHER_LOOKUP_FAILED_CUE} lookup_weather failed after retries (${errorDetail}). ` +
    `Apologize briefly that the weather lookup is unavailable right now. ` +
    `Do not ask for another ZIP. Go to FINAL GOODBYE — warm sign-off once; the system ends the call. Do not call end_conversation.`
  );
}

/** @deprecated Use buildWeatherForecastCoolReactionNudge from voice-demo-close-queue. */
export function buildWeatherForecastGoodbyeNudge(): string {
  return (
    `${VOICE_DEMO_WEATHER_FORECAST_DONE_CUE} Forecast delivered — follow CLOSE QUEUE rules. ` +
    `Say ONLY the cool-reaction line from the cue; promo and goodbye come later in the queue.`
  );
}

/** Step 1 — yes/no weather offer at end of chat (wait for answer before ZIP). */
export const VOICE_DEMO_WEATHER_OFFER_LINE =
  "Before you go, do you want to see something cool?";

/** Spoken when visitor is silent after the weather offer — then repeat the question. */
export const VOICE_DEMO_WEATHER_DIDNT_GET_LINE = "I didn't get that.";

/** Repeat question after silence (no "Before you go" on the repeat). */
export const VOICE_DEMO_WEATHER_REPEAT_LINE = "Do you want to see something cool?";

/** Step 2 — after they say yes, ask for ZIP. */
export const VOICE_DEMO_WEATHER_ZIP_ASK_LINE =
  "If you give me your ZIP code, I can tell you the weather forecast in your city.";

/** Spoken when visitor is silent after the ZIP ask — then repeat the ZIP ask. */
export const VOICE_DEMO_ZIP_DIDNT_GET_LINE =
  "I didn't get that ZIP code — can you please repeat it?";

export type UsZipPlace = {
  zip: string;
  city: string;
  state: string;
  stateName: string;
  latitude: number;
  longitude: number;
};

export type UsWeatherSnapshot = {
  temperatureF: number;
  apparentTemperatureF: number;
  humidityPct: number;
  windMph: number;
  conditions: string;
};

export type UsWeatherLookupResult =
  | {
      ok: true;
      zip: string;
      city: string;
      state: string;
      stateName: string;
      weather: UsWeatherSnapshot;
      briefReport: string;
    }
  | { ok: false; error: string };

/** Normalize a US ZIP to 5 digits (ZIP+4 accepted). */
export function normalizeUsZipCode(raw: string | number): string | null {
  let trimmed: string;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    trimmed = String(Math.trunc(raw));
    if (trimmed.length > 0 && trimmed.length < 5) {
      trimmed = trimmed.padStart(5, "0");
    }
  } else if (typeof raw === "string") {
    trimmed = raw.trim();
  } else {
    return null;
  }

  if (!trimmed) return null;

  const zipPlus4 = trimmed.match(/^(\d{5})-(\d{4})$/);
  if (zipPlus4) return zipPlus4[1]!;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 5) return digits.slice(0, 5);
  // Voice/STT and JSON numbers often drop the leading zero (e.g. 07424 → 7424).
  if (digits.length === 4) return `0${digits}`;
  return null;
}

/** Digits or spoken words (e.g. "zero seven four two four") → 5-digit ZIP. */
export function normalizeSpokenUsZipCode(raw: string): string | null {
  const direct = normalizeUsZipCode(raw);
  if (direct) return direct;
  const spokenDigits = normalizeVerificationCode(raw);
  if (!spokenDigits) return null;
  return normalizeUsZipCode(spokenDigits);
}

/** True when two ZIP inputs resolve to the same 5-digit code. */
export function usZipCodesEquivalent(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
  if (a == null || b == null) return false;
  const na = normalizeUsZipCode(a);
  const nb = normalizeUsZipCode(b);
  return !!na && !!nb && na === nb;
}

/** WMO weather code → short spoken label. */
export function wmoWeatherLabel(code: number): string {
  if (code === 0) return "clear skies";
  if (code <= 3) return "partly cloudy";
  if (code <= 48) return "foggy";
  if (code <= 57) return "light drizzle";
  if (code <= 67) return "rain";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain showers";
  if (code <= 86) return "snow showers";
  if (code <= 99) return "thunderstorms";
  return "mixed conditions";
}

/** Round Fahrenheit to integer Celsius for spoken weather reports. */
export function fahrenheitToCelsiusRounded(tempF: number): number {
  return Math.round((tempF - 32) * (5 / 9));
}

/** Spoken "seventy-two degrees Fahrenheit, about twenty-two degrees Celsius". */
export function formatSpokenTemperaturePair(tempF: number): string {
  const f = Math.round(tempF);
  const c = fahrenheitToCelsiusRounded(tempF);
  return `${speakInteger(f)} degrees Fahrenheit, about ${speakInteger(c)} degrees Celsius`;
}

/** First Fahrenheit integer Jarvis spoke in a forecast turn (digits only). */
export function extractFirstTemperatureFahrenheit(text: string): number | null {
  const match = text.match(/(\d{1,3})\s*degrees?\s*fahrenheit/i);
  if (!match) return null;
  const value = Number.parseInt(match[1]!, 10);
  return Number.isFinite(value) ? value : null;
}

/** True when Jarvis's spoken °F differs from the API-backed briefReport by more than tolerance. */
export function assistantWeatherTemperatureMismatch(
  expectedF: number,
  assistantText: string,
  toleranceF = 6
): boolean {
  const spokenF = extractFirstTemperatureFahrenheit(assistantText);
  if (spokenF == null) return false;
  return Math.abs(spokenF - Math.round(expectedF)) > toleranceF;
}

/** Apology or casual goodbye before the weather close queue finishes. */
export function isAssistantPostForecastDerail(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (/\bthank you for contacting\b/.test(t)) return false;
  if (/\bi'?m sorry\b/.test(t) && /\b(have a (good|great|nice) day|goodbye|thank you)\b/.test(t)) {
    return true;
  }
  if (/\bhave a (good|great|nice) day\b/.test(t) && !/\bsomething cool\b/.test(t)) return true;
  return false;
}

export function weatherLookupExpectedTempF(result: Record<string, unknown>): number | null {
  if (typeof result.temperatureF === "number" && Number.isFinite(result.temperatureF)) {
    return Math.round(result.temperatureF);
  }
  const briefReport =
    typeof result.briefReport === "string" ? result.briefReport.trim() : "";
  if (!briefReport) return null;
  const fromWords = briefReport.match(
    /it's ([\w\s-]+?) degrees Fahrenheit/i
  );
  if (!fromWords) return null;
  const digits = fromWords[1]!.match(/\d{1,3}/);
  if (digits) return Number.parseInt(digits[0]!, 10);
  return null;
}

/** Assistant turn is the pre-fetch "one moment" line — not the forecast yet. */
export function isAssistantWeatherLookupPending(text: string): boolean {
  return /look up the weather for/i.test(text.trim().toLowerCase());
}

/** Assistant turn looks like the full spoken briefReport (not a partial temp-only line). */
export function isAssistantWeatherForecast(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  const hasFahrenheit =
    /\d+\s*degrees?\s*fahrenheit/.test(t) ||
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:\s+(?:and\s+)?(?:zero|one|two|three|four|five|six|seven|eight|nine))?\s+degrees?\s+fahrenheit/.test(
      t
    );
  return hasFahrenheit && /celsius/.test(t) && /humidity/.test(t) && /\bwind/.test(t);
}

export function formatBriefWeatherReport(
  place: Pick<UsZipPlace, "city" | "stateName">,
  weather: UsWeatherSnapshot
): string {
  const temp = Math.round(weather.temperatureF);
  const feels = Math.round(weather.apparentTemperatureF);
  const wind = Math.round(weather.windMph);
  const humidity = Math.round(weather.humidityPct);
  const feelsNote =
    Math.abs(feels - temp) >= 4
      ? `, feels like ${formatSpokenTemperaturePair(feels)}`
      : "";
  return (
    `In ${place.city}, ${place.stateName}, it's ${formatSpokenTemperaturePair(temp)} with ${weather.conditions}` +
    `${feelsNote}, ${humidity}% humidity, and winds around ${wind} miles per hour.`
  );
}

async function fetchJsonOnce<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      "User-Agent": "998webdesigns-voice-demo/1.0",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

async function fetchJson<T>(url: string, retries = 1): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchJsonOnce<T>(url);
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 350));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

type ZippopotamResponse = {
  "post code": string;
  places?: Array<{
    "place name": string;
    "state abbreviation": string;
    state: string;
    latitude: string;
    longitude: string;
  }>;
};

type OpenMeteoCurrent = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
};

export async function resolveUsZipPlace(
  zip: string
): Promise<{ ok: true; place: UsZipPlace } | { ok: false; error: string }> {
  const normalized = normalizeUsZipCode(zip);
  if (!normalized) {
    return { ok: false, error: "Please provide a valid 5-digit US ZIP code." };
  }

  try {
    const data = await fetchJson<ZippopotamResponse>(
      `https://api.zippopotam.us/us/${normalized}`
    );
    const row = data.places?.[0];
    if (!row) {
      return { ok: false, error: "ZIP code not found in the United States." };
    }

    return {
      ok: true,
      place: {
        zip: normalized,
        city: row["place name"],
        state: row["state abbreviation"],
        stateName: row.state,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      },
    };
  } catch {
    return { ok: false, error: "Could not look up that ZIP code right now." };
  }
}

export async function fetchUsWeather(latitude: number, longitude: number): Promise<UsWeatherSnapshot | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "weather_code",
        "wind_speed_10m",
      ].join(","),
      temperature_unit: "fahrenheit",
      wind_speed_unit: "mph",
      timezone: "auto",
    });

    const data = await fetchJson<OpenMeteoCurrent>(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );
    const current = data.current;
    if (!current || typeof current.temperature_2m !== "number") {
      return null;
    }

    return {
      temperatureF: current.temperature_2m,
      apparentTemperatureF: current.apparent_temperature ?? current.temperature_2m,
      humidityPct: current.relative_humidity_2m ?? 0,
      windMph: current.wind_speed_10m ?? 0,
      conditions: wmoWeatherLabel(current.weather_code ?? -1),
    };
  } catch {
    return null;
  }
}

export type UsWeatherLookupOptions = {
  /** City locked at ZIP confirm — forecast must match the read-back, not a model guess. */
  confirmCity?: string | null;
};

export async function lookupUsWeatherByZip(
  zip: string,
  opts: UsWeatherLookupOptions = {}
): Promise<UsWeatherLookupResult> {
  const placeResult = await resolveUsZipPlace(zip);
  if (!placeResult.ok) {
    return placeResult;
  }
  const place = placeResult.place;
  const reportCity = opts.confirmCity?.trim() || place.city;

  const weather = await fetchUsWeather(place.latitude, place.longitude);
  if (!weather) {
    return { ok: false, error: "Weather service is unavailable. Try again in a moment." };
  }

  const briefReport = formatBriefWeatherReport(
    { city: reportCity, stateName: place.stateName },
    weather
  );
  return {
    ok: true,
    zip: place.zip,
    city: reportCity,
    state: place.state,
    stateName: place.stateName,
    weather,
    briefReport,
  };
}

/** Space-separated digits for clear ZIP read-back (e.g. "0 7 4 2 4"). */
export function spellZipForVoice(zip: string): string {
  const digits = zip.replace(/\D/g, "").slice(0, 5);
  return digits.split("").join(" ");
}

/** Read-back after the visitor gives a ZIP — ask yes/no before lookup. */
export function buildWeatherZipConfirmLine(
  place: Pick<UsZipPlace, "zip" | "city" | "stateName">
): string {
  return (
    `I have ZIP code ${spellZipForVoice(place.zip)} for ${place.city}, ${place.stateName}. ` +
    `Is that correct?`
  );
}

/** Tool instruction — Jarvis must not paraphrase the city from memory. */
export function weatherZipConfirmSpeakInstruction(spokenConfirm: string): string {
  return (
    `Speak this spokenConfirm exactly once, word for word — do not change the city or state: "${spokenConfirm}" ` +
    `STOP and wait for yes or no. Do NOT call lookup_weather yet. ` +
    `Never substitute a different city (e.g. a larger nearby town) — only the city in spokenConfirm.`
  );
}

/** Spoken after the visitor confirms the ZIP — before the API fetch. */
export function buildWeatherZipLookupLine(
  place: Pick<UsZipPlace, "city" | "stateName">
): string {
  return `Thank you — one moment while I look up the weather for ${place.city}, ${place.stateName}.`;
}

export function formatPossibleLocationLabel(
  city: string | null,
  state: string | null,
  zip: string | null
): string | null {
  if (!zip && !city && !state) return null;
  const cityState = [city, state].filter(Boolean).join(", ");
  if (zip && cityState) return `${cityState} ${zip}`;
  return cityState || zip;
}
