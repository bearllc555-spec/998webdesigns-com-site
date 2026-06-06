import { isValidDesignPromoCode } from "@/lib/design-promo";
import type { DiscoveryCloseDraft } from "@/lib/discovery-types";

const ALLOWED_ADDONS = new Set([
  "growth-pack",
  "ai-chatbot",
  "ai-receptionist",
  "social-media",
  "email-sms",
  "blog-writing",
  "hyper-local-seo",
  "google-profile",
  "booking-calendar",
]);

function str(v: unknown): string | null {
  return typeof v === "string" ? v.trim() : null;
}

function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

export function validateDiscoveryCloseDraft(
  body: Record<string, unknown>
): { ok: true; data: DiscoveryCloseDraft } | { ok: false; error: string } {
  const hostingChoice = str(body.hostingChoice);
  const paymentChannel = str(body.paymentChannel);

  if (!hostingChoice || !["lifetime", "monthly"].includes(hostingChoice)) {
    return { ok: false, error: "hostingChoice must be lifetime or monthly" };
  }
  if (!paymentChannel || !["ach", "card"].includes(paymentChannel)) {
    return { ok: false, error: "paymentChannel must be ach or card" };
  }

  const promoCode = str(body.promoCode) ?? "";
  if (promoCode && !isValidDesignPromoCode(promoCode)) {
    return { ok: false, error: "Invalid promo code" };
  }

  return {
    ok: true,
    data: {
      hostingChoice: hostingChoice as DiscoveryCloseDraft["hostingChoice"],
      paymentChannel: paymentChannel as DiscoveryCloseDraft["paymentChannel"],
      addons: strArray(body.addons).filter((id) => ALLOWED_ADDONS.has(id)),
      promoCode,
    },
  };
}
