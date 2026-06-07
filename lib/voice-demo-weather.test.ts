import { describe, expect, it } from "vitest";
import {
  buildWeatherZipConfirmLine,
  formatBriefWeatherReport,
  formatPossibleLocationLabel,
  normalizeUsZipCode,
  VOICE_DEMO_WEATHER_OFFER_LINE,
  VOICE_DEMO_WEATHER_ZIP_ASK_LINE,
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
    expect(normalizeUsZipCode("1234")).toBeNull();
  });

  it("maps WMO codes to spoken labels", () => {
    expect(wmoWeatherLabel(0)).toBe("clear skies");
    expect(wmoWeatherLabel(61)).toBe("rain");
  });

  it("formats a brief spoken weather report", () => {
    const report = formatBriefWeatherReport(
      { city: "Little Falls", stateName: "New Jersey" },
      {
        temperatureF: 72,
        apparentTemperatureF: 70,
        humidityPct: 55,
        windMph: 8,
        conditions: "partly cloudy",
      }
    );
    expect(report).toContain("Little Falls");
    expect(report).toContain("72 degrees");
    expect(report).toContain("partly cloudy");
  });

  it("builds spoken ZIP confirmation before weather fetch", () => {
    expect(
      buildWeatherZipConfirmLine({
        zip: "07424",
        city: "Little Falls",
        stateName: "New Jersey",
      })
    ).toContain("07424");
    expect(
      buildWeatherZipConfirmLine({
        zip: "07424",
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
