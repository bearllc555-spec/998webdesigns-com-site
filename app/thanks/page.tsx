import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { stripe } from "@/lib/stripe";

export const metadata = {
  title: "Payment received — let's build your site! | 998 web designs",
  robots: { index: false, follow: false },
};

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

  let isPaidInFull = false;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      redirect("/#start");
    }
    isPaidInFull = session.metadata?.paymentType === "full";
  } catch {
    redirect("/#start");
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
            {isPaidInFull
              ? "Thanks — you're paid in full!"
              : "Thanks — your deposit is paid!"}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            {isPaidInFull
              ? "Your $998 payment has been received. A receipt is on its way to your email. Here's exactly what happens next, in writing, so there are no surprises."
              : "Your $499 deposit has been received. A receipt is on its way to your email. Here's exactly what happens next, in writing, so there are no surprises."}
          </p>

          <div className="mt-8 rounded-2xl border border-success/30 bg-success/10 p-6">
            {isPaidInFull ? (
              <p className="font-display text-lg font-medium text-ink">
                Total: $998 &nbsp;|&nbsp;{" "}
                <span className="text-success">Paid in full — no balance due</span>
              </p>
            ) : (
              <>
                <p className="font-display text-lg font-medium text-ink">
                  Total: $998 &nbsp;|&nbsp; Deposit paid: $499 &nbsp;|&nbsp;{" "}
                  <span className="text-success">Balance: $499 (held on your card)</span>
                </p>
                <p className="mt-2 text-sm text-ink-soft">
                  We&apos;ve placed a 7-day authorization hold on your card for the $499
                  balance. When your site is ready and approved, we&apos;ll capture the
                  balance — no action needed from you.
                </p>
              </>
            )}
          </div>

          <ol className="mt-12 space-y-6">
            <Step
              n="01"
              title="The 5–7 business-day clock starts now"
              body="We get to work today. You'll see a first draft inside a week."
            />
            <Step
              n="02"
              title="Approval window"
              body="When we send the draft, you have 7 business days to respond. The clock pauses while we wait for your approval or edits."
            />
            <Step
              n="03"
              title={isPaidInFull ? "Go live" : "Go live + balance captured"}
              body={
                isPaidInFull
                  ? "Approve the design and we launch your site. Same-day launch once approved."
                  : "Approve the design and we capture the $499 balance from your card and launch your site. Same-day launch once approved."
              }
            />
          </ol>

          <aside className="mt-12 rounded-2xl border border-warn-soft bg-warn-soft/40 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-warn">
              One thing to know up front
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink">
              If we send a design draft and don&rsquo;t hear back within 7 business days, the
              project auto-delivers as final
              {!isPaidInFull && " and the balance comes due"}. We say this here so it&rsquo;s
              never a surprise later.
            </p>
          </aside>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-rule bg-bg px-5 py-3 text-sm font-medium text-ink transition hover:border-ink-soft"
            >
              &larr; Back to home
            </Link>
            <a
              href="mailto:hello@998webdesigns.com?subject=Deposit%20paid%20-%20question"
              className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-medium text-on-accent shadow-sm transition hover:bg-accent-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Email hello@998webdesigns.com
            </a>
          </div>
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
