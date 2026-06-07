import { describe, expect, it } from "vitest";
import {
  JARVIS_AUDIO_IDLE,
  smoothJarvisAudioLevels,
} from "@/lib/voice-demo-jarvis-audio-level";

describe("voice-demo-jarvis-audio-level", () => {
  it("smooths upward jumps faster than decay", () => {
    const next = smoothJarvisAudioLevels(JARVIS_AUDIO_IDLE, {
      volume: 1,
      bass: 1,
      mid: 0.5,
      treble: 0.2,
    });
    expect(next.volume).toBeGreaterThan(0);
    expect(next.volume).toBeLessThan(1);

    const decay = smoothJarvisAudioLevels(next, JARVIS_AUDIO_IDLE);
    expect(decay.volume).toBeLessThan(next.volume);
  });
});
