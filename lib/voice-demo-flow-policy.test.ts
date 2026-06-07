import { describe, expect, it } from "vitest";
import { seedOnboardingFromFullName } from "@/lib/voice-demo-flow-policy";

describe("seedOnboardingFromFullName", () => {
  it("returns empty seed when no name", () => {
    expect(seedOnboardingFromFullName(null)).toEqual({
      nameOnFile: null,
      nameSaved: false,
      savedName: "",
    });
  });

  it("seeds returning visitor name without marking session saved", () => {
    expect(seedOnboardingFromFullName("  Anthony  ")).toEqual({
      nameOnFile: "Anthony",
      nameSaved: false,
      savedName: "Anthony",
    });
  });
});
