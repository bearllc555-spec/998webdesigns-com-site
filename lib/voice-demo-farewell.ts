/** Visitor said they are finished — allows end_conversation after farewell. */
export function isUserExplicitlyDone(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(that'?s all|nothing else|no more questions|we'?re done|i'?m done|all set|that'?s it)\b/.test(
      t
    ) || /\b(i'?m good)\b/.test(t)
  );
}

/** Block model end_conversation until farewell was spoken (give-up nudges require goodbye first). */
export function canModelEndConversation(opts: {
  farewellSent: boolean;
  goodbyeNudgeSent: boolean;
  visitorExplicitlyDone: boolean;
  assistantText: string;
}): boolean {
  if (opts.farewellSent) return true;
  if (isAssistantFarewell(opts.assistantText)) return true;
  if (opts.visitorExplicitlyDone && isAssistantFarewell(opts.assistantText)) return true;
  return false;
}

/** Visitor echoed goodbye after Jarvis already closed — end the call, do not reply again. */
export function isUserFarewellEcho(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(bye|goodbye|good bye|see you|cheers)\b/.test(t) ||
    /\b(that'?s all|i'?m good|all set|have a (good|great|nice))\b/.test(t)
  );
}

/** Hidden cue — farewell already spoken; model must stay silent. */
export const VOICE_DEMO_FAREWELL_HOLD_CUE = "[farewell-hold]";

export function buildFarewellHoldNudge(): string {
  return (
    `${VOICE_DEMO_FAREWELL_HOLD_CUE} You already said goodbye. Stay completely silent — ` +
    `do not say "thank you for contacting" again. Do not call end_conversation again. The call is ending.`
  );
}

const FAREWELL_TAIL_CHARS = 240;

/** Sign-offs are spoken at the end of a turn — ignore earlier small-talk in the same turn. */
export function assistantFarewellTail(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length <= FAREWELL_TAIL_CHARS) return trimmed;
  return trimmed.slice(-FAREWELL_TAIL_CHARS);
}

/** Normal demo speech that must never trigger client hangup. */
export function isAssistantOnboardingOrHelpSpeech(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /how may i help you today/i.test(t) ||
    /who do i have the pleasure of speaking with/i.test(t) ||
    /i'?m jarvis/i.test(t) ||
    /\bgood day,\s+\w+/i.test(t)
  );
}

/** Jarvis delivered a final sign-off (paired with end_conversation tool when possible). */
export function isAssistantFarewellPhrase(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (isAssistantOnboardingOrHelpSpeech(t)) return false;

  if (/\bthank you for contacting\b/.test(t)) return true;
  if (/\b(goodbye|farewell|until next time)\b/.test(t)) return true;
  if (/\bpleasant (day|evening)\b/.test(t)) return true;
  if (/\b(lovely speaking|pleasure assisting)\b/.test(t)) return true;
  if (/\bgood evening\b/.test(t) && /\b(goodbye|contacting)\b/.test(t)) return true;

  // "take care" as a sign-off — not "take care of your website / hosting"
  if (/\btake care\b/.test(t) && !/\btake care of\b/.test(t)) return true;

  return false;
}

export function isAssistantFarewell(text: string): boolean {
  return isAssistantFarewellPhrase(assistantFarewellTail(text));
}
