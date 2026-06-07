/** Normalized 0–1 levels from Jarvis playback audio. */
export type JarvisAudioLevels = {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
};

export const JARVIS_AUDIO_IDLE: JarvisAudioLevels = {
  volume: 0,
  bass: 0,
  mid: 0,
  treble: 0,
};

function bandAverage(data: Uint8Array, start: number, end: number): number {
  if (end <= start) return 0;
  let sum = 0;
  for (let i = start; i < end; i++) {
    sum += data[i] ?? 0;
  }
  return sum / (end - start) / 255;
}

/** Read frequency bands from an AnalyserNode (call each animation frame). */
export function readJarvisAudioLevels(analyser: AnalyserNode, freqBuf: Uint8Array): JarvisAudioLevels {
  analyser.getByteFrequencyData(freqBuf);
  const len = freqBuf.length;
  const bassEnd = Math.max(2, Math.floor(len * 0.12));
  const midEnd = Math.max(bassEnd + 1, Math.floor(len * 0.45));
  const bass = bandAverage(freqBuf, 0, bassEnd);
  const mid = bandAverage(freqBuf, bassEnd, midEnd);
  const treble = bandAverage(freqBuf, midEnd, len);
  const volume = bass * 0.45 + mid * 0.35 + treble * 0.2;
  return { volume, bass, mid, treble };
}

/** Smooth level jumps for visual polish. */
export function smoothJarvisAudioLevels(
  prev: JarvisAudioLevels,
  next: JarvisAudioLevels,
  attack = 0.35,
  release = 0.12
): JarvisAudioLevels {
  const smooth = (p: number, n: number) => {
    const rate = n > p ? attack : release;
    return p + (n - p) * rate;
  };
  return {
    volume: smooth(prev.volume, next.volume),
    bass: smooth(prev.bass, next.bass),
    mid: smooth(prev.mid, next.mid),
    treble: smooth(prev.treble, next.treble),
  };
}
