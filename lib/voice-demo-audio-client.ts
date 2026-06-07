const SEND_SAMPLE_RATE = 16000;
const RECEIVE_SAMPLE_RATE = 24000;

function floatTo16BitPCM(float32: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]!));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export type VoiceDemoMicHandle = {
  stop: () => void;
};

function startVoiceDemoMicFromStream(
  stream: MediaStream,
  onPcmChunk: (base64Pcm: string) => void
): VoiceDemoMicHandle {
  let stopped = false;
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);
  const inputRate = audioContext.sampleRate;
  const ratio = inputRate / SEND_SAMPLE_RATE;
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    const outLength = Math.floor(input.length / ratio);
    const downsampled = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      downsampled[i] = input[Math.floor(i * ratio)] ?? 0;
    }
    const pcm = floatTo16BitPCM(downsampled);
    onPcmChunk(arrayBufferToBase64(pcm));
  };

  source.connect(processor);
  processor.connect(audioContext.destination);

  return {
    stop: () => {
      stopped = true;
      processor.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void audioContext.close();
    },
  };
}

export async function requestVoiceDemoMicStream(): Promise<MediaStream> {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone is not supported in this browser.");
  }
  return navigator.mediaDevices.getUserMedia({ audio: true });
}

export function startVoiceDemoMic(
  stream: MediaStream,
  onPcmChunk: (base64Pcm: string) => void
): VoiceDemoMicHandle {
  return startVoiceDemoMicFromStream(stream, onPcmChunk);
}

export class VoiceDemoAudioPlayer {
  private ctx: AudioContext | null = null;
  private nextTime = 0;
  private analyser: AnalyserNode | null = null;
  private freqBuf: Uint8Array | null = null;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: RECEIVE_SAMPLE_RATE });
      this.nextTime = this.ctx.currentTime;
    }
    return this.ctx;
  }

  private ensureAnalyser(ctx: AudioContext): AnalyserNode {
    if (!this.analyser) {
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.72;
      this.analyser.connect(ctx.destination);
      this.freqBuf = new Uint8Array(this.analyser.frequencyBinCount);
    }
    return this.analyser;
  }

  getAnalyser(): { analyser: AnalyserNode; freqBuf: Uint8Array } | null {
    if (!this.ctx || !this.analyser || !this.freqBuf) return null;
    return { analyser: this.analyser, freqBuf: this.freqBuf };
  }

  /** True while assistant PCM is still playing (or queued). */
  isPlaying(): boolean {
    if (!this.ctx) return false;
    return this.ctx.currentTime < this.nextTime - 0.04;
  }

  enqueueBase64Pcm(base64: string): void {
    const ctx = this.ensureContext();
    const analyser = this.ensureAnalyser(ctx);
    const buffer = base64ToArrayBuffer(base64);
    const view = new DataView(buffer);
    const sampleCount = buffer.byteLength / 2;
    const audioBuffer = ctx.createBuffer(1, sampleCount, RECEIVE_SAMPLE_RATE);
    const channel = audioBuffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      channel[i] = view.getInt16(i * 2, true) / 0x8000;
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);

    const start = Math.max(ctx.currentTime, this.nextTime);
    source.start(start);
    this.nextTime = start + audioBuffer.duration;
  }

  reset(): void {
    this.nextTime = this.ensureContext().currentTime;
  }

  /** Resolves when queued assistant audio has finished (or maxWaitMs elapses). */
  whenPlaybackIdle(maxWaitMs = 12000): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve();

    const started = Date.now();
    return new Promise((resolve) => {
      const tick = () => {
        const remainingSec = this.nextTime - ctx.currentTime;
        if (remainingSec <= 0.05 || Date.now() - started >= maxWaitMs) {
          resolve();
          return;
        }
        setTimeout(tick, 80);
      };
      tick();
    });
  }

  close(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.nextTime = 0;
    this.analyser = null;
    this.freqBuf = null;
  }
}
