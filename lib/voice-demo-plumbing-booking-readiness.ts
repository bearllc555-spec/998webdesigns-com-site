import type { PlumbingResumeJob } from "@/lib/voice-demo-plumbing-resume";
import { hasFullPersonName } from "@/lib/voice-demo-plumbing-contact-confirm";

const FIELD_LABELS: Record<string, string> = {
  name: "caller name",
  lastName: "last name",
  serviceAddress: "service address",
  phone: "callback phone",
  email: "email",
  serviceType: "service type",
  appointmentDate: "appointment date",
  timeWindow: "time window",
};

/** Fields still needed before book_plumbing_appointment can run. */
export function plumbingBookingMissingFields(opts: {
  fullName?: string | null;
  phone?: string | null;
  job?: PlumbingResumeJob | null;
}): string[] {
  const missing: string[] = [];
  const fullName = opts.fullName?.trim();
  if (!fullName) missing.push("name");
  else if (!hasFullPersonName(fullName)) missing.push("lastName");
  const job = opts.job;
  if (!job?.serviceAddress?.trim()) missing.push("serviceAddress");
  if (!opts.phone?.trim()) missing.push("phone");
  if (!job?.customerEmail?.trim()) missing.push("email");
  if (!job?.serviceType?.trim()) missing.push("serviceType");
  if (!job?.appointmentDate?.trim()) missing.push("appointmentDate");
  if (!job?.timeWindow?.trim()) missing.push("timeWindow");
  return missing;
}

export function plumbingBookingMissingLabels(opts: {
  fullName?: string | null;
  phone?: string | null;
  job?: PlumbingResumeJob | null;
}): string[] {
  return plumbingBookingMissingFields(opts).map((key) => FIELD_LABELS[key] ?? key);
}

export function isPlumbingBookingReady(opts: {
  fullName?: string | null;
  phone?: string | null;
  job?: PlumbingResumeJob | null;
}): boolean {
  return plumbingBookingMissingFields(opts).length === 0;
}
