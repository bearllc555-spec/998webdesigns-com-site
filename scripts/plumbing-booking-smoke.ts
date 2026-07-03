/**
 * Plumbing Jarvis booking comms smoke test — DB schema + Resend email + Twilio SMS.
 *
 * Creates a labeled smoke lead/job on helmet, writes address-part columns (regression
 * for service_city migration), then sends the same confirmation email + SMS as production.
 *
 * Usage (repo root, needs .env.local):
 *   npm run plumbing:smoke
 *   npm run plumbing:smoke -- --email demeos@gmail.com --phone 9734496700
 *   npm run plumbing:smoke -- --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { updateVoiceDemoLead } from "@/lib/voice-demo-db";
import {
  getLatestPlumbingJobForLead,
  upsertPlumbingJob,
} from "@/lib/voice-demo-plumbing-db";
import { sendPlumbingDemoEmail } from "@/lib/voice-demo-plumbing-email";
import { generatePlumbingPromoCode } from "@/lib/voice-demo-plumbing-promo-code";
import { sendPlumbingBookingSms } from "@/lib/voice-demo-plumbing-sms";
import { startPlumbingDemoLead } from "@/lib/voice-demo-plumbing-start";
import { twilioMessagingConfigured } from "@/lib/twilio-sms";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceLocal = path.resolve(__dirname, "..", "..", "..", ".local");

/** Prefer slatepress/.local when .env.local has a stale Resend key. */
function hydrateWorkspaceSecrets(): void {
  const resendPath = path.join(workspaceLocal, "resend-api-key.txt");
  if (fs.existsSync(resendPath)) {
    const key = fs.readFileSync(resendPath, "utf8").trim();
    if (key.startsWith("re_")) process.env.RESEND_API_KEY = key;
  }
}

const SMOKE_TAG = "plumbing-booking-smoke";

function parseArgs(argv: string[]) {
  const emailIdx = argv.indexOf("--email");
  const phoneIdx = argv.indexOf("--phone");
  return {
    email:
      emailIdx >= 0 && argv[emailIdx + 1]
        ? argv[emailIdx + 1]!.trim().toLowerCase()
        : "demeos@gmail.com",
    phone:
      phoneIdx >= 0 && argv[phoneIdx + 1]
        ? argv[phoneIdx + 1]!.trim()
        : "9734496700",
    dryRun: argv.includes("--dry-run"),
  };
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "there";
}

async function main() {
  hydrateWorkspaceSecrets();
  const { email, phone, dryRun } = parseArgs(process.argv.slice(2));

  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!process.env.RESEND_API_KEY?.trim()) missing.push("RESEND_API_KEY");
  if (!twilioMessagingConfigured()) {
    missing.push("TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_MESSAGING_FROM or TWILIO_MESSAGING_SERVICE_SID");
  }
  if (missing.length) {
    console.error("Missing env for smoke test:", missing.join(", "));
    process.exit(1);
  }

  console.log("plumbing-booking-smoke");
  console.log("  email:", email);
  console.log("  phone:", phone);
  console.log("  dryRun:", dryRun);

  if (dryRun) {
    console.log("OK - preflight passed (dry run, no DB/comms)");
    return;
  }

  const started = await startPlumbingDemoLead(email, "127.0.0.1");
  if (!started.ok) {
    console.error("FAIL - could not start plumbing lead:", started.error);
    process.exit(1);
  }
  const leadId = started.leadId;
  const visitorName = "Anthony Demeo (Smoke)";

  const leadSaved = await updateVoiceDemoLead(leadId, {
    full_name: visitorName,
    phone,
    email,
  });
  if (!leadSaved) {
    console.error("FAIL - could not update lead contact fields");
    process.exit(1);
  }

  const promoCode = generatePlumbingPromoCode();
  const serviceType = "Water heater estimate (smoke test)";
  const serviceStreet = "25 Hughes Place";
  const serviceCity = "Little Falls";
  const serviceState = "NJ";
  const serviceZip = "07424";
  const serviceAddress = `${serviceStreet}, ${serviceCity}, ${serviceState} ${serviceZip}`;
  const appointmentDate = "2026-07-10";
  const timeWindow = "Morning";

  const draft = await upsertPlumbingJob({
    leadId,
    status: "draft",
    serviceType,
    serviceStreet,
    serviceCity,
    serviceState,
    serviceZip,
    serviceAddress,
    appointmentDate,
    timeWindow,
    priceRange: "Free estimate",
    customerEmail: email,
    promoApplied: true,
    promoCode,
    notes: { smokeTest: true, source: SMOKE_TAG, at: new Date().toISOString() },
  });
  if (!draft.ok) {
    console.error("FAIL - jarvis_plumbing_jobs insert (address columns):", draft.error);
    process.exit(1);
  }
  console.log("OK - DB draft job with address parts, jobId:", draft.id);

  const booked = await upsertPlumbingJob({
    leadId,
    status: "booked",
    promoApplied: true,
    promoCode,
  });
  if (!booked.ok) {
    console.error("FAIL - could not mark job booked:", booked.error);
    process.exit(1);
  }

  const job = await getLatestPlumbingJobForLead(leadId);
  if (!job || job.status !== "booked") {
    console.error("FAIL - booked job not readable after update");
    process.exit(1);
  }
  if (!job.service_city) {
    console.error("FAIL - service_city not persisted on job row");
    process.exit(1);
  }

  const payload = {
    to: email,
    firstName: firstName(visitorName),
    customerName: visitorName,
    phone,
    serviceType: job.service_type ?? serviceType,
    appointmentDate: job.appointment_date ?? appointmentDate,
    timeWindow: job.time_window ?? timeWindow,
    serviceAddress: job.service_address ?? serviceAddress,
    priceRange: job.price_range ?? "Free estimate",
    promoApplied: true,
    promoCode: job.promo_code ?? promoCode,
    isEmergency: false,
  };

  const emailSent = await sendPlumbingDemoEmail("appointment", payload);
  if (!emailSent) {
    console.error("FAIL - Resend confirmation email did not send");
    process.exit(1);
  }
  console.log("OK - confirmation email sent via Resend to", email);

  const sms = await sendPlumbingBookingSms(payload);
  if (!sms.ok) {
    console.error("FAIL - Twilio SMS:", sms.error ?? "unknown");
    process.exit(1);
  }
  console.log(
    "OK - confirmation SMS delivered via Twilio",
    sms.sentCount,
    "of",
    sms.recipientCount,
    "recipient(s); primary",
    phone
  );

  await upsertPlumbingJob({
    leadId,
    confirmationEmailSentAt: new Date().toISOString(),
  });

  console.log("");
  console.log("SMOKE PASS");
  console.log("  leadId:", leadId);
  console.log("  jobId:", job.id);
  console.log("  promoCode:", payload.promoCode);
  console.log("  check inbox + phone for Metro Plumbing confirmation");
  console.log("  CRM: Plumbing Jarvis demos (notes.smokeTest=true)");
}

main().catch((err) => {
  console.error("FAIL - unexpected error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
