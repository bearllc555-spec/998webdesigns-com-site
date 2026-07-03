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

const EXTRACT_MODEL = "gemini-2.5-flash";

const BOOKING_CONFIRMED_RE =
  /confirmation email|confirmation text|you'?re (all )?set|appointment is (confirmed|booked|scheduled)|scheduled for|see you (then|on|thursday|friday|monday|tuesday|wednesday|saturday|sunday)|coupon.+email|on the way to your (inbox|phone|texts)/i;

const SERVICE_TYPE_RULES: Array<[RegExp, string]> = [
  [/\bwater heater\b/i, "Water heater service"],
  [/\bdrain|clog|clogged\b/i, "Drain cleaning"],
  [/\bleak|leaking\b/i, "Leak detection and repair"],
  [/\btoilet\b/i, "Toilet repair"],
  [/\bsewer\b/i, "Sewer line service"],
  [/\bflood|emergency|burst pipe\b/i, "Emergency plumbing"],
  [/\bestimate|quote\b/i, "Plumbing estimate"],
  [/\bfaucet|sink\b/i, "Faucet or sink repair"],
  [/\bgarbage disposal\b/i, "Garbage disposal repair"],
];

const ADDRESS_RE =
  /\b(\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,6}\s*(?:Street|St|Place|Pl|Drive|Dr|Avenue|Ave|Road|Rd|Lane|Ln|Court|Ct|Boulevard|Blvd|Way|Circle|Cir|Terrace|Ter|Highway|Hwy)\.?)\b/i;

const DAY_RE =
  /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/i;

const TIME_WINDOW_RE =
  /\b(early morning|morning|afternoon|evening|midday|noon|after(?:noon)?\s*\d|before\s*noon|\d{1,2}\s*(?:am|pm)|between\s+\d)/i;

function trimOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function transcriptText(transcript: PlumbingTranscriptLine[]): string {
  return transcript.map((line) => line.text).join("\n");
}

function assistantText(transcript: PlumbingTranscriptLine[]): string {
  return transcript
    .filter((line) => line.role === "assistant")
    .map((line) => line.text)
    .join("\n");
}

/** Jarvis recap / confirmation language at end of call. */
export function transcriptIndicatesBookingConfirmed(transcript: PlumbingTranscriptLine[]): boolean {
  return BOOKING_CONFIRMED_RE.test(assistantText(transcript));
}

/** Regex fallback when Gemini extraction misses STT-noisy booking fields. */
export function heuristicPlumbingFieldsFromTranscript(
  transcript: PlumbingTranscriptLine[]
): Partial<ExtractedPlumbingBooking> {
  const all = transcriptText(transcript);
  const assistant = assistantText(transcript);

  let serviceType: string | null = null;
  for (const [pattern, label] of SERVICE_TYPE_RULES) {
    if (pattern.test(all)) {
      serviceType = label;
      break;
    }
  }

  let serviceAddress: string | null = null;
  const addressMatch = all.match(ADDRESS_RE);
  if (addressMatch?.[1]) {
    serviceAddress = addressMatch[1].trim();
  } else {
    const readBack = assistant.match(
      /(?:address is|at|for)\s+(\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,8})/i
    );
    if (readBack?.[1]) serviceAddress = readBack[1].trim();
  }

  const dayMatch = all.match(DAY_RE);
  const appointmentDate = dayMatch?.[1]
    ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase()
    : null;

  const timeMatch = all.match(TIME_WINDOW_RE);
  let timeWindow = timeMatch?.[1]?.trim() ?? null;
  if (timeWindow && /morning/i.test(timeWindow)) timeWindow = "Morning";
  if (timeWindow && /afternoon/i.test(timeWindow)) timeWindow = "Afternoon";
  if (timeWindow && /evening/i.test(timeWindow)) timeWindow = "Evening";

  const bookingAttempted = transcriptIndicatesBookingConfirmed(transcript);

  return {
    bookingAttempted,
    serviceType,
    serviceAddress,
    appointmentDate,
    timeWindow,
    isEmergency: /\bemergency|flooding|burst pipe|active leak\b/i.test(all),
  };
}

export function mergePlumbingExtraction(
  extracted: ExtractedPlumbingBooking | null,
  heuristics: Partial<ExtractedPlumbingBooking>,
  lead: { email?: string | null; fullName?: string | null; phone?: string | null },
  transcript: PlumbingTranscriptLine[]
): ExtractedPlumbingBooking {
  const confirmed = transcriptIndicatesBookingConfirmed(transcript);
  return {
    bookingAttempted:
      extracted?.bookingAttempted === true ||
      heuristics.bookingAttempted === true ||
      confirmed,
    isEmergency: extracted?.isEmergency === true || heuristics.isEmergency === true,
    fullName: extracted?.fullName?.trim() || lead.fullName?.trim() || null,
    email: extracted?.email?.trim() || lead.email?.trim() || null,
    phone: extracted?.phone?.trim() || lead.phone?.trim() || null,
    serviceAddress: extracted?.serviceAddress?.trim() || heuristics.serviceAddress?.trim() || null,
    serviceType: extracted?.serviceType?.trim() || heuristics.serviceType?.trim() || null,
    appointmentDate:
      extracted?.appointmentDate?.trim() || heuristics.appointmentDate?.trim() || null,
    timeWindow: extracted?.timeWindow?.trim() || heuristics.timeWindow?.trim() || null,
  };
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

  const prompt = `You extract structured plumbing appointment booking data from a voice receptionist call transcript (may contain STT errors).

Lead already on file: email=${lead.email?.trim() || "unknown"}, name=${lead.fullName?.trim() || "unknown"}, phone=${lead.phone?.trim() || "unknown"}

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
- bookingAttempted=true when Jarvis and the caller treated the visit as scheduled/confirmed — including when Jarvis mentions confirmation email/text, recaps address+date+time, or says "you're all set".
- Infer serviceType from the plumbing problem discussed (e.g. water heater, drain, leak, estimate) even if not labeled "service type".
- Extract serviceAddress from read-backs ("I have 25 Hughes Place…") or caller statements with street number + name.
- appointmentDate may be relative ("Thursday", "tomorrow"). timeWindow may be "Morning", "Afternoon", "10am", etc.
- Prefer lead on file for email/name/phone when caller confirmed without changing.
- Only set bookingAttempted=false for quote-only, callback-only, or clearly incomplete intake with no confirmation recap.`;

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

/** Gemini + regex merge — primary path for hangup finalize. */
export async function resolvePlumbingBookingFromTranscript(
  transcript: PlumbingTranscriptLine[],
  lead: { email?: string | null; fullName?: string | null; phone?: string | null }
): Promise<{ merged: ExtractedPlumbingBooking; gemini: ExtractedPlumbingBooking | null }> {
  const gemini = await extractPlumbingBookingFromTranscript(transcript, lead);
  const heuristics = heuristicPlumbingFieldsFromTranscript(transcript);
  const merged = mergePlumbingExtraction(gemini, heuristics, lead, transcript);
  return { merged, gemini };
}
