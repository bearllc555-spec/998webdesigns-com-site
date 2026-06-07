/** Hidden client cue — never spoken aloud; triggers Jarvis's mandatory opening. */
export const VOICE_DEMO_SESSION_START_CUE = "[session-start]";

export const VOICE_DEMO_INTRO_LINE =
  "Hello — I'm Jarvis, the AI assistant for 998. Who do I have the pleasure of speaking with?";

/** First line after the visitor shares their name (demo onboarding). */
export const VOICE_DEMO_POST_NAME_LINE = "How may I help you today?";

export const VOICE_DEMO_MANDATORY_OPENING = `MANDATORY OPENING (your very first spoken turn in every session — never skip, never wait for the visitor to speak first):
Deliver both parts in one calm British butler greeting:
1. Introduce yourself: "Hello — I'm Jarvis, the AI assistant for 998."
2. Immediately ask: "Who do I have the pleasure of speaking with?"
When you receive the hidden client cue "${VOICE_DEMO_SESSION_START_CUE}", speak this opening right away. Do not read the cue aloud. Do not repeat the full introduction later unless the visitor asks who you are.`;

export function voiceDemoOpeningStatus(_mode: "verify" | "demo"): string {
  return "Jarvis is greeting you…";
}

export function triggerVoiceDemoOpening(session: {
  sendClientContent: (params: { turns: string; turnComplete: boolean }) => void;
}): void {
  session.sendClientContent({
    turns: VOICE_DEMO_SESSION_START_CUE,
    turnComplete: true,
  });
}

/** Hidden cue — post save_name: speak the help question once, never "how are you". */
export const VOICE_DEMO_POST_NAME_CUE = "[post-name-speak]";

export function buildPostNameSpeakNudge(firstName: string): string {
  const name = firstName.trim() || "there";
  const line = `Good day, ${name}. ${VOICE_DEMO_POST_NAME_LINE}`;
  return (
    `${VOICE_DEMO_POST_NAME_CUE} Name saved. Speak exactly once: "${line}" ` +
    `Never say "how are you". Never repeat the line. Then stop and listen.`
  );
}

/** Hidden cue — WebSocket resumed; do not replay intro or duplicate greetings. */
export const VOICE_DEMO_SESSION_RESUME_CUE = "[session-resume]";

export function buildSessionResumeNudge(opts: {
  nameOnFile?: string;
  nameSavedThisSession: boolean;
}): string {
  if (opts.nameSavedThisSession && opts.nameOnFile) {
    return (
      `${VOICE_DEMO_SESSION_RESUME_CUE} Connection resumed. ${opts.nameOnFile} is on file. ` +
      `Do not repeat greetings or say "how are you". Listen for their question.`
    );
  }
  if (opts.nameOnFile) {
    return (
      `${VOICE_DEMO_SESSION_RESUME_CUE} Connection resumed. You may have heard ${opts.nameOnFile} — ` +
      `call save_name if not saved yet, then one brief help question only. Do not repeat the full introduction.`
    );
  }
  return (
    `${VOICE_DEMO_SESSION_RESUME_CUE} Connection resumed. Listen for the visitor's name — ` +
    `do not repeat your full introduction.`
  );
}
