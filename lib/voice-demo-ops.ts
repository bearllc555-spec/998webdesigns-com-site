import { getVoiceDemoLead } from "@/lib/voice-demo-db";
import { supabaseAdmin } from "@/lib/supabase";

export type VoiceDemoOpsSeverity = "info" | "warn" | "error";

export type VoiceDemoOpsKind =
  | "end_conversation_blocked"
  | "farewell_hold"
  | "goodbye_nudge"
  | "wrap_up_scheduled"
  | "session_anomaly"
  | "session_resumption"
  | "end_conversation_early_blocked"
  | "client_hangup_scheduled"
  | "model_end_conversation_blocked"
  | "plumbing_booking_finalize"
  | "plumbing_tool_call";

export type VoiceDemoOpsEvent = {
  at: string;
  kind: VoiceDemoOpsKind;
  severity: VoiceDemoOpsSeverity;
  message: string;
  meta?: Record<string, unknown>;
};

const OPS_LOG_MAX = 80;

export function buildVoiceDemoOpsEvent(
  kind: VoiceDemoOpsKind,
  message: string,
  meta?: Record<string, unknown>,
  severity?: VoiceDemoOpsSeverity
): VoiceDemoOpsEvent {
  const resolvedSeverity =
    severity ??
    (kind === "end_conversation_blocked" ||
    kind === "end_conversation_early_blocked" ||
    kind === "model_end_conversation_blocked" ||
    kind === "client_hangup_scheduled" ||
    kind === "farewell_hold"
      ? "warn"
      : kind === "session_anomaly" || kind === "session_resumption"
        ? "warn"
        : "info");

  return {
    at: new Date().toISOString(),
    kind,
    severity: resolvedSeverity,
    message,
    meta: meta && Object.keys(meta).length > 0 ? meta : undefined,
  };
}

export function parseVoiceDemoOpsLog(raw: unknown): VoiceDemoOpsEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: VoiceDemoOpsEvent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (typeof row.kind !== "string" || typeof row.message !== "string") continue;
    out.push({
      at: typeof row.at === "string" ? row.at : new Date().toISOString(),
      kind: row.kind as VoiceDemoOpsKind,
      severity:
        row.severity === "warn" || row.severity === "error" || row.severity === "info"
          ? row.severity
          : "info",
      message: row.message,
      meta:
        row.meta && typeof row.meta === "object"
          ? (row.meta as Record<string, unknown>)
          : undefined,
    });
  }
  return out;
}

export function summarizeVoiceDemoOpsWarnings(opsLog: VoiceDemoOpsEvent[]): string | null {
  const warnings = opsLog.filter((e) => e.severity === "warn" || e.severity === "error");
  if (!warnings.length) return null;
  return warnings
    .slice(-6)
    .map((e) => `${e.kind}: ${e.message}`)
    .join("\n");
}

export function countVoiceDemoOpsWarnings(opsLog: VoiceDemoOpsEvent[]): number {
  return opsLog.filter((e) => e.severity === "warn" || e.severity === "error").length;
}

export async function appendVoiceDemoOpsEvent(
  leadId: string,
  event: VoiceDemoOpsEvent
): Promise<boolean> {
  const row = await getVoiceDemoLead(leadId);
  if (!row) return false;

  const existing = parseVoiceDemoOpsLog(row.ops_log);
  const next = [...existing, event].slice(-OPS_LOG_MAX);

  const supaPatch: Record<string, unknown> = {
    ops_log: next,
  };

  const warnCount = countVoiceDemoOpsWarnings(next);
  if (warnCount > 0 && !row.inbox_flag) {
    supaPatch.inbox_flag = "watch";
  }

  const supa = supabaseAdmin();
  if (!supa) return false;

  const { error } = await supa
    .from("voice_demo_leads")
    .update({ ...supaPatch, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  return !error;
}

/** Coerce inbound ops payload from the live client. */
export function coerceVoiceDemoOpsInput(body: Record<string, unknown>): VoiceDemoOpsEvent | null {
  const kind = typeof body.kind === "string" ? body.kind : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!kind || !message) return null;

  const allowed: VoiceDemoOpsKind[] = [
    "end_conversation_blocked",
    "farewell_hold",
    "goodbye_nudge",
    "wrap_up_scheduled",
    "session_anomaly",
    "session_resumption",
    "end_conversation_early_blocked",
    "client_hangup_scheduled",
    "model_end_conversation_blocked",
    "plumbing_booking_finalize",
    "plumbing_tool_call",
  ];
  if (!allowed.includes(kind as VoiceDemoOpsKind)) return null;

  const severity =
    body.severity === "warn" || body.severity === "error" || body.severity === "info"
      ? body.severity
      : undefined;

  const meta =
    body.meta && typeof body.meta === "object" && !Array.isArray(body.meta)
      ? (body.meta as Record<string, unknown>)
      : undefined;

  return buildVoiceDemoOpsEvent(kind as VoiceDemoOpsKind, message, meta, severity);
}
