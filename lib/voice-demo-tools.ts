import { designFeeCents } from "@/lib/design-promo";
import { isValidEmail } from "@/lib/validate-email";
import { normalizePhoneE164, checkSmsVerification } from "@/lib/twilio-verify";
import { twilioMessagingFrom } from "@/lib/twilio-sms";
import {
  VOICE_DEMO_MAX_VERIFY_ATTEMPTS,
  VOICE_DEMO_PROMO_CODE,
} from "@/lib/voice-demo-constants";
import { codesMatch, isVerificationExpired } from "@/lib/voice-demo-otp";
import {
  getVoiceDemoLead,
  incrementVoiceDemoVerifyAttempts,
  markVoiceDemoVerified,
  promoAlreadySentForContact,
  updateVoiceDemoLead,
  type VoiceDemoLeadRow,
} from "@/lib/voice-demo-db";
import { sendVoiceDemoPromoEmail } from "@/lib/voice-demo-email";
import { sendPromoBundleForLeadId, sendPromoToVerifiedEmailLead } from "@/lib/voice-demo-promo";
import { deliverVoiceDemoPromoSms, promoSmsToolPayload } from "@/lib/voice-demo-promo-sms";
import { spellPhoneForVoice } from "@/lib/voice-demo-spell-phone";
import {
  buildWeatherZipConfirmLine,
  lookupUsWeatherByZip,
  resolveUsZipPlace,
} from "@/lib/voice-demo-weather";
import { Type, type ToolListUnion } from "@google/genai";

export type VoiceDemoToolMode = "verify" | "demo";

export function voiceDemoToolDeclarations(mode: VoiceDemoToolMode): ToolListUnion {
  if (mode === "verify") {
    return [
      {
        functionDeclarations: [
          {
            name: "verify_code",
            description: "Verify the 6-digit code the user spoke or typed.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                code: { type: Type.STRING, description: "Six-digit verification code" },
              },
              required: ["code"],
            },
          },
        ],
      },
    ];
  }

  return [
    {
      functionDeclarations: [
        {
          name: "save_name",
          description:
            "Save visitor name for CRM profile. Call as soon as they give their name — first onboarding step after verify.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
            },
            required: ["name"],
          },
        },
        {
          name: "capture_email_for_promo",
          description:
            "Capture email and send VOICE20 promo (20% off design fee). Only when primary channel was SMS and email missing.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              email: { type: Type.STRING },
            },
            required: ["email"],
          },
        },
        {
          name: "stage_phone_number",
          description:
            "Stage US cell for profile after visitor stops speaking (about 1-2s silence): spell digits, then confirm on yes (userConfirmed true). No coupon SMS here.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              phone: { type: Type.STRING },
              smsConsent: {
                type: Type.BOOLEAN,
                description: "User agreed to receive one SMS from 998 web designs",
              },
              userConfirmed: {
                type: Type.BOOLEAN,
                description: "True when visitor said yes/correct after digit read-back — sends SMS immediately",
              },
            },
            required: ["phone", "smsConsent"],
          },
        },
        {
          name: "update_staged_phone",
          description:
            "User corrected the phone number. Re-stage; spell once unless userConfirmed true (then sends SMS).",
          parameters: {
            type: Type.OBJECT,
            properties: {
              phone: { type: Type.STRING },
              smsConsent: { type: Type.BOOLEAN },
              userConfirmed: { type: Type.BOOLEAN },
            },
            required: ["phone", "smsConsent"],
          },
        },
        {
          name: "confirm_phone_number",
          description:
            "When visitor said yes/correct after digit read-back. Saves phone to profile only — no SMS.",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "send_promo_email",
          description:
            "Send VOICE20 coupon to verified email after visitor casually accepted the offer. Chill — only after they said yes.",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "send_promo_sms",
          description:
            "Text VOICE20 to profile phone after they accepted the offer and want SMS (or after send_promo_email).",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "end_conversation",
          description:
            "Call right after your final goodbye. Ends the voice call — do not speak or reply again after this.",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "decline_secondary_contact",
          description: "User declined to provide a phone number for their profile.",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "confirm_weather_zip",
          description:
            "Step 1 of weather: visitor just gave a US ZIP. Fast — validates ZIP, saves possible location. Returns spokenConfirm — you MUST speak it (confirm ZIP + say you are looking it up) before calling lookup_weather.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              zipCode: {
                type: Type.STRING,
                description: "US ZIP code the visitor just provided",
              },
            },
            required: ["zipCode"],
          },
        },
        {
          name: "lookup_weather",
          description:
            "Step 2 of weather: fetch current conditions after you spoke confirm_weather_zip spokenConfirm. Never call without confirm_weather_zip first in the same request.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              zipCode: {
                type: Type.STRING,
                description: "Same US ZIP confirmed in confirm_weather_zip",
              },
            },
            required: ["zipCode"],
          },
        },
      ],
    },
  ];
}

