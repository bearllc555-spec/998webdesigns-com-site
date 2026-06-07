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

  it("marks returning visitor name as saved", () => {
    expect(seedOnboardingFromFullName("  Anthony  ")).toEqual({
      nameOnFile: "Anthony",
      nameSaved: true,
      savedName: "Anthony",
    });
  });
});
