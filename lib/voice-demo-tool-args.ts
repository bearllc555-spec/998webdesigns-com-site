/** Coerce Gemini tool args that may arrive as string, number, or other. */
export function coerceToolString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(Math.trunc(value));
  }
  return "";
}

/** Accept true, "true", "yes", 1 — models often send loose truthy values. */
export function coerceToolBoolean(value: unknown): boolean {
  if (value === true) return true;
  if (value === false || value == null) return false;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    return s === "true" || s === "yes" || s === "1";
  }
  if (typeof value === "number") return value === 1;
  return false;
}