type VerifyLeadCodeResult = {
  ok: boolean;
  verified?: boolean;
  error?: string;
  attemptsRemaining?: number;
};

async function verifyLeadCode(
  row: VoiceDemoLeadRow,
  code: string
): Promise<VerifyLeadCodeResult> {
  if (row.email_verified_at || row.phone_verified_at) {
    return { ok: true, verified: true };
  }

  if (isVerificationExpired(row.verification_expires_at)) {
    return { ok: false, error: "Code expired. Close and request a new code." };
  }

  if ((row.verification_attempts ?? 0) >= VOICE_DEMO_MAX_VERIFY_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Try again later." };
  }

  const attempts = await incrementVoiceDemoVerifyAttempts(row.id);
  if (attempts === null) {
    return { ok: false, error: "Could not verify. Try again." };
  }

  if (row.primary_channel === "sms" && row.phone) {
    const twilio = await checkSmsVerification(row.phone, code);
    if (!twilio.ok) {
      return {
        ok: false,
        error: twilio.error,
        attemptsRemaining: Math.max(0, VOICE_DEMO_MAX_VERIFY_ATTEMPTS - attempts),
      };
    }
    await markVoiceDemoVerified(row.id, "sms");
    return { ok: true, verified: true };
  }

  if (row.primary_channel === "email") {
    if (!codesMatch(row.verification_code_hash, code)) {
      return {
        ok: false,
        error: "That code does not match. Try again.",
        attemptsRemaining: Math.max(0, VOICE_DEMO_MAX_VERIFY_ATTEMPTS - attempts),
      };
    }
    await markVoiceDemoVerified(row.id, "email");
    return { ok: true, verified: true };
  }

  return { ok: false, error: "Invalid session." };
}

