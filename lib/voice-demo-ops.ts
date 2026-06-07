import { isAssistantZipReadBackPrompt } from "@/lib/voice-demo-weather-flow";
import { getVoiceDemoLead } from "@/lib/voice-demo-db";
import { supabaseAdmin } from "@/lib/supabase";

export type VoiceDemoOpsSeverity = "info" | "warn" | "error";

export type VoiceDemoOpsKind =
  | "zip_confirm_staged"
  | "zip_city_drift"
  | "zip_city_self_correction"
  | "zip_city_correction_sent"
  | "end_conversation_blocked"
  | "farewell_hold"
  | "goodbye_nudge"
  | "forecast_goodbye_scheduled"
  | "wrap_up_scheduled"
  | "tool_bundled_weather"
  | "tool_blocked_confirm_zip"
  | "tool_blocked_lookup_weather"
  | "tool_blocked_promo_weather"
  | "weather_lookup_client"
  | "weather_lookup_failed"
  | "weather_lookup_success"
  | "session_anomaly"
  | "session_resumption"
  | "end_conversation_early_blocked";

export type VoiceDemoOpsEvent = {
  at: string;
  kind: VoiceDemoOpsKind;
  severity: VoiceDemoOpsSeverity;
  message: string;
  meta?: Record<string, unknown>;
};

export type StagedZipReadback = {
  zip: string;
  city: string;
  stateName?: string;
  spokenConfirm: string;
};

const OPS_LOG_MAX = 80;

const KNOWN_ZIP_CITY_HALLUCINATIONS: Record<string, string[]> = {
  "07424": ["ramsey", "fair lawn", "wayne", "totowa", "paterson"],
  "07512": ["paterson", "patterson", "little falls", "wayne", "clifton"],
};

/** City Jarvis named in a ZIP read-back ("for City, State"). */
export function extractZipReadbackCity(assistantText: string): string | null {
  const match = assistantText.match(/for\s+([^,]+),\s*([^.?\n]+)/i);
  return match?.[1]?.trim() ?? null;
}

export function citiesMatchForZipReadback(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function knownHallucinatedCities(zip: string): string[] {
  const digits = zip.replace(/\D/g, "").slice(0, 5);
  return KNOWN_ZIP_CITY_HALLUCINATIONS[digits] ?? [];
}

/** True when assistant names a wrong city before or instead of the staged city. */
export function detectZipCityDrift(
  assistantText: string,
  expected: StagedZipReadback
): { drift: boolean; heardCity: string | null; selfCorrected: boolean } {
  const lower = assistantText.trim().toLowerCase();
  if (!lower) {
    return { drift: false, heardCity: null, selfCorrected: false };
  }

  const expectedCity = expected.city.trim().toLowerCase();
  const heard = extractZipReadbackCity(assistantText);
  const hallucinations = knownHallucinatedCities(expected.zip);
  const mentionedWrong = hallucinations.some((w) => lower.includes(w));
  const mentionedExpected = lower.includes(expectedCity);

  if (mentionedWrong && mentionedExpected) {
    return {
      drift: true,
      heardCity: heard ?? hallucinations.find((w) => lower.includes(w)) ?? null,
      selfCorrected: true,
    };
  }

  if (!isAssistantZipReadBackPrompt(assistantText) && !mentionedWrong) {
    return { drift: false, heardCity: heard, selfCorrected: false };
  }

  if (heard && !citiesMatchForZipReadback(heard, expected.city)) {
    return { drift: true, heardCity: heard, selfCorrected: false };
  }

  if (mentionedWrong && !mentionedExpected) {
    return {
      drift: true,
      heardCity: hallucinations.find((w) => lower.includes(w)) ?? heard,
      selfCorrected: false,
    };
  }

  return { drift: false, heardCity: heard, selfCorrected: false };
}

/** Interrupt streaming audio when Jarvis starts the wrong city mid read-back. */
export function shouldInterruptZipCityDrift(
  partialText: string,
  expected: StagedZipReadback
): boolean {
  const trimmed = partialText.trim();
  if (!trimmed || trimmed.length < 12) return false;
  const { drift, selfCorrected } = detectZipCityDrift(trimmed, expected);
  return drift && !selfCorrected;
}

export function buildVoiceDemoOpsEvent(
  kind: VoiceDemoOpsKind,
  message: string,
  meta?: Record<string, unknown>,
  severity?: VoiceDemoOpsSeverity
): VoiceDemoOpsEvent {
  const resolvedSeverity =
    severity ??
    (kind === "zip_city_drift" ||
    kind === "end_conversation_blocked" ||
    kind === "end_conversation_early_blocked" ||
    kind === "tool_blocked_confirm_zip" ||
    kind === "tool_blocked_lookup_weather" ||
    kind === "tool_blocked_promo_weather" ||
    kind === "farewell_hold"
      ? "warn"
      : kind === "zip_city_self_correction" ||
          kind === "session_anomaly" ||
          kind === "session_resumption"
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
    "zip_confirm_staged",
    "zip_city_drift",
    "zip_city_self_correction",
    "zip_city_correction_sent",
    "end_conversation_blocked",
    "farewell_hold",
    "goodbye_nudge",
    "forecast_goodbye_scheduled",
    "wrap_up_scheduled",
    "tool_bundled_weather",
    "tool_blocked_confirm_zip",
    "tool_blocked_lookup_weather",
    "tool_blocked_promo_weather",
    "weather_lookup_client",
    "weather_lookup_failed",
    "weather_lookup_success",
    "session_anomaly",
    "session_resumption",
    "end_conversation_early_blocked",
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
