import type { PlumbingResumeJob } from "@/lib/voice-demo-plumbing-resume";

const FIELD_LABELS: Record<string, string> = {
  name: "caller name",
  serviceAddress: "service address",
  email: "email",
  serviceType: "service type",
  appointmentDate: "appointment date",
  timeWindow: "time window",
};

/** Fields still needed before book_plumbing_appointment can run. */
export function plumbingBookingMissingFields(opts: {
  fullName?: string | null;
  job?: PlumbingResumeJob | null;
}): string[] {
  const missing: string[] = [];
  if (!opts.fullName?.trim()) missing.push("name");
  const job = opts.job;
  if (!job?.serviceAddress?.trim()) missing.push("serviceAddress");
  if (!job?.customerEmail?.trim()) missing.push("email");
  if (!job?.serviceType?.trim()) missing.push("serviceType");
  if (!job?.appointmentDate?.trim()) missing.push("appointmentDate");
  if (!job?.timeWindow?.trim()) missing.push("timeWindow");
  return missing;
}

export function plumbingBookingMissingLabels(opts: {
  fullName?: string | null;
  job?: PlumbingResumeJob | null;
}): string[] {
  return plumbingBookingMissingFields(opts).map((key) => FIELD_LABELS[key] ?? key);
}

export function isPlumbingBookingReady(opts: {
  fullName?: string | null;
  job?: PlumbingResumeJob | null;
}): boolean {
  return plumbingBookingMissingFields(opts).length === 0;
}
