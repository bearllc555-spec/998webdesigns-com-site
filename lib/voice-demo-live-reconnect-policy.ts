/** Pure reconnect / realtime-input policy (community + Google Live API guidance). */

export function canSendVoiceDemoRealtimeInput(toolInFlight: number): boolean {
  return toolInFlight <= 0;
}

export function shouldDeferLiveReconnect(opts: {
  reason: string;
  toolInFlight: number;
  sessionResumable: boolean;
}): { defer: boolean; cause: "tool" | "not_resumable" | null } {
  if (opts.toolInFlight > 0) {
    return { defer: true, cause: "tool" };
  }
  if (opts.reason.startsWith("goAway") && !opts.sessionResumable) {
    return { defer: true, cause: "not_resumable" };
  }
  return { defer: false, cause: null };
}

/** Only hard socket death gets the short reconnect delay; goAway uses normal backoff. */
export function isUrgentLiveReconnectReason(reason: string): boolean {
  return reason === "websocket_close";
}
