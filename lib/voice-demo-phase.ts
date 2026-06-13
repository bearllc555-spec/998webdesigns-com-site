import {
  isAssistantExplicitGoodbye,
  isAssistantFarewell,
  isSubstantiveServiceSpeech,
} from "@/lib/voice-demo-farewell";

/** Single session lane - client owns transitions and hangup. */
export type VoiceDemoSessionPhase =
  | "onboarding"
  | "helping"
  | "wrap_up_pending"
  | "final_goodbye"
  | "ended";

export type VoiceDemoHangupReason =
  | "client_final_goodbye"
  | "goodbye_nudge_complete"
  | "model_end_conversation_blocked"
  | "farewell_tail_blocked"
  | "visitor_farewell_echo"
  | "websocket_close"
  | "mic_mute_timeout"
  | "user_disconnect"
  | "plumbing_idle_silence"
  | "plumbing_post_farewell_idle"
  | "plumbing_post_farewell_ack"
  | "post_farewell_idle"
  | "post_farewell_ack"
  | "reconnect_exhausted";

export type VoiceDemoPhaseInput = {
  postNameLineSpoken: boolean;
  jarvisFarewellSent: boolean;
  goodbyeNudgeSent: boolean;
  wrapUpTimerActive: boolean;
  farewellDisconnecting: boolean;
  visitorExplicitlyDone: boolean;
};

export function deriveVoiceDemoSessionPhase(input: VoiceDemoPhaseInput): VoiceDemoSessionPhase {
  if (input.farewellDisconnecting) return "ended";
  if (!input.postNameLineSpoken) return "onboarding";
  if (input.jarvisFarewellSent || input.goodbyeNudgeSent) return "final_goodbye";
  if (input.visitorExplicitlyDone) return "final_goodbye";
  if (input.wrapUpTimerActive) return "wrap_up_pending";
  return "helping";
}

/**
 * Client may schedule disconnect - never on stray FAQ sign-off mid-call.
 * Model does not own hangup in demo mode.
 */
export function canClientScheduleHangup(opts: {
  phase: VoiceDemoSessionPhase;
  farewellSent: boolean;
  goodbyeNudgeSent: boolean;
  visitorExplicitlyDone: boolean;
  assistantText: string;
  awaitingPromoConsent?: boolean;
}): boolean {
  const text = opts.assistantText.trim();
  if (!text || opts.phase === "ended" || opts.phase === "onboarding") return false;
  if (opts.awaitingPromoConsent) return false;
  if (opts.farewellSent) return true;

  if (opts.goodbyeNudgeSent) {
    if (
      text.length >= 100 ||
      /\b(design fee|hosting|portfolio|pricing|timeline|pages|mobile-friendly)\b/i.test(text)
    ) {
      return false;
    }
    return isAssistantExplicitGoodbye(text);
  }

  if (opts.phase === "final_goodbye" && opts.visitorExplicitlyDone) {
    if (isSubstantiveServiceSpeech(text) && !isAssistantExplicitGoodbye(text)) return false;
    return isAssistantFarewell(text);
  }

  return false;
}

/** Demo: model must never end the call - client disconnects after goodbye playback. */
export function canModelEndConversation(_opts: {
  farewellSent: boolean;
  goodbyeNudgeSent: boolean;
  visitorExplicitlyDone: boolean;
  assistantText: string;
  demoMode?: boolean;
}): boolean {
  return false;
}

export const TOOL_END_CONVERSATION_CLIENT_OWNED =
  "Do not call end_conversation - the system ends the call automatically after your final goodbye. " +
  "Say your sign-off once, then stay silent.";
