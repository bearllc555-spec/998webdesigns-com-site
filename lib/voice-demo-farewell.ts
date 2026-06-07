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

/** Block model end_conversation until farewell was spoken or a give-up nudge fired. */
export function canModelEndConversation(opts: {
  farewellSent: boolean;
  goodbyeNudgeSent: boolean;
  visitorExplicitlyDone: boolean;
  assistantText: string;
}): boolean {
  if (opts.farewellSent || opts.goodbyeNudgeSent) return true;
  if (opts.visitorExplicitlyDone && isAssistantFarewell(opts.assistantText)) return true;
  if (isAssistantFarewell(opts.assistantText)) return true;
  return false;
}

/** Visitor echoed goodbye after Jarvis already closed — end the call, do not reply again. */
export function isUserFarewellEcho(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(bye|goodbye|good bye|see you|take care|cheers)\b/.test(t) ||
    /\b(thanks|thank you)\b/.test(t) ||
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

/** Jarvis delivered a final sign-off (paired with end_conversation tool when possible). */
export function isAssistantFarewell(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(goodbye|good day|good evening|take care|pleasant (day|evening)|until next time|farewell)\b/.test(
      t
    ) ||
    /\b(lovely speaking|pleasure assisting)\b/.test(t) ||
    /\bthank you for contacting\b/.test(t)
  );
}
