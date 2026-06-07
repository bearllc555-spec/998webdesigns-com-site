import { describe, expect, it } from "vitest";
import {
  buildWeatherZipConfirmLine,
  buildWeatherZipLookupLine,
  fahrenheitToCelsiusRounded,
  formatBriefWeatherReport,
  formatSpokenTemperaturePair,
  spellZipForVoice,
  formatPossibleLocationLabel,
  isAssistantWeatherForecast,
  isAssistantWeatherLookupPending,
  normalizeSpokenUsZipCode,
  normalizeUsZipCode,
  usZipCodesEquivalent,
  VOICE_DEMO_WEATHER_OFFER_LINE,
  VOICE_DEMO_WEATHER_FORECAST_DONE_CUE,
  VOICE_DEMO_WEATHER_ZIP_ASK_LINE,
  WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS,
  buildWeatherForecastGoodbyeNudge,
  buildWeatherLookupFailedNudge,
  buildWeatherLookupSpeakNudge,
  weatherZipConfirmSpeakInstruction,
  wmoWeatherLabel,
} from "@/lib/voice-demo-weather";

describe("voice-demo-weather", () => {
  it("defines split weather offer and ZIP ask copy", () => {
    expect(VOICE_DEMO_WEATHER_OFFER_LINE).toBe(
      "Before you go, do you want to see something cool?"
    );
    expect(VOICE_DEMO_WEATHER_ZIP_ASK_LINE).toContain("ZIP code");
    expect(VOICE_DEMO_WEATHER_ZIP_ASK_LINE).toContain("weather forecast");
  });

  it("normalizes US ZIP codes", () => {
    expect(normalizeUsZipCode("07424")).toBe("07424");
    expect(normalizeUsZipCode("07424-1234")).toBe("07424");
    expect(normalizeUsZipCode("zip 10001")).toBe("10001");
    expect(normalizeUsZipCode("123")).toBeNull();
  });

  it("normalizes spoken-word ZIPs from voice", () => {
    expect(normalizeSpokenUsZipCode("zero seven four two four")).toBe("07424");
    expect(normalizeSpokenUsZipCode("oh seven four two four")).toBe("07424");
    expect(normalizeSpokenUsZipCode("07424")).toBe("07424");
  });

  it("recovers leading-zero ZIPs dropped by voice or JSON numbers", () => {
    expect(normalizeUsZipCode("7424")).toBe("07424");
    expect(normalizeUsZipCode(7424)).toBe("07424");
    expect(normalizeUsZipCode(10001)).toBe("10001");
    expect(usZipCodesEquivalent("07424", 7424)).toBe(true);
  });

  it("maps WMO codes to spoken labels", () => {
    expect(wmoWeatherLabel(0)).toBe("clear skies");
    expect(wmoWeatherLabel(61)).toBe("rain");
  });

  it("converts Fahrenheit to Celsius for spoken reports", () => {
    expect(fahrenheitToCelsiusRounded(32)).toBe(0);
    expect(fahrenheitToCelsiusRounded(72)).toBe(22);
    expect(formatSpokenTemperaturePair(72)).toBe(
      "72 degrees Fahrenheit, about 22 degrees Celsius"
    );
  });

  it("formats a brief spoken weather report with F then C", () => {
    const report = formatBriefWeatherReport(
      { city: "Little Falls", stateName: "New Jersey" },
      {
        temperatureF: 72,
        apparentTemperatureF: 65,
        humidityPct: 55,
        windMph: 8,
        conditions: "partly cloudy",
      }
    );
    expect(report).toContain("Little Falls");
    expect(report).toContain("72 degrees Fahrenheit, about 22 degrees Celsius");
    expect(report).toContain("65 degrees Fahrenheit, about 18 degrees Celsius");
    expect(report).toContain("partly cloudy");
    expect(isAssistantWeatherForecast(report)).toBe(true);
  });

  it("detects pre-fetch lookup line separately from forecast", () => {
    expect(
      isAssistantWeatherLookupPending(
        "Thank you — one moment while I look up the weather for Totowa, New Jersey."
      )
    ).toBe(true);
    expect(isAssistantWeatherForecast("Thank you — one moment while I look up")).toBe(false);
  });

  it("does not treat partial temperature-only lines as a complete forecast", () => {
    expect(
      isAssistantWeatherForecast(
        "In Little Falls, New Jersey, it's 72 degrees Fahrenheit, about 22 degrees Celsius with partly cloudy"
      )
    ).toBe(false);
  });

  it("uses a 1s pause before goodbye after forecast", () => {
    expect(WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS).toBe(1000);
    const nudge = buildWeatherForecastGoodbyeNudge();
    expect(nudge).toContain(VOICE_DEMO_WEATHER_FORECAST_DONE_CUE);
    expect(nudge).toMatch(/do not ask wrap-up/i);
    expect(nudge).toMatch(/end_conversation/i);
    expect(isAssistantWeatherForecast("Our design fee is five thousand dollars.")).toBe(
      false
    );
  });

  it("nudges Jarvis to speak client-fetched forecast", () => {
    const lookup = buildWeatherZipLookupLine({
      city: "Totowa",
      stateName: "New Jersey",
    });
    const report =
      "In Totowa, New Jersey, it's 75 degrees Fahrenheit, about 24 degrees Celsius with clear skies, 40% humidity, and winds around 5 miles per hour.";
    const nudge = buildWeatherLookupSpeakNudge(lookup, report);
    expect(nudge).toContain("[weather-lookup-ready]");
    expect(nudge).toContain(lookup);
    expect(nudge).toContain(report);
  });

  it("nudges graceful goodbye when lookup fails", () => {
    const nudge = buildWeatherLookupFailedNudge("Weather service is unavailable.");
    expect(nudge).toContain("[weather-lookup-failed]");
    expect(nudge).toMatch(/unavailable/i);
    expect(nudge).toMatch(/FINAL GOODBYE/i);
  });

  it("requires verbatim ZIP confirm and forbids city substitution", () => {
    const line = weatherZipConfirmSpeakInstruction(
      "I have ZIP code 0 7 5 1 2 for Totowa, New Jersey. Is that correct?"
    );
    expect(line).toMatch(/word for word/i);
    expect(line).toMatch(/Never substitute a different city/i);
  });

  it("spells ZIP digits for read-back", () => {
    expect(spellZipForVoice("07424")).toBe("0 7 4 2 4");
  });

  it("builds ZIP read-back before weather fetch", () => {
    const readBack = buildWeatherZipConfirmLine({
      zip: "07424",
      city: "Little Falls",
      stateName: "New Jersey",
    });
    expect(readBack).toContain("0 7 4 2 4");
    expect(readBack).toContain("Little Falls");
    expect(readBack).toMatch(/Is that correct\?/i);
    expect(
      buildWeatherZipLookupLine({
        city: "Little Falls",
        stateName: "New Jersey",
      })
    ).toMatch(/look up the weather/i);
  });

  it("formats possible location label for CRM", () => {
    expect(formatPossibleLocationLabel("Little Falls", "NJ", "07424")).toBe(
      "Little Falls, NJ 07424"
    );
    expect(formatPossibleLocationLabel(null, null, null)).toBeNull();
  });
});
