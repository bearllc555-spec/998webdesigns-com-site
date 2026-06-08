import { describe, expect, it } from "vitest";
import {
  assistantWeatherTemperatureMismatch,
  buildWeatherForecastCorrectionNudge,
  buildWeatherZipConfirmLine,
  buildWeatherZipLookupLine,
  extractFirstTemperatureFahrenheit,
  fahrenheitToCelsiusRounded,
  formatBriefWeatherReport,
  formatSpokenTemperaturePair,
  isAssistantPostForecastDerail,
  spellZipForVoice,
  formatPossibleLocationLabel,
  isAssistantWeatherForecast,
  isAssistantWeatherLookupPending,
  extractZipFromAssistantReadBack,
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
  weatherLookupExpectedTempF,
  weatherLookupSpeakLines,
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

  it("extracts ZIP from assistant read-back", () => {
    expect(
      extractZipFromAssistantReadBack(
        "I have ZIP code 0 7 4 2 4 for Little Falls, New Jersey. Is that correct?"
      )
    ).toBe("07424");
    expect(extractZipFromAssistantReadBack("ZIP 10001 for New York")).toBe("10001");
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
    expect(
      normalizeSpokenUsZipCode("okay , it's 0 , 7 , 4 24. That's my zip code.")
    ).toBe("07424");
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
      "seventy two degrees Fahrenheit, about twenty two degrees Celsius"
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
    expect(report).toContain(
      "seventy two degrees Fahrenheit, about twenty two degrees Celsius"
    );
    expect(report).toContain(
      "sixty five degrees Fahrenheit, about eighteen degrees Celsius"
    );
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

  it("uses a 1s pause before close queue after forecast", () => {
    expect(WEATHER_POST_FORECAST_GOODBYE_PAUSE_MS).toBe(1000);
    const nudge = buildWeatherForecastGoodbyeNudge();
    expect(nudge).toContain(VOICE_DEMO_WEATHER_FORECAST_DONE_CUE);
    expect(nudge).toMatch(/CLOSE QUEUE/i);
    expect(nudge).toMatch(/cool-reaction/i);
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

  it("nudges retry before goodbye when lookup fails once", () => {
    const nudge = buildWeatherLookupFailedNudge("Weather service is unavailable.");
    expect(nudge).toContain("[weather-lookup-failed]");
    expect(nudge).toMatch(/try that weather lookup again/i);
    expect(nudge).not.toMatch(/FINAL GOODBYE/i);
  });

  it("nudges graceful goodbye when lookup retries are exhausted", () => {
    const nudge = buildWeatherLookupFailedNudge("Weather service is unavailable.", {
      retriesExhausted: true,
    });
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

  it("detects wrong spoken temperature vs API briefReport", () => {
    expect(extractFirstTemperatureFahrenheit("it's 66 degrees Fahrenheit")).toBe(66);
    expect(
      assistantWeatherTemperatureMismatch(
        77,
        "In Little Falls it's 66 degrees Fahrenheit with humidity"
      )
    ).toBe(true);
    expect(
      assistantWeatherTemperatureMismatch(
        77,
        "In Little Falls it's 77 degrees Fahrenheit with humidity"
      )
    ).toBe(false);
  });

  it("detects post-forecast apology derail", () => {
    expect(isAssistantPostForecastDerail("I'm sorry, thank you, have a good day.")).toBe(
      true
    );
    expect(
      isAssistantPostForecastDerail("Thank you for contacting 998 Web Designs. Goodbye.")
    ).toBe(false);
  });

  it("reads expected temperature from lookup result", () => {
    expect(weatherLookupExpectedTempF({ temperatureF: 77.1, briefReport: "x" })).toBe(77);
  });

  it("nudges correction when forecast was wrong", () => {
    const report =
      "In Little Falls, New Jersey, it's seventy-seven degrees Fahrenheit, about twenty-five degrees Celsius with clear skies, 40% humidity, and winds around 5 miles per hour.";
    const nudge = buildWeatherForecastCorrectionNudge(report);
    expect(nudge).toContain("[weather-forecast-correction]");
    expect(nudge).toContain(report);
  });

  it("extracts spoken forecast lines from lookup result", () => {
    const lines = weatherLookupSpeakLines({
      spokenLookup: "Thank you — one moment.",
      briefReport: "In Little Falls, New Jersey, it's 72 degrees Fahrenheit.",
    });
    expect(lines?.spokenLookup).toContain("one moment");
    expect(lines?.briefReport).toContain("Little Falls");
    expect(weatherLookupSpeakLines({ spokenLookup: "", briefReport: "x" })).toBeNull();
  });
});
