import type { VoiceDemoOpsEvent } from "@/lib/voice-demo-ops";

export type VoiceDemoOpsDiagnosis = {
  summary: string;
  findings: string[];
  reconnectCount: number;
  goAwayCount: number;
  toolDeferCount: number;
  exhaustedPause: boolean;
};

function countMatching(events: VoiceDemoOpsEvent[], pattern: RegExp): number {
  return events.filter((e) => pattern.test(e.message)).length;
}

/** Rule-based read on ops_log — surfaces likely root cause without manual retelling. */
export function diagnoseVoiceDemoOpsSession(
  events: VoiceDemoOpsEvent[]
): VoiceDemoOpsDiagnosis {
  const reconnectCount = countMatching(
    events,
    /reconnect|goAway|WebSocket closed|Connection refreshing/i
  );
  const goAwayCount = countMatching(events, /goAway/i);
  const toolDeferCount = countMatching(events, /Deferred tool response/i);
  const exhaustedPause = events.some((e) =>
    /reconnect paused|reconnect_exhausted/i.test(e.message)
  );

  const findings: string[] = [];

  if (goAwayCount > 0) {
    findings.push(
      `Gemini sent goAway ${goAwayCount} time(s) — server is ending the live session (normal limit on preview model).`
    );
  }
  if (reconnectCount >= 2) {
    findings.push(
      `${reconnectCount} connection refresh events — client auto-reconnected before pause or recovery.`
    );
  }
  if (toolDeferCount > 0) {
    findings.push(
      `${toolDeferCount} tool response(s) deferred mid-reconnect — booking/save may have completed after the drop.`
    );
  }
  if (exhaustedPause) {
    findings.push(
      "Auto-reconnect gave up — caller must tap Start voice (circuit breaker fired)."
    );
  }
  if (events.some((e) => /Deferred live reconnect until tool completes/i.test(e.message))) {
    findings.push(
      "Reconnect waited for an in-flight tool (save/book) — mic was gated to avoid 1008 policy violation."
    );
  }
  if (events.some((e) => /Deferred live reconnect until session resumable/i.test(e.message))) {
    findings.push(
      "Reconnect deferred until Gemini marked session resumable — avoids context loss mid-tool."
    );
  }
  if (events.some((e) => /Session not resumable/i.test(e.message))) {
    findings.push("Gemini reported resumable=false during tool or generation.");
  }
  if (events.some((e) => /Flushed deferred tool responses/i.test(e.message))) {
    findings.push("Deferred tool responses were flushed after reconnect — check CRM job row.");
  }
  if (events.some((e) => /Plumbing idle silence/i.test(e.message))) {
    findings.push("Call ended after 4s quiet following booking or goodbye — expected plumbing wind-down.");
  }
  if (events.some((e) => /Caller tapped End call/i.test(e.message))) {
    findings.push("Caller ended the call with the End call button.");
  }
  if (events.some((e) => /token_fetch_failed|connect_failed/i.test(e.message))) {
    findings.push("Live token or connect failed — check GEMINI_API_KEY / network, not caller behavior.");
  }

  if (!findings.length) {
    findings.push("No reconnect anomalies logged — if the call felt broken, ops may not have persisted yet.");
  }

  let summary: string;
  if (exhaustedPause) {
    summary = "Session hit reconnect limit and paused.";
  } else if (goAwayCount > 0 || reconnectCount >= 2) {
    summary = "Unstable Gemini Live connection (goAway / reconnect loop).";
  } else if (toolDeferCount > 0) {
    summary = "Disconnect during tool execution.";
  } else {
    summary = "No major reconnect pattern detected.";
  }

  return {
    summary,
    findings,
    reconnectCount,
    goAwayCount,
    toolDeferCount,
    exhaustedPause,
  };
}
