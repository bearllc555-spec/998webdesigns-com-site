import { describe, expect, it } from "vitest";
import { mergeTranscriptChunk } from "@/lib/voice-demo-caption";

describe("mergeTranscriptChunk", () => {
  it("returns chunk when existing is empty", () => {
    expect(mergeTranscriptChunk("", "hello")).toBe("hello");
  });

  it("appends delta chunks", () => {
    expect(mergeTranscriptChunk("hello", "world")).toBe("hello world");
  });

  it("uses cumulative chunk when it extends existing", () => {
    expect(mergeTranscriptChunk("hello", "hello world")).toBe("hello world");
  });

  it("ignores duplicate suffix", () => {
    expect(mergeTranscriptChunk("hello world", "world")).toBe("hello world");
  });

  it("ignores shorter prefix of existing", () => {
    expect(mergeTranscriptChunk("hello world", "hello")).toBe("hello world");
  });
});
