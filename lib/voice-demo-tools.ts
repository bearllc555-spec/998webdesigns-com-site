import { designFeeCents } from "@/lib/design-promo";
import { isValidEmail } from "@/lib/validate-email";
import { normalizePhoneE164, checkSmsVerification } from "@/lib/twilio-verify";
import { twilioMessagingFrom } from "@/lib/twilio-sms";
import {
  VOICE_DEMO_MAX_VERIFY_ATTEMPTS,
  VOICE_DEMO_PROMO_CODE,
  VOICE_DEMO_PROMO_EMAIL_ASK_LINE,
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
import { buildSaveNameToolMessage } from "@/lib/voice-demo-greeting";
import { spellPhoneForVoice } from "@/lib/voice-demo-spell-phone";
import { coerceToolBoolean, coerceToolString } from "@/lib/voice-demo-tool-args";
import {
  buildWeatherZipConfirmLine,
  buildWeatherZipLookupLine,
  normalizeUsZipCode,
  lookupUsWeatherByZip,
  resolveUsZipPlace,
  usZipCodesEquivalent,
  weatherZipConfirmSpeakInstruction,
} from "@/lib/voice-demo-weather";
import { Type, type ToolListUnion } from "@google/genai";

export type VoiceDemoToolMode = "verify" | "demo";

export function voiceDemoToolDeclarations(mode: VoiceDemoToolMode): ToolListUnion {
  if (mode === "verify") {
    return [];
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
            "Stage US cell for profile after visitor stops speaking (about 2s silence): spell digits, then confirm on yes (userConfirmed true). No coupon SMS here.",
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
                description:
                  "True when visitor said yes/correct after digit read-back — saves phone to profile only",
              },
            },
            required: ["phone", "smsConsent"],
          },
        },
        {
          name: "update_staged_phone",
          description:
            "User corrected the phone number. Re-stage; spell once unless userConfirmed true (then save to profile).",
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
            `Email VOICE20 coupon ONLY after you asked "${VOICE_DEMO_PROMO_EMAIL_ASK_LINE}" and visitor said yes. Never call without that permission.`,
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
            "Step 1 of weather: visitor just gave a US ZIP. Validates ZIP, stages location. Returns spokenConfirm — read it back digit-by-digit and ask if correct. STOP and wait for yes before lookup_weather.",
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
            "Step 3 of weather: fetch conditions ONLY after visitor said yes/correct to the ZIP read-back. Never call in the same turn as confirm_weather_zip.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              zipCode: {
                type: Type.STRING,
                description: "Same US ZIP staged in confirm_weather_zip",
              },
              userConfirmed: {
                type: Type.BOOLEAN,
                description:
                  "True only when visitor said yes/correct/that's right after the ZIP read-back",
              },
            },
            required: ["zipCode", "userConfirmed"],
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
    const existing = row.full_name?.trim();
    if (existing && existing.toLowerCase() === visitorName.toLowerCase()) {
      return {
        ok: true,
        name: visitorName,
        alreadySaved: true,
        message: buildSaveNameToolMessage(visitorName, false),
      };
    }
    await updateVoiceDemoLead(leadId, { full_name: visitorName });
    return {
      ok: true,
      name: visitorName,
      message: buildSaveNameToolMessage(visitorName, false),
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
      const parts = [
        "Promo emailed — tell them briefly it is on its way (you already had their permission). Mention spam folder if natural.",
      ];
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
    const zipCode = coerceToolString(args.zipCode);
    const placeResult = await resolveUsZipPlace(zipCode);
    if (!placeResult.ok) {
      return {
        ok: false,
        error: `${placeResult.error} Say you did not catch the full five-digit ZIP and ask them to repeat it once.`,
      };
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
      zipReadBack: true,
      message:
        `${weatherZipConfirmSpeakInstruction(spokenConfirm)} ` +
        `On yes → lookup_weather with zipCode "${place.zip}" and userConfirmed true. ` +
        `On no or correction → call confirm_weather_zip again with the ZIP they give.`,
    };
  }

  if (name === "lookup_weather") {
    if (!coerceToolBoolean(args.userConfirmed)) {
      return {
        ok: false,
        error:
          "Visitor must confirm the ZIP read-back first. Speak spokenConfirm, wait for yes, then call lookup_weather with userConfirmed true.",
      };
    }

    const zipCode = coerceToolString(args.zipCode);
    const normalized = normalizeUsZipCode(zipCode);
    if (!normalized) {
      return {
        ok: false,
        error:
          "Could not read a valid 5-digit ZIP. Call confirm_weather_zip with the ZIP you heard, read it back, wait for yes, then lookup with the same ZIP.",
      };
    }

    const placeResult = await resolveUsZipPlace(normalized);
    if (!placeResult.ok) {
      return { ok: false, error: placeResult.error };
    }

    const refreshed = await getVoiceDemoLead(leadId);
    const stagedZip = refreshed?.location_zip ?? null;
    const stagedCity = refreshed?.location_city ?? null;
    if (!stagedZip || !usZipCodesEquivalent(stagedZip, normalized)) {
      return {
        ok: false,
        error:
          "ZIP not staged. Call confirm_weather_zip first with the ZIP they gave, speak spokenConfirm word for word, wait for yes, then lookup_weather with userConfirmed true.",
      };
    }
    if (!usZipCodesEquivalent(stagedZip, placeResult.place.zip)) {
      return {
        ok: false,
        error:
          "ZIP does not match what you confirmed. Call confirm_weather_zip with the ZIP they gave, read it back, wait for yes, then lookup with the same ZIP.",
      };
    }

    const confirmCity =
      stagedZip && stagedCity && usZipCodesEquivalent(stagedZip, placeResult.place.zip)
        ? stagedCity
        : placeResult.place.city;

    const result = await lookupUsWeatherByZip(placeResult.place.zip, { confirmCity });
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    await updateVoiceDemoLead(leadId, {
      location_zip: result.zip,
      location_city: result.city,
      location_state: result.state,
    });

    const spokenLookup = buildWeatherZipLookupLine({
      city: confirmCity,
      stateName: result.stateName,
    });

    return {
      ok: true,
      zip: result.zip,
      city: confirmCity,
      state: result.state,
      briefReport: result.briefReport,
      spokenLookup,
      possibleLocation: `${confirmCity}, ${result.state} ${result.zip}`,
      message:
        `Speak spokenLookup, then give a brief weather summary from briefReport for ${confirmCity} (ZIP ${result.zip}) only — ` +
        `use the city in briefReport exactly; Fahrenheit then Celsius, conditions, wind. Keep it short.`,
    };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}
