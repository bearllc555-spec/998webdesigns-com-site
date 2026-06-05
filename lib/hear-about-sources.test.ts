import { describe, expect, it } from "vitest";
import {
  filterHearAboutSources,
  formatHearAboutSources,
} from "@/lib/hear-about-sources";

describe("hear-about-sources", () => {
  it("filters unknown values and dedupes", () => {
    expect(
      filterHearAboutSources(["LinkedIn", "LinkedIn", "nope", "X.com"])
    ).toEqual(["LinkedIn", "X.com"]);
  });

  it("formats sources with Other detail", () => {
    expect(
      formatHearAboutSources(["LinkedIn", "Other"], "Friend referral")
    ).toBe("LinkedIn, Other (Friend referral)");
  });
});
