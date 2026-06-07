import { describe, expect, it } from "vitest";
import {
  buildWeatherDeclineNudge,
  buildWeatherYesNoPauseNudge,
  buildZipPauseNudge,
  isWeatherOfferAccept,
  isWeatherOfferDecline,
  VOICE_DEMO_WEATHER_DECLINE_CUE,
  VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE,
  VOICE_DEMO_ZIP_PAUSE_CUE,
} from "@/lib/voice-demo-zip-nudge";

describe("voice-demo-zip-nudge", () => {
  it("nudges confirm_weather_zip when five digits heard", () => {
    const nudge = buildZipPauseNudge("07424");
    expect(nudge).toContain(VOICE_DEMO_ZIP_PAUSE_CUE);
    expect(nudge).toContain("confirm_weather_zip");
    expect(nudge).toContain("07424");
  });

  it("nudges ZIP repeat when fewer than five digits heard", () => {
    const nudge = buildZipPauseNudge("0742");
    expect(nudge).toContain("five-digit ZIP");
  });

  it("nudges weather yes/no when visitor goes quiet", () => {
    const nudge = buildWeatherYesNoPauseNudge();
    expect(nudge).toContain(VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE);
    expect(nudge).toMatch(/yes or no/i);
  });

  it("nudges goodbye path when visitor declines weather", () => {
    const nudge = buildWeatherDeclineNudge();
    expect(nudge).toContain(VOICE_DEMO_WEATHER_DECLINE_CUE);
    expect(nudge).toMatch(/end_conversation/i);
  });

  it("detects weather offer accept and decline phrases", () => {
    expect(isWeatherOfferAccept("yes please")).toBe(true);
    expect(isWeatherOfferDecline("no thanks")).toBe(true);
    expect(isWeatherOfferDecline("nothing else")).toBe(false);
  });
});
