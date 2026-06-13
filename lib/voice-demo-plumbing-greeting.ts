import {
  PLUMBING_DEMO_OPENING_LINE,
  PLUMBING_DEMO_SESSION_START_CUE,
} from "@/lib/voice-demo-plumbing-constants";
import { PLUMBING_POST_OPENING_LISTEN } from "@/lib/voice-demo-plumbing-opening";

export const PLUMBING_DEMO_MANDATORY_OPENING = `MANDATORY OPENING (your very first spoken turn - never skip, never wait for the caller to speak first):
Say naturally: "${PLUMBING_DEMO_OPENING_LINE}"
When you receive the hidden client cue "${PLUMBING_DEMO_SESSION_START_CUE}", speak this opening right away. Do not read the cue aloud.

${PLUMBING_POST_OPENING_LISTEN}`;

export function plumbingDemoOpeningStatus(): string {
  return "Jarvis is answering…";
}

export function triggerPlumbingDemoOpening(session: {
  sendClientContent: (params: { turns: string; turnComplete: boolean }) => void;
}): void {
  session.sendClientContent({
    turns: PLUMBING_DEMO_SESSION_START_CUE,
    turnComplete: true,
  });
}
