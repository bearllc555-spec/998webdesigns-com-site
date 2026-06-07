const FETCH_TIMEOUT_MS = 9000;

/** Pause after ZIP confirmation audio before weather API fetch (ms). */
export const WEATHER_POST_CONFIRM_PAUSE_MS = 2400;

/** Beat after the spoken forecast before the next wrap-up question (ms). */
export const WRAPUP_POST_WEATHER_FORECAST_PAUSE_MS = 2000;

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
export function normalizeUsZipCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const zipPlus4 = trimmed.match(/^(\d{5})-(\d{4})$/);
  if (zipPlus4) return zipPlus4[1]!;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length >= 5) return digits.slice(0, 5);
  return null;
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

/** Assistant turn looks like the spoken briefReport weather summary. */
export function isAssistantWeatherForecast(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\bin .+, .+, it's \d+ degrees\b/.test(t) ||
    (/\d+\s*degrees/.test(t) && /humidity/.test(t) && /\bwind/.test(t))
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
    Math.abs(feels - temp) >= 4 ? `, feels like ${feels} degrees` : "";
  return (
    `In ${place.city}, ${place.stateName}, it's ${temp} degrees with ${weather.conditions}` +
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

export async function lookupUsWeatherByZip(zip: string): Promise<UsWeatherLookupResult> {
  const placeResult = await resolveUsZipPlace(zip);
  if (!placeResult.ok) {
    return placeResult;
  }
  const place = placeResult.place;

  const weather = await fetchUsWeather(place.latitude, place.longitude);
  if (!weather) {
    return { ok: false, error: "Weather service is unavailable. Try again in a moment." };
  }

  const briefReport = formatBriefWeatherReport(place, weather);
  return {
    ok: true,
    zip: place.zip,
    city: place.city,
    state: place.state,
    stateName: place.stateName,
    weather,
    briefReport,
  };
}

/** Spoken acknowledgment after the visitor gives a ZIP — before the weather fetch. */
export function buildWeatherZipConfirmLine(
  place: Pick<UsZipPlace, "zip" | "city" | "stateName">
): string {
  return `Thank you — let me look up the weather for ${place.city}, ${place.stateName}, ${place.zip}.`;
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
