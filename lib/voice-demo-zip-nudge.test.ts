import { describe, expect, it } from "vitest";
import { VOICE_DEMO_GOODBYE_LINE } from "@/lib/voice-demo-constants";
import {
  buildWeatherDeclineNudge,
  buildWeatherYesNoGiveUpNudge,
  buildWeatherYesNoPauseNudge,
  buildZipPauseNudge,
  isWeatherOfferAccept,
  isWeatherOfferDecline,
  isWeatherZipConfirmAccept,
  isWeatherZipConfirmDecline,
  VOICE_DEMO_WEATHER_DECLINE_CUE,
  VOICE_DEMO_WEATHER_YESNO_GIVEUP_CUE,
  VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE,
  VOICE_DEMO_ZIP_PAUSE_CUE,
} from "@/lib/voice-demo-zip-nudge";

describe("voice-demo-zip-nudge", () => {
  it("nudges confirm_weather_zip when five digits heard", () => {
    const nudge = buildZipPauseNudge("07424");
    expect(nudge).toContain(VOICE_DEMO_ZIP_PAUSE_CUE);
    expect(nudge).toContain("confirm_weather_zip");
    expect(nudge).toContain("07424");
    expect(nudge).toMatch(/wait for yes or no/i);
    expect(nudge).toMatch(/userConfirmed true/i);
  });

  it("nudges ZIP repeat when fewer than five digits heard", () => {
    const nudge = buildZipPauseNudge("0742");
    expect(nudge).toContain("five-digit ZIP");
  });

  it("does not nudge a duplicate ZIP ask when transcript is empty", () => {
    expect(buildZipPauseNudge("")).toBeNull();
    expect(buildZipPauseNudge("   ")).toBeNull();
  });

  it("nudges didn't-get and repeat when visitor is silent", () => {
    const nudge = buildWeatherYesNoPauseNudge();
    expect(nudge).toContain(VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE);
    expect(nudge).toContain("I didn't get that.");
    expect(nudge).toContain("Do you want to see something cool?");
    expect(nudge).toMatch(/wait for yes or no/i);
  });

  it("nudges goodbye and end_conversation after repeat weather offer silence", () => {
    const nudge = buildWeatherYesNoGiveUpNudge();
    expect(nudge).toContain(VOICE_DEMO_WEATHER_YESNO_GIVEUP_CUE);
    expect(nudge).toContain(VOICE_DEMO_GOODBYE_LINE);
    expect(nudge).toMatch(/end_conversation/i);
    expect(nudge).toMatch(/Do not ask again/i);
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

  it("detects ZIP read-back confirm accept and decline", () => {
    expect(isWeatherZipConfirmAccept("yes that's correct")).toBe(true);
    expect(isWeatherZipConfirmDecline("no that's wrong")).toBe(true);
  });
});
