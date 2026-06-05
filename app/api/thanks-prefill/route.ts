import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type { ContactPrefill } from "@/lib/contact-prefill";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function prefillFromSession(
  session: {
    metadata?: Record<string, string> | null;
    customer_details?: { email?: string | null } | null;
    customer_email?: string | null;
    payment_status?: string | null;
    status?: string | null;
  },
  message: string
): ContactPrefill | null {
  const paid = session.payment_status === "paid";
  const achPending =
    session.metadata?.paymentChannel === "ach" &&
    session.payment_status === "unpaid" &&
    session.status === "complete";

  if (!paid && !achPending) return null;

  return {
    name: session.metadata?.fullName ?? "",
    email:
      session.customer_details?.email ??
      session.metadata?.email ??
      session.customer_email ??
      "",
    businessName: session.metadata?.businessName ?? "",
    message,
  };
}

/** Returns contact-modal prefill for a completed Checkout session (no PII in thanks page HTML). */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim();
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const message =
      session.payment_status === "paid"
        ? "I just paid in full and have a question:\n\n"
        : "I submitted a bank payment and have a question:\n\n";
    const prefill = prefillFromSession(session, message);
    if (!prefill) {
      return NextResponse.json({ error: "Session not eligible" }, { status: 404 });
    }
    return NextResponse.json({ prefill });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 404 });
  }
}
