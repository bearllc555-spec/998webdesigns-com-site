import { isValidDesignPromoCode } from "@/lib/design-promo";
import type { DiscoveryCloseDraft } from "@/lib/discovery-types";
import type { PaymentOption } from "@/lib/validate-lead";

const ALLOWED_ADDONS = new Set([
  "growth-pack",
  "ai-chatbot",
  "jarvis-voice",
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
  const paymentOptionRaw = str(body.paymentOption) ?? "deposit";

  if (!hostingChoice || !["ten_year", "monthly"].includes(hostingChoice)) {
    return { ok: false, error: "hostingChoice must be ten_year or monthly" };
  }
  if (!paymentChannel || !["ach", "card"].includes(paymentChannel)) {
    return { ok: false, error: "paymentChannel must be ach or card" };
  }
  if (!["full", "deposit"].includes(paymentOptionRaw)) {
    return { ok: false, error: "paymentOption must be full or deposit" };
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
      paymentOption: paymentOptionRaw as PaymentOption,
      addons: strArray(body.addons).filter((id) => ALLOWED_ADDONS.has(id)),
      promoCode,
    },
  };
}
