import { VOICE_DEMO_GOODBYE_LINE } from "@/lib/voice-demo-constants";

const FETCH_TIMEOUT_MS = 9000;

/** Pause after ZIP confirmation audio before weather API fetch (ms). */
export const WEATHER_POST_CONFIRM_PAUSE_MS = 1200;

/** Beat after the spoken forecast before FINAL GOODBYE (ms). */
export const WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS = 1000;

/** Hidden client cue — weather demo done; nudges Jarvis to sign off, not wrap-up. */
export const VOICE_DEMO_WEATHER_FORECAST_DONE_CUE = "[weather-forecast-done]";

export function buildWeatherForecastGoodbyeNudge(): string {
  return (
    `${VOICE_DEMO_WEATHER_FORECAST_DONE_CUE} Weather demo complete — do not ask wrap-up questions. ` +
    `Say the sign-off ONCE in spirit of "${VOICE_DEMO_GOODBYE_LINE}" then follow PROMO OFFER rules if promo not yet sent, ` +
    `then call end_conversation. Never repeat the goodbye line. STOP — no wrap-up questions.`
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

/** Spoken "72 degrees Fahrenheit, about 22 degrees Celsius". */
export function formatSpokenTemperaturePair(tempF: number): string {
  const f = Math.round(tempF);
  const c = fahrenheitToCelsiusRounded(tempF);
  return `${f} degrees Fahrenheit, about ${c} degrees Celsius`;
}

/** Assistant turn is the pre-fetch "one moment" line — not the forecast yet. */
export function isAssistantWeatherLookupPending(text: string): boolean {
  return /look up the weather for/i.test(text.trim().toLowerCase());
}

/** Assistant turn looks like the spoken briefReport weather summary. */
export function isAssistantWeatherForecast(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    (/\bin .+, .+, it's \d+ degrees fahrenheit/i.test(t) && /celsius/.test(t)) ||
    (/\d+\s*degrees fahrenheit/.test(t) &&
      /celsius/.test(t) &&
      /humidity/.test(t) &&
      /\bwind/.test(t))
  );
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

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return (await res.json()) as T;
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
