/**
 * Plumbing demo stays on the line like a real receptionist — no marketing FAQ wrap-up / auto-hangup.
 * The caller ends the call via the widget; client code must not schedule farewell disconnects.
 */

/** Caller is clearly ending the phone call (not casual acks or "no other issues"). */
export function isPlumbingVisitorEndingCall(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(bye|goodbye|good bye|hang up|hangup|end the call|i gotta go|got to go)\b/.test(t) ||
    /\bthat'?s all for now\b/.test(t)
  );
}

/** Caller is still booking — resets a prior false "ending" signal mid-scheduling. */
export function isPlumbingBookingContinuation(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|blvd)\b/.test(
      t
    ) ||
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|morning|afternoon|evening)\b/.test(
      t
    ) ||
    /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/.test(t) ||
    /\b(my address is|address is|email is|@)\b/.test(t) ||
    /\b(toilet|water heater|drain|leak|clog|faucet|pipe|sewer|garbage disposal)\b/.test(t) ||
    /\b(yes|yeah|yep|correct|that'?s right|that'?s correct)\b/.test(t) ||
    /\b\d+\s+[a-z0-9]+(\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|blvd))?\b/.test(
      t
    )
  );
}

/** Plumbing demo: never auto-hangup — receptionist stays until caller taps disconnect. */
export function shouldPlumbingClientHangup(_opts: {
  visitorEndingCall: boolean;
  assistantText: string;
}): boolean {
  return false;
}
