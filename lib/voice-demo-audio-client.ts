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

export function startVoiceDemoMic(
  onPcmChunk: (base64Pcm: string) => void
): VoiceDemoMicHandle | null {
  if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  let stopped = false;
  let audioContext: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let processor: ScriptProcessorNode | null = null;

  void (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (stopped) return;

      audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const inputRate = audioContext.sampleRate;
      const ratio = inputRate / SEND_SAMPLE_RATE;
      processor = audioContext.createScriptProcessor(4096, 1, 1);

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
    } catch (err) {
      console.warn("[voice-demo-audio] mic error", err);
    }
  })();

  return {
    stop: () => {
      stopped = true;
      processor?.disconnect();
      stream?.getTracks().forEach((t) => t.stop());
      void audioContext?.close();
    },
  };
}

export class VoiceDemoAudioPlayer {
  private ctx: AudioContext | null = null;
  private nextTime = 0;

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: RECEIVE_SAMPLE_RATE });
      this.nextTime = this.ctx.currentTime;
    }
    return this.ctx;
  }

  enqueueBase64Pcm(base64: string): void {
    const ctx = this.ensureContext();
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
    source.connect(ctx.destination);

    const start = Math.max(ctx.currentTime, this.nextTime);
    source.start(start);
    this.nextTime = start + audioBuffer.duration;
  }

  reset(): void {
    this.nextTime = this.ensureContext().currentTime;
  }

  close(): void {
    void this.ctx?.close();
    this.ctx = null;
    this.nextTime = 0;
  }
}
