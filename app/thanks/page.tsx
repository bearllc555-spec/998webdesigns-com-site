import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ThanksActions } from "@/components/ThanksActions";
import { stripe } from "@/lib/stripe";

export const metadata = {
  title: "Payment received — let's build your site! | 998 web designs",
  robots: { index: false, follow: false },
};

type ThanksView = "paid" | "ach_processing";

export default async function Thanks({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/#start");
  }

  let view: ThanksView = "paid";
  let contactPrefill = {
    name: "",
    email: "",
    businessName: "",
    message: "I just paid in full and have a question:\n\n",
  };

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      view = "paid";
      contactPrefill = prefillFromSession(session, "I just paid in full and have a question:\n\n");
    } else if (
      session.metadata?.paymentChannel === "ach" &&
      session.payment_status === "unpaid" &&
      session.status === "complete"
    ) {
      view = "ach_processing";
      contactPrefill = prefillFromSession(
        session,
        "I submitted a bank payment and have a question:\n\n"
      );
    } else {
      redirect("/#start");
    }
  } catch {
    redirect("/#start");
  }

  if (view === "ach_processing") {
    return (
      <>
        <Nav />
        <main className="border-b border-rule">
          <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
              Bank payment submitted
            </p>
            <h1 className="mt-4 font-display text-4xl font-medium leading-tight md:text-6xl">
              Thanks — we&apos;re waiting on your bank transfer
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              Your ACH payment was authorized in Stripe. Banks usually take a few business days to
              settle. We&apos;ll email you when funds clear and your project enters the queue.
            </p>

            <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/[0.06] p-6">
              <p className="font-display text-lg font-medium text-ink">
                <span className="text-accent">Processing — not in the queue yet</span>
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                The 5&ndash;7 business-day design clock starts when your bank payment settles, not
                when you finish this checkout step.
              </p>
            </div>

            <ol className="mt-12 space-y-6">
              <Step
                n="01"
                title="Bank settlement (typically 3–5 business days)"
                body="Stripe will confirm when your transfer completes. No action needed unless your bank declines the debit."
              />
              <Step
                n="02"
                title="We email you when payment clears"
                body="You'll get confirmation and your receipt once settlement completes."
              />
              <Step
                n="03"
                title="Then the design clock starts"
                body="First draft within 5–7 business days after cleared payment."
              />
            </ol>

            <ThanksActions prefill={contactPrefill} />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="border-b border-rule">
        <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-success">
            Payment received
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight md:text-6xl">
            Thanks — you&apos;re paid in full!
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            Your payment has been received. A receipt is on its way to your email. Here&apos;s
            exactly what happens next, in writing, so there are no surprises.
          </p>

          <div className="mt-8 rounded-2xl border border-success/30 bg-success/10 p-6">
            <p className="font-display text-lg font-medium text-ink">
              <span className="text-success">Paid in full — you&apos;re all set</span>
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              No follow-up invoices for the design fee. Hosting, if selected separately, follows the
              option you chose at checkout.
            </p>
          </div>

          <ol className="mt-12 space-y-6">
            <Step
              n="01"
              title="The 5–7 business-day clock starts now"
              body="We get to work today. You'll see a first draft inside a week."
            />
            <Step
              n="02"
              title="Feedback window"
              body="When we send the draft, you have 14 days to respond with approval or edits. We'll follow up if we don't hear back."
            />
            <Step
              n="03"
              title="Go live"
              body="Approve the design and we launch your site. Same-day launch once approved."
            />
          </ol>

          <aside className="mt-12 rounded-2xl border border-warn-soft bg-warn-soft/40 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-warn">
              One thing to know up front
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink">
              If we send a design draft and don&rsquo;t hear back within 14 days, we&apos;ll mark
              the project complete and deliver the best version we have. Your files are held for 90
              days — come back in that window under normal edit terms. After 90 days, a $349
              re-engagement fee applies to reopen. We say this here so it&apos;s never a surprise
              later.
            </p>
          </aside>

          <ThanksActions prefill={contactPrefill} />
        </div>
      </main>
      <Footer />
    </>
  );
}

function prefillFromSession(
  session: {
    metadata?: Record<string, string> | null;
    customer_details?: { email?: string | null } | null;
    customer_email?: string | null;
  },
  message: string
) {
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

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="grid grid-cols-[auto_1fr] gap-5 rounded-2xl border border-rule bg-bg p-6">
      <span className="font-display text-3xl font-medium text-accent">{n}</span>
      <div>
        <h2 className="font-display text-xl font-medium">{title}</h2>
        <p className="mt-2 text-base leading-relaxed text-ink-soft">{body}</p>
      </div>
    </li>
  );
}
