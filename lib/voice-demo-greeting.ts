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

/** True when Jarvis already spoke the post-name help question. */
export function isAssistantPostNameGreeting(text: string): boolean {
  return /how may i help you today/i.test(text.trim().toLowerCase());
}

/** Good-day opener without the help line — greeting was cut off mid-stream. */
export function isAssistantPartialPostNameGreeting(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t || isAssistantPostNameGreeting(text)) return false;
  return /\bgood day,\s+\w+/i.test(t);
}

export function buildSaveNameToolMessage(visitorName: string, alreadyGreeted: boolean): string {
  const first = visitorName.split(/\s+/)[0] ?? visitorName;
  if (alreadyGreeted) {
    return (
      `Name saved (${visitorName}). You already spoke "${VOICE_DEMO_POST_NAME_LINE}" — ` +
      `stay completely silent and listen. Do not repeat the greeting.`
    );
  }
  return (
    `Name saved (${visitorName}). Speak exactly once: "Good day, ${first}. ${VOICE_DEMO_POST_NAME_LINE}" ` +
    `Then stop and listen. Never repeat that line. Do not ask for their phone in this turn.`
  );
}

/** Hidden cue — name saved but post-name greeting not spoken yet; speak now. */
export const VOICE_DEMO_POST_NAME_PENDING_CUE = "[post-name-pending]";

/** Wait after save_name before nudging — model often idles until visitor speaks. */
export const POST_NAME_GREETING_NUDGE_MS = 900;

export function buildPostNameGreetingNudge(visitorName: string): string {
  const first = visitorName.split(/\s+/)[0] ?? visitorName;
  return (
    `${VOICE_DEMO_POST_NAME_PENDING_CUE} Name is saved. Speak NOW exactly once: ` +
    `"Good day, ${first}. ${VOICE_DEMO_POST_NAME_LINE}" ` +
    `Then stop and listen. Do NOT say "how are you". Do NOT ask for phone. Do NOT call save_name again.`
  );
}

/** Hidden cue — post-name line already spoken; model must stay silent. */
export const VOICE_DEMO_POST_NAME_HOLD_CUE = "[post-name-hold]";

export function buildPostNameHoldNudge(): string {
  return (
    `${VOICE_DEMO_POST_NAME_HOLD_CUE} You already said "${VOICE_DEMO_POST_NAME_LINE}" — ` +
    `stay completely silent and listen. Do not repeat the greeting.`
  );
}

/** Hidden cue — WebSocket resumed; do not replay intro or duplicate greetings. */
export const VOICE_DEMO_SESSION_RESUME_CUE = "[session-resume]";

export function buildSessionResumeNudge(opts: {
  nameOnFile?: string;
  nameSavedThisSession: boolean;
  weatherForecastInProgress?: boolean;
}): string {
  if (opts.weatherForecastInProgress) {
    return (
      `${VOICE_DEMO_SESSION_RESUME_CUE} Connection resumed during the weather demo. ` +
      `Finish speaking the forecast if it was cut off — do NOT ask for their ZIP again. ` +
      `Then one warm sign-off and end_conversation.`
    );
  }
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
