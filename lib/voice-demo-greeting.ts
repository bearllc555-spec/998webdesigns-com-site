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
