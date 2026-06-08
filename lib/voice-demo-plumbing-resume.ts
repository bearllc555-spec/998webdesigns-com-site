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

  if (job?.customerEmail && job.appointmentDate) {
    msg +=
      ` Caller gave email (${job.customerEmail}) and schedule (${job.appointmentDate}${job.timeWindow ? ` ${job.timeWindow}` : ""}). ` +
      `If book_plumbing_appointment has not run yet, call it now with all on-file details, then confirm warmly.`;
  }

  const parts: string[] = [];
  if (job?.serviceType) parts.push(`service: ${job.serviceType}`);
  if (job?.serviceAddress) parts.push(`address: ${job.serviceAddress}`);
  if (job?.customerEmail) parts.push(`email: ${job.customerEmail}`);
  if (job?.appointmentDate) parts.push(`date: ${job.appointmentDate}`);
  if (job?.timeWindow) parts.push(`time: ${job.timeWindow}`);

  if (parts.length > 0) {
    msg +=
      ` Mid-booking on file (${parts.join("; ")}). ` +
      `Continue scheduling — ask only for what is still missing.`;
  } else {
    msg += " Pick up the conversation naturally and keep helping with their plumbing issue.";
  }

  return msg;
}
