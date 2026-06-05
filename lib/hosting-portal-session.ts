import { stripe } from "@/lib/stripe";

export async function createHostingBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string | null> {
  const configuration = process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID?.trim();

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    ...(configuration ? { configuration } : {}),
  });

  return session.url ?? null;
}
