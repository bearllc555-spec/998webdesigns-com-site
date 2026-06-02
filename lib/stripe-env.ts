export type StripeKeyMode = "test" | "live" | "missing" | "unknown";

export function stripeKeyMode(): StripeKeyMode {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return "missing";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "unknown";
}

/** Logs when Production Vercel still uses test Stripe keys (intentional until go-live). */
export function warnIfProductionStripeTestMode(context: string): void {
  if (process.env.VERCEL_ENV !== "production") return;
  if (stripeKeyMode() !== "test") return;
  console.warn(
    `[${context}] STRIPE_SECRET_KEY is sk_test_ on Vercel Production. Real cards will fail until you swap to sk_live_ on project 998webdesigns-com-site. See DEPLOYMENT.md.`
  );
}
