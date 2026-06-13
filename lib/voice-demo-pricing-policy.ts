import { HOSTING_FREE_MONTH_SUMMARY, HOSTING_MONTHLY_PRICE_MO_LABEL, HOSTING_TRIAL_DAYS } from "@/lib/hosting-policy";

/** Visitor explicitly asked about money - Jarvis may quote prices. */
export function isUserPricingQuestion(text: string): boolean {
  const t = text.trim().toLowerCase();
  if (!t) return false;
  return (
    /\b(how much|what(?:'s| is) the (?:price|cost|fee)|pricing|what do(?:es)? it cost|what would it cost)\b/.test(
      t
    ) ||
    /\b(costs?\b|price\b|fees?\b|budget|payment schedule|pay for|monthly rate|per month)\b/.test(
      t
    ) ||
    /\bhow (?:is|are) .{0,40}\bpaid\b/.test(t) ||
    /\bwhat(?:'s| is) included for\b/.test(t)
  );
}

/** Remove dollar amounts from FAQ copy for feature-first voice answers. */
export function stripFaqPrices(text: string): string {
  return text
    .replace(/\s+for\s+\$[\d,]+(?:\.\d{2})?/gi, "")
    .replace(/\$[\d,]+(?:\.\d{2})?(\s*\/\s*mo)?/gi, "")
    .replace(/\(\$[^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/ \./g, ".")
    .trim();
}

export const PRICING_WHEN_ASKED_RULES = `PRICING (critical - do not volunteer):
- Never mention dollar amounts, fees, monthly costs, payment schedules, or promo discounts unless the visitor explicitly asks about price, cost, how much, pricing, fees, budget, or payment.
- Default answers: features, deliverables, process, timeline, and benefits only - no numbers.
- "What's included", hosting, ownership, edits, Jarvis, SMS: describe what they get and how it works - not what it costs.
- When they explicitly ask for pricing: use PRICE PRONUNCIATION rules and PRICING REFERENCE below; answer from the full FAQ pricing detail; never invent beyond listed amounts.
- Do not mention /pricing or /start in feature answers - only when they ask about cost or say they are ready to buy.`;

export const VOICE_DEMO_PRICE_REFERENCE = `PRICING REFERENCE (internal - speak only when visitor asks about price or cost):
- Design fee: $5,998 (custom website - up to 6 pages, 7 business days from cleared deposit).
- Hosting after ${HOSTING_TRIAL_DAYS}-day free trial: ${HOSTING_MONTHLY_PRICE_MO_LABEL} month-to-month, or $2,996 one-time 10-year hosting (domain .com/.net/.org included on 10-year).
- AI Agent Chatbot: $299 setup, $79/mo.
- Jarvis AI Voice Chatbot: $499 setup, $149/mo.
- ${HOSTING_FREE_MONTH_SUMMARY}
- Promo ${"VOICE20"}: 20% off design fee only - only in close queue per promo rules, not during general FAQ.`;
