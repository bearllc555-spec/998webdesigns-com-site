import {
  isPlumbingBookingReady,
  plumbingBookingMissingLabels,
} from "@/lib/voice-demo-plumbing-booking-readiness";
import { VOICE_DEMO_SESSION_RESUME_CUE } from "@/lib/voice-demo-greeting";

export type PlumbingResumeJob = {
  status?: string;
  serviceType?: string | null;
  serviceAddress?: string | null;
  customerEmail?: string | null;
  appointmentDate?: string | null;
  timeWindow?: string | null;
};

/** Hidden nudge after WebSocket resume — keeps booking flow alive mid-scheduling. */
export function buildPlumbingSessionResumeNudge(opts: {
  nameOnFile?: string;
  job?: PlumbingResumeJob | null;
}): string {
  const name = opts.nameOnFile?.trim();
  let msg =
    `${VOICE_DEMO_SESSION_RESUME_CUE} Connection resumed — you are still on a live Metro Plumbing call. ` +
    `Stay on the line; do not say goodbye or replay the full opening.`;

  if (name) {
    msg += ` Caller name on file: ${name}.`;
  }

  const job = opts.job;
  if (job?.status === "booked" || job?.status === "emergency") {
    const when = [job.appointmentDate, job.timeWindow].filter(Boolean).join(" ");
    msg +=
      ` Appointment is already booked (${job.serviceType ?? "service"}${when ? `, ${when}` : ""}). ` +
      `Confirm the confirmation email is on its way, recap address and schedule, and stay on the line — do not restart intake.`;
    return msg;
  }

  const parts: string[] = [];
  if (job?.serviceType) parts.push(`service: ${job.serviceType}`);
  if (job?.serviceAddress) parts.push(`address: ${job.serviceAddress}`);
  if (job?.customerEmail) parts.push(`email: ${job.customerEmail}`);
  if (job?.appointmentDate) parts.push(`date: ${job.appointmentDate}`);
  if (job?.timeWindow) parts.push(`time: ${job.timeWindow}`);

  const missing = plumbingBookingMissingLabels({ fullName: name, job });
  const ready = isPlumbingBookingReady({ fullName: name, job });

  if (ready) {
    msg +=
      ` All booking fields are on file (${parts.join("; ")}${name ? `; name: ${name}` : ""}). ` +
      `The line had a brief hiccup — apologize once, then call book_plumbing_appointment immediately with on-file details. ` +
      `Do NOT re-ask name, address, email, date, or time.`;
    return msg;
  }

  if (parts.length > 0 || name) {
    msg +=
      ` Mid-booking on file (${[name ? `name: ${name}` : null, ...parts].filter(Boolean).join("; ")}). ` +
      `Connection hiccup — do NOT restart intake or say "real quick what's your name/address" for fields already on file. ` +
      `Ask ONLY for: ${missing.join(", ")}.`;
  } else {
    msg += " Pick up the conversation naturally and keep helping with their plumbing issue.";
  }

  return msg;
}
