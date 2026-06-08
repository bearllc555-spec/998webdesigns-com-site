/**
 * Plumbing demo stays on the line like a real receptionist — no marketing FAQ wrap-up / auto-hangup.
 */

/** Caller is clearly ending the phone call (not casual "I'm good" / "thanks"). */
export function isPlumbingVisitorEndingCall(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(bye|goodbye|good bye|hang up|hangup|end the call|i gotta go|got to go)\b/.test(t) ||
    /\b(that'?s all for now|nothing else|no more questions|we'?re done|i'?m done with)\b/.test(t)
  );
}

/** Plumbing: only end after Jarvis spoke a clear sign-off, not mid-FAQ. */
export function shouldPlumbingClientHangup(opts: {
  visitorEndingCall: boolean;
  assistantText: string;
}): boolean {
  if (!opts.visitorEndingCall) return false;
  const tail = opts.assistantText.trim().slice(-200).toLowerCase();
  if (!tail) return false;
  return (
    /\b(bye|goodbye|take care|talk soon|we'?ll see you|have a (good|great|nice))\b/.test(tail) ||
    /\b(thanks for calling|thank you for calling)\b/.test(tail)
  );
}
