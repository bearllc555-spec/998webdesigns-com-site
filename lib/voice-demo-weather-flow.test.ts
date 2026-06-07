import { describe, expect, it } from "vitest";
import {
  assistantZipReadBackMissingStagedCity,
  isAssistantPromoAsk,
  isAssistantZipCollectionPrompt,
  isAssistantZipReadBackPrompt,
  isAssistantWeatherOfferPrompt,
  isWeatherCloseQueueIncomplete,
  isWeatherDemoIncomplete,
  isWeatherZipFlowActive,
  shouldBlockClientFarewellHangup,
  shouldStageWeatherZipFromUserInput,
  shouldSuppressAssistantAudioDuringWeather,
} from "@/lib/voice-demo-weather-flow";

const idleWeather = {
  awaitingWeatherYesNo: false,
  awaitingZipDigits: false,
  awaitingZipConfirm: false,
  awaitingWeatherForecastDelivery: false,
  zipDigitsHeardMax: 0,
  weatherDemoAccepted: false,
};

describe("voice-demo-weather-flow", () => {
  it("detects weather offer and ZIP collection prompts", () => {
    expect(
      isAssistantWeatherOfferPrompt("Before you go, do you want to see something cool?")
    ).toBe(true);
    expect(
      isAssistantZipCollectionPrompt(
        "If you give me your ZIP code, I can tell you the weather forecast in your city."
      )
    ).toBe(true);
    expect(isAssistantZipReadBackPrompt("I have ZIP code 0 7 4 2 4. Is that correct?")).toBe(
      true
    );
    expect(
      isAssistantZipReadBackPrompt(
        "I have ZIP code 0 7 4 2 4 for Little Falls, New Jersey. Is that correct?"
      )
    ).toBe(true);
    expect(
      isAssistantZipCollectionPrompt(
        "I didn't get that ZIP code — can you please repeat it? If you give me your ZIP code, I can tell you the weather forecast in your city."
      )
    ).toBe(true);
    expect(isAssistantZipCollectionPrompt("What's your five-digit ZIP?")).toBe(true);
  });

  it("detects promo ask and active weather ZIP flow", () => {
    expect(
      isAssistantPromoAsk(
        "Would you like me to send you a coupon code to save 20% off a web design package?"
      )
    ).toBe(true);
    expect(isAssistantPromoAsk("Would you like the VOICE20 discount code by email?")).toBe(
      true
    );
    expect(isAssistantPromoAsk("What is your ZIP code?")).toBe(false);
    expect(
      isWeatherZipFlowActive({
        ...idleWeather,
        weatherDemoAccepted: true,
      })
    ).toBe(true);
    expect(isWeatherZipFlowActive(idleWeather)).toBe(false);
  });

  it("flags incomplete weather until forecast is complete", () => {
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        stagedZipPending: false,
        zipLookupTriggered: false,
        forecastComplete: false,
        closeQueuePhase: "idle",
      })
    ).toBe(true);
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        stagedZipPending: true,
        zipLookupTriggered: false,
        forecastComplete: false,
        closeQueuePhase: "idle",
      })
    ).toBe(true);
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        zipLookupTriggered: true,
        stagedZipPending: false,
        forecastComplete: false,
        closeQueuePhase: "idle",
      })
    ).toBe(true);
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        zipLookupTriggered: true,
        stagedZipPending: false,
        forecastComplete: true,
        closeQueuePhase: "awaiting_cool_reaction",
      })
    ).toBe(true);
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        zipLookupTriggered: true,
        stagedZipPending: false,
        forecastComplete: true,
        closeQueuePhase: "idle",
      })
    ).toBe(true);
    expect(
      isWeatherCloseQueueIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        zipLookupTriggered: true,
        stagedZipPending: false,
        forecastComplete: true,
        closeQueuePhase: "promo_sent",
      })
    ).toBe(true);
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        zipLookupTriggered: true,
        stagedZipPending: false,
        forecastComplete: true,
        closeQueuePhase: "skipped_to_wrapup",
      })
    ).toBe(false);
  });

  it("detects ZIP read-back missing staged city", () => {
    const staged = {
      city: "Little Falls",
      spokenConfirm:
        "I have ZIP code 0 7 4 2 4 for Little Falls, New Jersey. Is that correct?",
    };
    expect(
      assistantZipReadBackMissingStagedCity("07424 — is that correct?", staged)
    ).toBe(true);
    expect(assistantZipReadBackMissingStagedCity(staged.spokenConfirm, staged)).toBe(
      false
    );
  });

  it("stages ZIP from user input when zip prompt was seen", () => {
    expect(
      shouldStageWeatherZipFromUserInput({
        awaitingZipDigits: false,
        weatherDemoAccepted: false,
        zipPromptSeen: true,
        zipDigitsHeardMax: 0,
      })
    ).toBe(true);
    expect(
      shouldStageWeatherZipFromUserInput({
        awaitingZipDigits: false,
        weatherDemoAccepted: false,
        zipPromptSeen: false,
        zipDigitsHeardMax: 5,
      })
    ).toBe(true);
    expect(
      shouldStageWeatherZipFromUserInput({
        awaitingZipDigits: false,
        weatherDemoAccepted: false,
        zipPromptSeen: false,
        zipDigitsHeardMax: 2,
      })
    ).toBe(false);
  });

  it("suppresses promo audio while weather demo is incomplete", () => {
    expect(
      shouldSuppressAssistantAudioDuringWeather({
        weatherDemoIncomplete: true,
        assistantText:
          "Would you like me to send you a coupon code to save 20% off a web design package?",
        forecastComplete: false,
        closeQueuePhase: "idle",
      })
    ).toBe(true);
    expect(
      shouldSuppressAssistantAudioDuringWeather({
        weatherDemoIncomplete: true,
        assistantText:
          "In Little Falls it is 72 degrees Fahrenheit, about 22 degrees Celsius, humidity 45 percent, wind 8 miles per hour, clear skies.",
        forecastComplete: false,
        closeQueuePhase: "idle",
      })
    ).toBe(false);
    expect(
      shouldSuppressAssistantAudioDuringWeather({
        weatherDemoIncomplete: true,
        assistantText:
          "Would you like me to send you a coupon code to save 20% off a web design package?",
        forecastComplete: true,
        closeQueuePhase: "awaiting_cool_reaction",
      })
    ).toBe(true);
    expect(
      shouldSuppressAssistantAudioDuringWeather({
        weatherDemoIncomplete: true,
        assistantText:
          "Would you like me to send you a coupon code to save 20% off a web design package?",
        forecastComplete: true,
        closeQueuePhase: "awaiting_promo_consent",
      })
    ).toBe(false);
  });

  it("blocks client farewell hangup during weather ZIP collection", () => {
    const collectingZip = {
      ...idleWeather,
      awaitingZipDigits: true,
      weatherDemoAccepted: true,
      stagedZipPending: false,
      zipLookupTriggered: false,
      forecastComplete: false,
      closeQueuePhase: "idle",
    };
    expect(
      shouldBlockClientFarewellHangup({
        goodbyeNudgeSent: false,
        progress: collectingZip,
      })
    ).toBe(true);
    expect(
      shouldBlockClientFarewellHangup({
        goodbyeNudgeSent: true,
        progress: {
          ...collectingZip,
          awaitingZipDigits: false,
          awaitingWeatherForecastDelivery: true,
        },
      })
    ).toBe(true);
    expect(
      shouldBlockClientFarewellHangup({
        goodbyeNudgeSent: true,
        progress: {
          ...collectingZip,
          awaitingZipDigits: false,
          forecastComplete: true,
          zipLookupTriggered: true,
          closeQueuePhase: "idle",
        },
      })
    ).toBe(true);
  });
});
