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
