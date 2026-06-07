import { describe, expect, it } from "vitest";
import { VOICE_DEMO_GOODBYE_LINE } from "@/lib/voice-demo-constants";
import {
  buildPromoBlockedDuringWeatherNudge,
  buildZipOnlyAfterAmbiguousYesNudge,
  buildWeatherAcceptZipNudge,
  buildWeatherDeclineNudge,
  buildWeatherYesNoGiveUpNudge,
  buildWeatherYesNoPauseNudge,
  buildZipPauseNudge,
  buildZipSilenceGiveUpNudge,
  buildZipSilenceRepeatNudge,
  buildZipCityCorrectionNudge,
  buildZipStagedSpeakNudge,
  isWeatherOfferAccept,
  isWeatherOfferDecline,
  isWeatherZipConfirmAccept,
  isWeatherZipConfirmDecline,
  VOICE_DEMO_PROMO_WEATHER_BLOCKED_CUE,
  VOICE_DEMO_ZIP_AMBIGUOUS_YES_CUE,
  VOICE_DEMO_WEATHER_ACCEPT_ZIP_CUE,
  VOICE_DEMO_WEATHER_DECLINE_CUE,
  VOICE_DEMO_WEATHER_YESNO_GIVEUP_CUE,
  VOICE_DEMO_WEATHER_YESNO_PAUSE_CUE,
  VOICE_DEMO_ZIP_PAUSE_CUE,
  VOICE_DEMO_ZIP_SILENCE_GIVEUP_CUE,
  VOICE_DEMO_ZIP_SILENCE_REPEAT_CUE,
  VOICE_DEMO_ZIP_CITY_CORRECT_CUE,
  VOICE_DEMO_ZIP_STAGED_CUE,
} from "@/lib/voice-demo-zip-nudge";

describe("voice-demo-zip-nudge", () => {
  it("stages ZIP read-back when client already confirmed", () => {
    const nudge = buildZipStagedSpeakNudge(
      "I have ZIP code 0 7 5 1 2 for Totowa, New Jersey. Is that correct?"
    );
    expect(nudge).toContain(VOICE_DEMO_ZIP_STAGED_CUE);
    expect(nudge).toContain("Totowa");
    expect(nudge).toMatch(/Say ONLY this exact sentence/i);
    expect(nudge).toMatch(/Paterson for 07512/i);
    expect(nudge).toMatch(/Do NOT call lookup_weather/i);
  });

  it("corrects wrong city on ZIP read-back", () => {
    const line =
      "I have ZIP code 0 7 5 1 2 for Totowa, New Jersey. Is that correct?";
    const nudge = buildZipCityCorrectionNudge(line);
    expect(nudge).toContain(VOICE_DEMO_ZIP_CITY_CORRECT_CUE);
    expect(nudge).toContain(line);
    expect(nudge).toMatch(/wrong city/i);
  });

  it("tells model to wait for client ZIP staging when five digits heard", () => {
    const nudge = buildZipPauseNudge("07424");
    expect(nudge).toContain(VOICE_DEMO_ZIP_PAUSE_CUE);
    expect(nudge).toContain(VOICE_DEMO_ZIP_STAGED_CUE);
    expect(nudge).toContain("07424");
    expect(nudge).toMatch(/Do NOT call confirm_weather_zip yourself/i);
    expect(nudge).toMatch(/confirm yes on the read-back/i);
  });

  it("nudges ZIP repeat when fewer than five digits heard", () => {
    const nudge = buildZipPauseNudge("074");
    expect(nudge).toContain("five-digit ZIP");
  });

  it("does not build digit nudge when transcript is empty", () => {
    expect(buildZipPauseNudge("")).toBeNull();
    expect(buildZipPauseNudge("   ")).toBeNull();
  });

  it("nudges ZIP repeat when visitor is silent after ZIP ask", () => {
    const nudge = buildZipSilenceRepeatNudge();
    expect(nudge).toContain(VOICE_DEMO_ZIP_SILENCE_REPEAT_CUE);
    expect(nudge).toContain("I didn't get that ZIP code");
    expect(nudge).toMatch(/do not say goodbye/i);
  });

  it("nudges goodbye after second ZIP silence", () => {
    const nudge = buildZipSilenceGiveUpNudge();
    expect(nudge).toContain(VOICE_DEMO_ZIP_SILENCE_GIVEUP_CUE);
    expect(nudge).toContain(VOICE_DEMO_GOODBYE_LINE);
    expect(nudge).toMatch(/end_conversation/i);
    expect(nudge).toMatch(/Do not ask for the ZIP again/i);
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

  it("nudges ZIP-only after weather accept and blocks promo during weather", () => {
    const accept = buildWeatherAcceptZipNudge();
    expect(accept).toContain(VOICE_DEMO_WEATHER_ACCEPT_ZIP_CUE);
    expect(accept).toMatch(/Do NOT mention coupons/i);
    const blocked = buildPromoBlockedDuringWeatherNudge();
    expect(blocked).toContain(VOICE_DEMO_PROMO_WEATHER_BLOCKED_CUE);
    expect(blocked).toMatch(/do NOT offer or send promo/i);
  });

  it("nudges ZIP-only when visitor yes is not promo consent", () => {
    const nudge = buildZipOnlyAfterAmbiguousYesNudge();
    expect(nudge).toContain(VOICE_DEMO_ZIP_AMBIGUOUS_YES_CUE);
    expect(nudge).toMatch(/NOT promo permission/i);
    expect(nudge).toMatch(/send_promo_email/i);
  });
});
