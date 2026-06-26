import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";

const LUMEN_KNOWLEDGE = `
SERVICES & PRICING:
- Wrinkle relaxers (Botox/Dysport/Jeuveau): from $12/unit; typical 20-40 units; results 3-7 days, last 3-4 months.
- Dermal filler: from $750/syringe; cheeks, jawline, under-eye, lips.
- Lip enhancement: from $695; natural, balanced volume.
- Biostimulators (Sculptra): from $850/session; gradual collagen, usually a series.
- Microneedling + PRF: from $550; texture, tone, glow; minimal downtime.
- Laser resurfacing: from $400; sun damage and fine lines.
- Medical facials: from $175; clinical-grade, zero downtime.
- Free consultations for new patients.

BOOKING: Book by voice, online, or phone. New patients usually seen same week. Collect name, phone, email, service, preferred time. Confirmation by SMS + email. Reschedule/cancel up to 24h before.

EVENT TIMING: Recommend booking consult now. Injectables need ~2 weeks lead time before an event for best settling. Offer earliest slot.

COMPANY: Licensed/board-certified providers. Natural, subtle results. Payment: major cards; financing discussed at consult.

OBJECTIONS:
- "Will I look overdone?" → Natural results are the philosophy; we do less and build.
- "It seems expensive." → Walk through value, membership savings, consult-first; never pressure.
- "I need to think / ask my partner." → Offer tentative consult slot; send info by text/email.

PROMOTIONS: New patient $50 off first treatment or complimentary consultation. LUMEN Circle membership saves on every visit.

MEDICAL GUARDRAIL: Never give medical advice. Post-treatment symptoms → general reassurance only, capture contact, promise provider callback.
`.trim();

const WILLOW_KNOWLEDGE = `
SERVICES & PRICING:
- Signature HydraGlow Facial: from $165; deep clean, hydrate, glow; no downtime.
- Microneedling: from $350; smoother, brighter skin.
- Chemical peels: from $125; resurfacing, brightening.
- Botox & Baby Botox: from $12/unit; soft, natural movement.
- Filler & lip: from $695; subtle volume.
- IV drips & vitamin shots: from $99; hydration and energy.
- Medical weight management: from $199/mo; provider-supervised programs reviewed at visit. Do NOT promise outcomes or medications.

BOOKING: Book by voice, online, or phone. New clients often seen same week. Confirmation by SMS + email. Memberships optional, never required.

COMPANY: Licensed medical providers. Warm, unhurried, personal. Payment: major cards; membership billed monthly.

OBJECTIONS:
- "I've never done this before." → Most clients start there; we go slow.
- "Do I have to be a member?" → Never required; walk-in pricing always available.
- "Is weight management right for me?" → Provider-supervised; book consult for eligibility review. No medical advice or drug promises.

PROMOTIONS: New client first HydraGlow facial $99 or complimentary skin consultation. Glow Club saves on monthly care.

MEDICAL GUARDRAIL: Never give medical advice. Post-treatment or eligibility questions → reassurance only, capture contact, promise provider callback.
`.trim();

export function aestheticsDemoKnowledge(brand: AestheticsDemoBrand): string {
  const config = getDemoBrandConfigByVertical(brand);
  const base = brand === "clinical" ? LUMEN_KNOWLEDGE : WILLOW_KNOWLEDGE;
  return `${base}

HOURS: Tue-Sat 10am-7pm; closed Sun-Mon. Jarvis answers and books 24/7; appointments scheduled within open hours.
LOCATION: ${config.address}. Serves ${config.city} and surrounding area.
PROVIDERS: ${config.providers.map((p) => `${p.name}, ${p.title}`).join("; ")}.`;
}
