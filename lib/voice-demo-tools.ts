import { designFeeCents } from "@/lib/design-promo";
import { isValidEmail } from "@/lib/validate-email";
import { normalizePhoneE164, checkSmsVerification } from "@/lib/twilio-verify";
import { sendTwilioSms } from "@/lib/twilio-sms";
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
import { sendPromoToVerifiedEmailLead } from "@/lib/voice-demo-promo";
import { marketingSiteOrigin } from "@/lib/site-origin";
import { spellPhoneForVoice } from "@/lib/voice-demo-spell-phone";
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
          description: "Save the visitor's name for CRM.",
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
            "Stage a US cell number. Speak the returned spoken field once, ask if correct. On yes, call confirm_phone_number — never spell digits twice.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              phone: { type: Type.STRING },
              smsConsent: {
                type: Type.BOOLEAN,
                description: "User agreed to receive one SMS from 998 web designs",
              },
            },
            required: ["phone", "smsConsent"],
          },
        },
        {
          name: "update_staged_phone",
          description:
            "User corrected the phone number. Re-stage; speak the new spoken field once, ask if correct.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              phone: { type: Type.STRING },
              smsConsent: { type: Type.BOOLEAN },
            },
            required: ["phone", "smsConsent"],
          },
        },
        {
          name: "confirm_phone_number",
          description:
            "Call when user said yes/correct after the one-time digit read-back. Sends SMS. Do not speak digits again.",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "decline_secondary_contact",
          description: "User declined to share second contact channel.",
          parameters: { type: Type.OBJECT, properties: {} },
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
  promoEmailSent?: boolean;
  promoCode?: string;
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

    const refreshed = (await getVoiceDemoLead(row.id)) ?? row;
    const promo = await sendPromoToVerifiedEmailLead(refreshed);

    return {
      ok: true,
      verified: true,
      promoEmailSent: promo.sent,
      promoCode: promo.sent || promo.alreadySent ? VOICE_DEMO_PROMO_CODE : undefined,
    };
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
    return { ok: true, name: visitorName };
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

  if (name === "stage_phone_number" || name === "update_staged_phone") {
    if (row.phone_verified_at) {
      return { ok: false, error: "SMS already sent to this lead." };
    }
    if (args.smsConsent !== true) {
      return { ok: false, error: "SMS consent required." };
    }

    const phone = typeof args.phone === "string" ? normalizePhoneE164(args.phone) : null;
    if (!phone) {
      return { ok: false, error: "Invalid US phone number." };
    }

    await updateVoiceDemoLead(leadId, { phone });

    return {
      ok: true,
      phone,
      spoken: spellPhoneForVoice(phone),
      spellOnce: true,
      message:
        "Speak the spoken field once, ask if correct. On yes, call confirm_phone_number — do not read digits again.",
    };
  }

  if (name === "confirm_phone_number") {
    if (!row.phone) {
      return { ok: false, error: "No phone staged. Collect the number first." };
    }
    if (row.phone_verified_at) {
      return { ok: false, error: "SMS already sent." };
    }

    const first = row.full_name?.split(" ")[0] ?? "there";
    const body = `Hi ${first} — your 998 web designs code: ${VOICE_DEMO_PROMO_CODE} (20% off design fee). Start at ${marketingSiteOrigin()}/start`;
    const sms = await sendTwilioSms(row.phone, body);
    if (!sms.ok) {
      return { ok: false, error: sms.error };
    }

    const now = new Date().toISOString();
    await updateVoiceDemoLead(leadId, {
      phone_verified_at: now,
    });

    return {
      ok: true,
      promoCode: VOICE_DEMO_PROMO_CODE,
      spellOnce: false,
      message:
        "SMS sent. Tell them briefly the text is on its way. Do not repeat or spell the phone number.",
    };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
}
