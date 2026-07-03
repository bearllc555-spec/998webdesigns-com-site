export type PlumbingEmergencyTranscriptLine = {
  role: "user" | "assistant";
  text: string;
};

/** System-prompt block — triage, shut-off, dispatch consent before isEmergency book. */
export const PLUMBING_EMERGENCY_DISPATCH_BLOCK = `EMERGENCY DISPATCH (critical — different from standard booking):
- Use ONLY for active damage: flooding, burst pipe, sewage backup, water actively flowing where it should not.
- "Urgent" or "ASAP" or "today" without active damage → standard booking with date/time + $50 coupon — NOT emergency dispatch.
- Flow (do not skip steps):
  1. Triage: "Is water actively flowing or flooding right now?" (If no → still priority, but confirm they want emergency dispatch vs scheduled visit.)
  2. Safety first: guide main water shut-off if water is still flowing — before asking for address or booking.
  3. Dispatch consent (required): explain "$150 dispatch fee, tech within two hours, fee applies toward repair" and ask: "Do you want me to send someone out now?" Wait for a clear yes.
  4. Collect name, address, phone, email if not on file — same read-backs as standard intake.
  5. Only after caller says yes to dispatch: call book_plumbing_appointment with isEmergency true AND emergencyDispatchConfirmed true.
- Never call book_plumbing_appointment with isEmergency true without emergencyDispatchConfirmed true.
- Emergency bookings do NOT include the $50 coupon — say dispatch confirmation email and text are on the way (no coupon mention).`;

export const PLUMBING_EMERGENCY_DISPATCH_CONSENT_PROMPT =
  'Ask: "I can dispatch a tech within two hours — there\'s a $150 dispatch fee that applies toward your repair. Do you want me to send someone out now?" Wait for yes, then book with isEmergency true and emergencyDispatchConfirmed true.';

const DISPATCH_OFFER_RE =
  /dispatch|within (two|2) hours|150 dispatch|\$150|send someone out|emergency tech|getting (an )?emergency|get (that|this) rolling|tech out to you/i;

const CALLER_DISPATCH_CONSENT_RE =
  /\b(yes|yeah|yep|please|go ahead|do it|send someone|send them|get someone out|get that rolling|get them out|sounds good|that works|that'?s fine|absolutely|sure|correct|right)\b/i;

/**
 * True only when Jarvis offered emergency dispatch and the caller clearly agreed.
 * Keyword "emergency" alone (FAQ, triage, or Jarvis disclaimer) is not enough.
 */
export function transcriptEmergencyDispatchConfirmed(
  transcript: PlumbingEmergencyTranscriptLine[]
): boolean {
  for (let i = 0; i < transcript.length; i++) {
    const line = transcript[i]!;
    if (line.role !== "assistant" || !DISPATCH_OFFER_RE.test(line.text)) continue;

    for (let j = i + 1; j < transcript.length; j++) {
      const follow = transcript[j]!;
      if (follow.role === "assistant") break;
      if (follow.role === "user" && CALLER_DISPATCH_CONSENT_RE.test(follow.text)) {
        return true;
      }
    }
  }
  return false;
}
