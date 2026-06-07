export type VoiceDemoCaptionRole = "user" | "assistant";

export type VoiceDemoCaption = {
  role: VoiceDemoCaptionRole;
  text: string;
};

/** Merge streaming STT chunks (cumulative or delta) into one line. */
export function mergeTranscriptChunk(existing: string, chunk: string): string {
  const prev = existing.trim();
  const next = chunk.trim();
  if (!next) return prev;
  if (!prev) return next;
  if (next === prev) return prev;
  if (next.startsWith(prev)) return next;
  if (prev.startsWith(next)) return prev;
  if (prev.endsWith(next)) return prev;
  return `${prev} ${next}`;
}
