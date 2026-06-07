import { describe, expect, it } from "vitest";
import {
  buildWeatherForecastCoolReactionNudge,
  buildWeatherImplementAskNudge,
  buildWeatherPromoAskNudge,
  isAssistantImplementAsk,
  isAssistantWeatherCoolReaction,
  isCloseQueueInterest,
  shouldBlockPromoOffer,
} from "@/lib/voice-demo-close-queue";
import {
  VOICE_DEMO_PROMO_EMAIL_ASK_LINE,
  VOICE_DEMO_WEATHER_COOL_REACTION_LINE,
  VOICE_DEMO_WEATHER_IMPLEMENT_ASK_LINE,
} from "@/lib/voice-demo-constants";
import { isAssistantPromoAsk } from "@/lib/voice-demo-weather-flow";

describe("voice-demo-close-queue", () => {
  it("detects scripted close-queue assistant lines", () => {
    expect(isAssistantWeatherCoolReaction(VOICE_DEMO_WEATHER_COOL_REACTION_LINE)).toBe(
      true
    );
    expect(isAssistantImplementAsk(VOICE_DEMO_WEATHER_IMPLEMENT_ASK_LINE)).toBe(true);
    expect(isAssistantPromoAsk(VOICE_DEMO_PROMO_EMAIL_ASK_LINE)).toBe(true);
  });

  it("blocks promo until close queue reaches promo consent", () => {
    expect(
      shouldBlockPromoOffer({
        forecastComplete: false,
        closeQueuePhase: "idle",
      })
    ).toBe(true);
    expect(
      shouldBlockPromoOffer({
        forecastComplete: true,
        closeQueuePhase: "awaiting_cool_reaction",
      })
    ).toBe(true);
    expect(
      shouldBlockPromoOffer({
        forecastComplete: true,
        closeQueuePhase: "awaiting_promo_consent",
      })
    ).toBe(false);
  });

  it("treats maybe as implement interest", () => {
    expect(isCloseQueueInterest("maybe")).toBe(true);
    expect(isCloseQueueInterest("yes please")).toBe(true);
    expect(isCloseQueueInterest("no thanks")).toBe(false);
  });

  it("builds nudges with exact scripted lines", () => {
    expect(buildWeatherForecastCoolReactionNudge()).toContain(
      VOICE_DEMO_WEATHER_COOL_REACTION_LINE
    );
    expect(buildWeatherImplementAskNudge()).toContain(VOICE_DEMO_WEATHER_IMPLEMENT_ASK_LINE);
    expect(buildWeatherPromoAskNudge()).toContain(VOICE_DEMO_PROMO_EMAIL_ASK_LINE);
  });
});
