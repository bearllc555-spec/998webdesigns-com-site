import type Stripe from "stripe";
import {
  markDiscoveryProspectDepositPaid,
  markDiscoveryProspectPaid,
} from "@/lib/discovery-db";

export async function syncDiscoveryProspectAfterPayment(
  session: Stripe.Checkout.Session,
  status: "deposit_paid" | "paid"
): Promise<void> {
  const prospectId = session.metadata?.discoveryProspectId?.trim();
  if (!prospectId) return;

  if (status === "deposit_paid") {
    await markDiscoveryProspectDepositPaid(prospectId);
    return;
  }
  await markDiscoveryProspectPaid(prospectId);
}
