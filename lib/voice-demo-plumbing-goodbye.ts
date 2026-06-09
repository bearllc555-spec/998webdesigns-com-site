/** Natural pause before Jarvis signs off after the caller says goodbye. */
export const PLUMBING_GOODBYE_BEAT_MS = 1_800;

export const PLUMBING_GOODBYE_BEAT_CUE = "[plumbing-goodbye-beat]";

export function buildPlumbingGoodbyeBeatNudge(): string {
  return (
    `${PLUMBING_GOODBYE_BEAT_CUE} The caller is ending the call. ` +
    `Give ONE brief, warm sign-off for Metro Plumbing & Drain — relaxed and human, not rushed. ` +
    `Do not echo their goodbye instantly; a beat of silence already passed.`
  );
}
