import { describe, expect, it } from "vitest";
import {
  isAssistantPromoAsk,
  isAssistantZipCollectionPrompt,
  isAssistantZipReadBackPrompt,
  isAssistantWeatherOfferPrompt,
  isWeatherZipFlowActive,
} from "@/lib/voice-demo-weather-flow";

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
      isAssistantZipCollectionPrompt(
        "I didn't get that ZIP code — can you please repeat it? If you give me your ZIP code, I can tell you the weather forecast in your city."
      )
    ).toBe(true);
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
        awaitingWeatherYesNo: false,
        awaitingZipDigits: false,
        awaitingZipConfirm: false,
        awaitingWeatherForecastDelivery: false,
        zipDigitsHeardMax: 0,
        weatherDemoAccepted: true,
      })
    ).toBe(true);
    expect(
      isWeatherZipFlowActive({
        awaitingWeatherYesNo: false,
        awaitingZipDigits: false,
        awaitingZipConfirm: false,
        awaitingWeatherForecastDelivery: false,
        zipDigitsHeardMax: 0,
        weatherDemoAccepted: false,
      })
    ).toBe(false);
  });
});
