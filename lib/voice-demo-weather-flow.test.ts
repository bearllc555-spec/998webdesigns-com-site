import { describe, expect, it } from "vitest";
import {
  isAssistantZipCollectionPrompt,
  isAssistantZipReadBackPrompt,
  isAssistantWeatherOfferPrompt,
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
  });
});
