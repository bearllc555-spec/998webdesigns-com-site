import { describe, expect, it } from "vitest";
import { coerceToolBoolean, coerceToolString } from "@/lib/voice-demo-tool-args";

describe("voice-demo-tool-args", () => {
  it("coerces zip strings and numbers", () => {
    expect(coerceToolString(" 07424 ")).toBe("07424");
    expect(coerceToolString(7424)).toBe("7424");
    expect(coerceToolString(null)).toBe("");
  });

  it("coerces loose boolean confirmations", () => {
    expect(coerceToolBoolean(true)).toBe(true);
    expect(coerceToolBoolean("true")).toBe(true);
    expect(coerceToolBoolean("yes")).toBe(true);
    expect(coerceToolBoolean(1)).toBe(true);
    expect(coerceToolBoolean(false)).toBe(false);
    expect(coerceToolBoolean("no")).toBe(false);
  });
});
