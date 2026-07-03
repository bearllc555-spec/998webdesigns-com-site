import { GoogleGenAI } from "@google/genai";
import { geminiApiKey } from "@/lib/voice-demo-live-token";
import { isValidEmail } from "@/lib/validate-email";
import { hasFullPersonName } from "@/lib/voice-demo-plumbing-contact-confirm";

export type PlumbingTranscriptLine = {
  role: "user" | "assistant";
  text: string;
};

export type ExtractedPlumbingBooking = {
  bookingAttempted: boolean;
  isEmergency?: boolean;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  serviceAddress?: string | null;
  serviceType?: string | null;
  appointmentDate?: string | null;
  timeWindow?: string | null;
};

const EXTRACT_MODEL = "gemini-2.0-flash";

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/** Parse booking fields from call transcript when live tools were skipped. */
export async function extractPlumbingBookingFromTranscript(
  transcript: PlumbingTranscriptLine[],
  lead: { email?: string | null; fullName?: string | null; phone?: string | null }
): Promise<ExtractedPlumbingBooking | null> {
  const apiKey = geminiApiKey();
  if (!apiKey || transcript.length < 3) return null;

  const formatted = transcript
    .slice(-48)
    .map((line) => `${line.role === "user" ? "Caller" : "Jarvis"}: ${line.text}`)
    .join("\n");

  const prompt = `Extract plumbing appointment booking data from this voice receptionist call.

Demo lead on file: email=${lead.email?.trim() || "unknown"}, name=${lead.fullName?.trim() || "unknown"}, phone=${lead.phone?.trim() || "unknown"}

Transcript:
${formatted}

Return JSON only:
{
  "bookingAttempted": boolean,
  "isEmergency": boolean,
  "fullName": string | null,
  "email": string | null,
  "phone": string | null,
  "serviceAddress": string | null,
  "serviceType": string | null,
  "appointmentDate": string | null,
  "timeWindow": string | null
}

Rules:
- bookingAttempted=true ONLY when caller and Jarvis clearly confirmed a scheduled appointment (not quote-only or callback).
- Use explicitly stated and confirmed values; prefer lead on file when caller confirmed without changing.
- If intake incomplete or ambiguous, bookingAttempted=false.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: EXTRACT_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });
    const text = res.text?.trim();
    if (!text) return null;
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return {
      bookingAttempted: parsed.bookingAttempted === true,
      isEmergency: parsed.isEmergency === true,
      fullName: trimOrNull(parsed.fullName),
      email: trimOrNull(parsed.email)?.toLowerCase() ?? null,
      phone: trimOrNull(parsed.phone),
      serviceAddress: trimOrNull(parsed.serviceAddress),
      serviceType: trimOrNull(parsed.serviceType),
      appointmentDate: trimOrNull(parsed.appointmentDate),
      timeWindow: trimOrNull(parsed.timeWindow),
    };
  } catch (err) {
    console.warn("[voice-demo-plumbing-transcript-book] extract failed", err);
    return null;
  }
}

export function extractedPlumbingBookingIsActionable(
  extracted: ExtractedPlumbingBooking,
  lead: { email?: string | null; fullName?: string | null; phone?: string | null }
): boolean {
  if (!extracted.bookingAttempted) return false;
  const email = extracted.email?.trim() || lead.email?.trim() || "";
  const name = extracted.fullName?.trim() || lead.fullName?.trim() || "";
  const phone = extracted.phone?.trim() || lead.phone?.trim() || "";
  if (!hasFullPersonName(name)) return false;
  if (!isValidEmail(email)) return false;
  if (!phone.replace(/\D/g, "").match(/^\d{10,}$/)) return false;
  if (!extracted.serviceAddress?.trim()) return false;
  if (!extracted.serviceType?.trim()) return false;
  if (!extracted.isEmergency && (!extracted.appointmentDate?.trim() || !extracted.timeWindow?.trim())) {
    return false;
  }
  return true;
}
