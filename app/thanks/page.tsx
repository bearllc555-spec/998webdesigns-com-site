import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ThanksActions } from "@/components/ThanksActions";
import { formatCheckoutUsd } from "@/lib/checkout-pricing";
import { designMilestone2Cents, designMilestone3Cents } from "@/lib/design-payment-schedule";
import { HOSTING_MONTHLY_PRICE_MO_LABEL, HOSTING_TRIAL_DAYS } from "@/lib/hosting-policy";
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
    redirect("/start");
  }

  let view: ThanksView = "paid";
  let isDeposit = false;
  let isMilestone2 = false;
  let isMilestone3 = false;
  let balanceCents = 0;
  let milestone2Cents = 0;
  let milestone3Cents = 0;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionPaymentType = session.metadata?.paymentType ?? "full";
    isDeposit = sessionPaymentType === "deposit";
    isMilestone2 = sessionPaymentType === "milestone_2";
    isMilestone3 = sessionPaymentType === "milestone_3";
    balanceCents = Number(session.metadata?.designBalanceCents ?? 0);
    const promoCode = session.metadata?.promoCode;
    milestone2Cents = designMilestone2Cents(promoCode);
    milestone3Cents = designMilestone3Cents(promoCode);

    if (session.payment_status === "paid") {
      view = "paid";
    } else if (
      session.metadata?.paymentChannel === "ach" &&
      session.payment_status === "unpaid" &&
      session.status === "complete"
    ) {
      view = "ach_processing";
    } else {
      redirect("/start");
    }
  } catch {
    redirect("/start");
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
              {isMilestone2 || isMilestone3
                ? "Thanks — we\u2019re waiting on your milestone transfer"
                : isDeposit
                  ? "Thanks — we\u2019re waiting on your deposit transfer"
                  : "Thanks — we\u2019re waiting on your bank transfer"}
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink-soft">
              Your ACH payment was authorized in Stripe. Banks usually take a few business days to
              settle. We&apos;ll email you when funds clear
              {isDeposit ? " and your project enters the queue." : " and your project enters the queue."}
            </p>

            <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/[0.06] p-6">
              <p className="font-display text-lg font-medium text-ink">
                <span className="text-accent">Processing — not in the queue yet</span>
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                The 7 business-day design clock starts when your bank payment settles, not
                when you finish this checkout step.
              </p>
              {isDeposit && balanceCents > 0 && (
                <p className="mt-3 text-sm text-ink-soft">
                  After your 50% deposit clears, {formatCheckoutUsd(milestone2Cents)} is due after
                  design approval or development start, and {formatCheckoutUsd(milestone3Cents)} at
                  launch and handover ({formatCheckoutUsd(balanceCents)} total balance).
                </p>
              )}
            </div>

            <ol className="mt-12 space-y-6">
              <Step
                n="01"
                title="Bank settlement (typically a few business days)"
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
                body="First draft within 7 business days after cleared payment."
              />
            </ol>

            <ThanksActions sessionId={sessionId} />
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
              {isMilestone3
                ? "Thanks — design fee paid in full!"
                : isMilestone2
                  ? "Thanks — your 40% payment is in!"
                  : isDeposit
                    ? "Thanks — your 50% deposit is in!"
                    : "Thanks — you\u2019re paid in full!"}
            </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            Your payment has been received. A receipt is on its way to your email. Here&apos;s
            exactly what happens next, in writing, so there are no surprises.
          </p>

          <div className="mt-8 rounded-2xl border border-success/30 bg-success/10 p-6">
            <p className="font-display text-lg font-medium text-ink">
              <span className="text-success">
                {isMilestone3
                  ? "Paid in full — you\u2019re all set"
                  : isMilestone2
                    ? "40% milestone received"
                    : isDeposit
                      ? "50% deposit received — you\u2019re in the queue"
                      : "Paid in full — you\u2019re all set"}
              </span>
            </p>
            {isMilestone3 ? (
              <p className="mt-2 text-sm text-ink-soft">
                No further design-fee invoices. Your first {HOSTING_TRIAL_DAYS} days of hosting are free; hosting
                billing continues on your existing plan.
              </p>
            ) : isMilestone2 ? (
              <p className="mt-2 text-sm text-ink-soft">
                {formatCheckoutUsd(milestone3Cents)} is due at launch and handover. We&apos;ll send
                that invoice when the site is ready for final approval.
              </p>
            ) : isDeposit ? (
              <p className="mt-2 text-sm text-ink-soft">
                {formatCheckoutUsd(milestone2Cents)} is due after design approval or development
                start. {formatCheckoutUsd(milestone3Cents)} is due at launch and handover (
                {formatCheckoutUsd(balanceCents)} total balance). We&apos;ll invoice each milestone
                when it&apos;s due. Your first {HOSTING_TRIAL_DAYS} days of hosting are free; hosting billing starts
                {HOSTING_TRIAL_DAYS} days after your design payment cleared.
              </p>
            ) : (
              <p className="mt-2 text-sm text-ink-soft">
                No follow-up invoices for the design fee. Your first {HOSTING_TRIAL_DAYS} days of hosting are free.
                Month-to-month hosting ({HOSTING_MONTHLY_PRICE_MO_LABEL}) or 10-year hosting ($2,996) is billed starting {HOSTING_TRIAL_DAYS}
                days after your design payment cleared — not in this Checkout.
              </p>
            )}
          </div>

          <ol className="mt-12 space-y-6">
            <Step
              n="01"
              title="The 7 business-day clock starts now"
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

          <ThanksActions sessionId={sessionId} />
        </div>
      </main>
      <Footer />
    </>
  );
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
