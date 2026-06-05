/** Max JSON body size for public lead/contact API routes (bytes). */
export const MAX_JSON_BODY_BYTES = 64 * 1024;

export async function readJsonBody(
  req: Request,
  maxBytes = MAX_JSON_BODY_BYTES
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; error: string }> {
  const rawLength = req.headers.get("content-length");
  if (rawLength) {
    const len = Number.parseInt(rawLength, 10);
    if (Number.isFinite(len) && len > maxBytes) {
      return { ok: false, error: "Request body too large" };
    }
  }

  const text = await req.text();
  if (text.length > maxBytes) {
    return { ok: false, error: "Request body too large" };
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "Invalid JSON" };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
}
