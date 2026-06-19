import { describe, expect, it } from "vitest";
import { extractFirstEmail } from "@/lib/extract-email";

describe("extractFirstEmail", () => {
  it("finds email in chat text", () => {
    const hit = extractFirstEmail("Reach me at jane.doe@acmeplumbing.com thanks!");
    expect(hit?.email).toBe("jane.doe@acmeplumbing.com");
    expect(hit?.snippet).toContain("jane.doe@acmeplumbing.com");
  });

  it("ignores linkedin.com addresses", () => {
    expect(extractFirstEmail("noreply@linkedin.com")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(extractFirstEmail("")).toBeNull();
  });
});
