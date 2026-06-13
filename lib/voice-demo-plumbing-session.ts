/**
 * Plumbing demo stays on the line through booking - no mid-call FAQ wrap-up hangup.
 * After Jarvis's final sign-off, client schedules post-farewell idle hangup + End call blink.
 */

import { isVisitorFarewellAck } from "@/lib/voice-demo-farewell";
import { isPlumbingAssistantFarewell } from "@/lib/voice-demo-plumbing-goodbye";

/** Caller is clearly ending the phone call (not mid-call "thanks for…" continuations). */
export function isPlumbingVisitorEndingCall(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  if (
    /\b(bye|goodbye|good bye|hang up|hangup|end the call|i gotta go|got to go)\b/.test(t) ||
    /\bthat'?s all for now\b/.test(t)
  ) {
    return true;
  }
  if (/\b(thanks|thank you)\s+(for|and|but|what|if|when)\b/.test(t)) return false;
  if (/^(thank you|thanks)( so much)?[.!?,]?\s*$/.test(t)) return true;
  if (/^(okay|ok|alright),?\s*(thank you|thanks)( so much)?[.!?,]?\s*$/.test(t)) {
    return true;
  }
  if (/\b(thank you so much|thanks so much)\b/.test(t) && t.length < 50) return true;
  return false;
}

/** Caller is still booking - resets a prior false "ending" signal mid-scheduling. */
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
    /\b(schedule|scheduling|appointment|book|booking|come out|time slot|time works|works for me)\b/.test(
      t
    ) ||
    /\b(next week|this week|today|tonight)\b/.test(t) ||
    /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/.test(t) ||
    /\b(my address is|address is|email is|@)\b/.test(t) ||
    /\b(toilet|water heater|drain|leak|clog|faucet|pipe|sewer|garbage disposal)\b/.test(t) ||
    /\b(yes|yeah|yep|correct|that'?s right|that'?s correct)\b/.test(t) ||
    /\b\d+\s+[a-z0-9]+(\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|court|ct|way|blvd))?\b/.test(
      t
    )
  );
}

/** Caller confirmed concerns were addressed - proceed to final sign-off. */
export function isPlumbingVisitorConfirmedConcerns(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t || isPlumbingVisitorDeclinedConcerns(text)) return false;
  if (/^(yes|yeah|yep|yup|sure|absolutely|definitely|correct)\b/.test(t)) return true;
  if (/\b(yes|yeah|yep)\b/.test(t) && !/\b(no|not)\b/.test(t)) return true;
  return (
    /\b(you did|you have|that covers|all my concerns|all good|all set|we'?re good)\b/.test(
      t
    ) || /\b(i'?m good)\b/.test(t)
  );
}

/** Caller echoed goodbye/thanks after Jarvis signed off - fast disconnect. */
export function isPlumbingVisitorFarewellAck(text: string): boolean {
  // Re-export shared ack matcher - keep plumbing import path for tests/callers.
  return isVisitorFarewellAck(text);
}

/** Caller still has concerns or wants to continue - do not sign off. */
export function isPlumbingVisitorDeclinedConcerns(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(no|not really|not yet|not exactly|nope)\b/.test(t) ||
    /\b(still have|one more|another question|wait|actually)\b/.test(t) ||
    /\b(didn'?t|haven'?t)\s+(answer|address|cover)\b/.test(t)
  );
}

/** Schedule post-farewell hangup after Jarvis final sign-off (not mid-call). */
export function shouldPlumbingClientHangup(opts: {
  visitorEndingCall: boolean;
  assistantText: string;
  farewellSent?: boolean;
  goodbyeNudgeSent?: boolean;
}): boolean {
  if (opts.farewellSent) return true;
  if (opts.goodbyeNudgeSent && isPlumbingAssistantFarewell(opts.assistantText)) {
    return true;
  }
  return false;
}
