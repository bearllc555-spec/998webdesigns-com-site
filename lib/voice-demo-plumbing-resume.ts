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
    msg +=
      ` Appointment is already booked (${job.serviceType ?? "service"}). ` +
      `Warmly confirm address, date, and time — do not restart intake from scratch.`;
    return msg;
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
