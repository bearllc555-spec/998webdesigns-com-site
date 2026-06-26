export const AESTHETICS_BOOKING_INTENT_EVENT = "aesthetics:booking-intent";

export type AestheticsBookingIntent = "contact" | "book";

export type AestheticsBookingDetail = {
  intent?: AestheticsBookingIntent;
  serviceName?: string;
};

/** Scroll to #book and optionally pre-select contact vs calendar path. */
export function scrollToMedSpaBooking(detail?: AestheticsBookingDetail): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<AestheticsBookingDetail>(AESTHETICS_BOOKING_INTENT_EVENT, {
      detail: detail ?? {},
    }),
  );

  document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function openMedSpaBooking(detail?: AestheticsBookingDetail): void {
  scrollToMedSpaBooking({ intent: "book", ...detail });
}

export function openMedSpaContact(): void {
  scrollToMedSpaBooking({ intent: "contact" });
}