export async function executeVoiceDemoTool(
  leadId: string,
  mode: VoiceDemoToolMode,
  name: string,
  args: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const row = await getVoiceDemoLead(leadId);
  if (!row) return { ok: false, error: "Session not found" };

  if (name === "verify_code" && mode === "verify") {
    const code = typeof args.code === "string" ? args.code : "";
    const result = await verifyLeadCode(row, code);
    return result;
  }

  if (mode !== "demo") {
    return { ok: false, error: "Not verified yet" };
  }

  if (!row.email_verified_at && !row.phone_verified_at) {
    return { ok: false, error: "Not verified yet" };
  }

  if (name === "save_name") {
    const visitorName = typeof args.name === "string" ? args.name.trim() : "";
    if (!visitorName || visitorName.length > 120) {
      return { ok: false, error: "Please provide a name." };
    }
    await updateVoiceDemoLead(leadId, { full_name: visitorName });
    return {
      ok: true,
      name: visitorName,
      message: "Name saved. Next ask for their US cell to complete their profile — no coupon mention yet.",
    };
  }

  if (name === "end_conversation") {
    return {
      ok: true,
      endCall: true,
      message: "Call ending. Stay silent — if the visitor says goodbye, do not respond.",
    };
  }

  if (name === "decline_secondary_contact") {
    await updateVoiceDemoLead(leadId, {
      secondary_declined_at: new Date().toISOString(),
    });
    return { ok: true };
  }

  if (name === "capture_email_for_promo") {
    if (row.primary_channel !== "sms") {
      return { ok: false, error: "Email promo only offered after phone verification." };
    }
    if (row.promo_sent_at) {
      return { ok: false, error: "Promo already sent." };
    }
    const email = typeof args.email === "string" ? args.email.trim().toLowerCase() : "";
    if (!isValidEmail(email)) {
      return { ok: false, error: "Invalid email." };
    }
    if (await promoAlreadySentForContact(email, null)) {
      return { ok: false, error: "Promo already sent to this email." };
    }

    const sent = await sendVoiceDemoPromoEmail(email, row.full_name);
    if (!sent) {
      return { ok: false, error: "Could not send email. Try hello@998webdesigns.com." };
    }

    await updateVoiceDemoLead(leadId, {
      email,
      promo_sent_at: new Date().toISOString(),
      promo_code: VOICE_DEMO_PROMO_CODE,
    });

    const discounted = designFeeCents(VOICE_DEMO_PROMO_CODE);
    return {
      ok: true,
      promoCode: VOICE_DEMO_PROMO_CODE,
      designFeeCents: discounted,
      message: "Promo email sent.",
    };
  }

  if (name === "send_promo_email") {
    const bundle = await sendPromoBundleForLeadId(leadId);
    const emailOk = bundle.email.sent || bundle.email.alreadySent;
    const smsOk = bundle.sms?.ok === true;

    if (emailOk) {
      const parts = ["Promo emailed — mention casually, check spam if needed."];
      if (bundle.sms) {
        if (smsOk) {
          parts.push("Text sent to their profile phone too — mention briefly if natural.");
        } else if (!bundle.sms.ok) {
          parts.push(
            `SMS did not send (${bundle.sms.error}). Apologize for the text only; email is fine. They can call send_promo_sms to retry.`
          );
        }
      }
      return {
        ok: true,
        promoEmailSent: true,
        promoSmsSent: smsOk,
        promoSmsError:
          bundle.sms && !bundle.sms.ok ? bundle.sms.error : undefined,
        promoCode: VOICE_DEMO_PROMO_CODE,
        message: parts.join(" "),
      };
    }

    return {
      ok: false,
      promoEmailSent: false,
      promoSmsSent: false,
      error: bundle.email.error ?? "Could not send promo email.",
      message: "Apologize briefly; suggest hello@998webdesigns.com.",
    };
  }

  if (name === "send_promo_sms") {
    const smsResult = await deliverVoiceDemoPromoSms(leadId);
    return promoSmsToolPayload(smsResult);
  }

  if (name === "stage_phone_number" || name === "update_staged_phone") {
    if (args.smsConsent !== true) {
      return { ok: false, error: "SMS consent required." };
    }

    const phone = typeof args.phone === "string" ? normalizePhoneE164(args.phone) : null;
    if (!phone) {
      return {
        ok: false,
        error:
          "Invalid or incomplete US phone number. Say you did not catch the full ten-digit cell number and ask them to repeat it once.",
      };
    }

    const twilioFrom = twilioMessagingFrom();
    if (twilioFrom && phone === twilioFrom) {
      return {
        ok: false,
        error: "That is our business line, not your cell. Ask for their personal mobile number.",
      };
    }

    await updateVoiceDemoLead(leadId, { phone });

    if (args.userConfirmed === true) {
      return {
        ok: true,
        phoneConfirmed: true,
        message: "Phone saved to profile. Continue onboarding or FAQ — no coupon unless PROMO OFFER rules apply.",
      };
    }

    return {
      ok: true,
      phone,
      spoken: spellPhoneForVoice(phone),
      spellOnce: true,
      message:
        "Speak the spoken field once, ask if correct. On yes, call confirm_phone_number or stage with userConfirmed true.",
    };
  }

  if (name === "confirm_phone_number") {
    const refreshed = await getVoiceDemoLead(leadId);
    if (!refreshed?.phone) {
      return { ok: false, error: "No phone staged. Collect the number first." };
    }
    return {
      ok: true,
      phoneConfirmed: true,
      message: "Phone saved to profile. Continue — no coupon unless they accept a later promo offer.",
    };
  }

  if (name === "confirm_weather_zip") {
    const zipCode = typeof args.zipCode === "string" ? args.zipCode : "";
    const placeResult = await resolveUsZipPlace(zipCode);
    if (!placeResult.ok) {
      return { ok: false, error: placeResult.error };
    }
    const { place } = placeResult;

    await updateVoiceDemoLead(leadId, {
      location_zip: place.zip,
      location_city: place.city,
      location_state: place.state,
    });

    const spokenConfirm = buildWeatherZipConfirmLine(place);
    return {
      ok: true,
      zip: place.zip,
      city: place.city,
      state: place.state,
      spokenConfirm,
      message:
        `Speak spokenConfirm now in a relaxed tone — confirm their city and ZIP and say you are looking it up. ` +
        `Pause a beat after you finish speaking. Do NOT give weather data yet. ` +
        `Then call lookup_weather alone (separate turn) with zipCode "${place.zip}".`,
    };
  }

  if (name === "lookup_weather") {
    const zipCode = typeof args.zipCode === "string" ? args.zipCode : "";
    const result = await lookupUsWeatherByZip(zipCode);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    await updateVoiceDemoLead(leadId, {
      location_zip: result.zip,
      location_city: result.city,
      location_state: result.state,
    });

    return {
      ok: true,
      zip: result.zip,
      city: result.city,
      state: result.state,
      briefReport: result.briefReport,
      possibleLocation: `${result.city}, ${result.state} ${result.zip}`,
      message:
        "Give a brief spoken weather summary from briefReport — temperature, conditions, wind. Keep it short.",
    };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}
