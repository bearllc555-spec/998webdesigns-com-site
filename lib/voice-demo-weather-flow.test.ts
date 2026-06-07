import { describe, expect, it } from "vitest";
import {
  assistantZipReadBackMissingStagedCity,
  isAssistantPromoAsk,
  isAssistantZipCollectionPrompt,
  isAssistantZipReadBackPrompt,
  isAssistantWeatherOfferPrompt,
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
    expect(isAssistantPromoAsk("Do you mind if I send you a coupon code via email?")).toBe(
      true
    );
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
      })
    ).toBe(true);
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        stagedZipPending: true,
        zipLookupTriggered: false,
        forecastComplete: false,
      })
    ).toBe(true);
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        zipLookupTriggered: true,
        stagedZipPending: false,
        forecastComplete: false,
      })
    ).toBe(true);
    expect(
      isWeatherDemoIncomplete({
        ...idleWeather,
        weatherDemoAccepted: true,
        zipLookupTriggered: true,
        stagedZipPending: false,
        forecastComplete: true,
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
        assistantText: "Do you mind if I send you a coupon code via email?",
        forecastComplete: false,
      })
    ).toBe(true);
    expect(
      shouldSuppressAssistantAudioDuringWeather({
        weatherDemoIncomplete: true,
        assistantText:
          "In Little Falls it is 72 degrees Fahrenheit, about 22 degrees Celsius, humidity 45 percent, wind 8 miles per hour, clear skies.",
        forecastComplete: false,
      })
    ).toBe(false);
    expect(
      shouldSuppressAssistantAudioDuringWeather({
        weatherDemoIncomplete: false,
        assistantText: "Do you mind if I send you a coupon code via email?",
        forecastComplete: false,
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
        },
      })
    ).toBe(false);
  });
});
