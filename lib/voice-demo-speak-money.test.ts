import { describe, expect, it } from "vitest";
import { speakUsdDollars } from "@/lib/voice-demo-speak-money";

describe("voice-demo-speak-money", () => {
  it("speaks common 998 prices in full words", () => {
    expect(speakUsdDollars(499)).toBe("four hundred and ninety nine dollars");
    expect(speakUsdDollars(5998)).toBe(
      "five thousand, nine hundred and ninety eight dollars"
    );
    expect(speakUsdDollars(198)).toBe("one hundred and ninety eight dollars");
    expect(speakUsdDollars(2996)).toBe(
      "two thousand, nine hundred and ninety six dollars"
    );
    expect(speakUsdDollars(149)).toBe("one hundred and forty nine dollars");
    expect(speakUsdDollars(79)).toBe("seventy nine dollars");
  });
});
