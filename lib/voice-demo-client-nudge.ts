import type { VoiceDemoAudioPlayer } from "@/lib/voice-demo-audio-client";
import type { Session } from "@google/genai";

export const VOICE_DEMO_NUDGE_FLUSH_MAX_WAIT_MS = 12_000;

export type VoiceDemoClientNudgeOpts = {
  /** Stop assistant audio before injecting the nudge (corrections / barge-in recovery). */
  hardStop?: boolean;
  maxWaitMs?: number;
};

export type VoiceDemoNudgeQueue = {
  pending: Array<{ turns: string[]; opts: VoiceDemoClientNudgeOpts }>;
  flushInFlight: boolean;
};

export function createVoiceDemoNudgeQueue(): VoiceDemoNudgeQueue {
  return { pending: [], flushInFlight: false };
}

/**
 * Send a client-owned nudge only after assistant playback is idle (unless hardStop).
 * Never inject turnComplete while Jarvis is still speaking - avoids interrupt loops.
 */
export async function sendVoiceDemoClientNudge(
  session: Session,
  player: VoiceDemoAudioPlayer | null,
  turns: string | string[],
  opts: VoiceDemoClientNudgeOpts = {}
): Promise<boolean> {
  const normalized = (Array.isArray(turns) ? turns : [turns]).map((t) => t.trim()).filter(Boolean);
  if (normalized.length === 0) return false;

  const maxWaitMs = opts.maxWaitMs ?? VOICE_DEMO_NUDGE_FLUSH_MAX_WAIT_MS;
  if (opts.hardStop) {
    player?.hardStop();
  } else if (player?.isPlaying()) {
    await player.whenPlaybackIdle(maxWaitMs);
  }

  try {
    session.sendClientContent({ turns: normalized, turnComplete: true });
    return true;
  } catch {
    return false;
  }
}

export function enqueueVoiceDemoClientNudge(
  queue: VoiceDemoNudgeQueue,
  turns: string | string[],
  opts: VoiceDemoClientNudgeOpts = {}
): void {
  const normalized = (Array.isArray(turns) ? turns : [turns]).map((t) => t.trim()).filter(Boolean);
  if (normalized.length === 0) return;
  queue.pending.push({ turns: normalized, opts });
}

/** Flush queued nudges after turnComplete + playback idle (one at a time). */
export async function flushVoiceDemoClientNudgeQueue(
  session: Session | null,
  player: VoiceDemoAudioPlayer | null,
  queue: VoiceDemoNudgeQueue,
  maxWaitMs = VOICE_DEMO_NUDGE_FLUSH_MAX_WAIT_MS
): Promise<void> {
  if (queue.flushInFlight || queue.pending.length === 0 || !session) return;
  queue.flushInFlight = true;
  try {
    await player?.whenPlaybackIdle(maxWaitMs);
    while (queue.pending.length > 0 && session) {
      const item = queue.pending.shift()!;
      await sendVoiceDemoClientNudge(session, player, item.turns, item.opts);
      if (queue.pending.length > 0) {
        await player?.whenPlaybackIdle(maxWaitMs);
      }
    }
  } finally {
    queue.flushInFlight = false;
  }
}
