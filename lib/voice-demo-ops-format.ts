import type { VoiceDemoOpsEvent } from "@/lib/voice-demo-ops";

function formatOpsTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function formatMeta(meta: Record<string, unknown> | undefined): string {
  if (!meta || Object.keys(meta).length === 0) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined || value === null) continue;
    parts.push(`${key}=${typeof value === "object" ? JSON.stringify(value) : String(value)}`);
  }
  return parts.length ? ` (${parts.join(", ")})` : "";
}

/** Plain-text timeline for CLI, CRM copy, or chat handoff. */
export function formatVoiceDemoOpsTimeline(
  events: VoiceDemoOpsEvent[],
  opts?: { maxLines?: number }
): string {
  const max = opts?.maxLines ?? events.length;
  const slice = events.slice(-max);
  if (!slice.length) return "(no ops events recorded)";
  return slice
    .map(
      (e) =>
        `${formatOpsTime(e.at)} [${e.severity}] ${e.kind}: ${e.message}${formatMeta(e.meta)}`
    )
    .join("\n");
}
