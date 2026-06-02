import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { ThanksActions } from "@/components/ThanksActions";
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

  let contactPrefill = {
    name: "",
    email: "",
    businessName: "",
    message: "I just paid in full and have a question:\n\n",
  };
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      redirect("/#start");
    }
    contactPrefill = {
      name: session.metadata?.fullName ?? "",
      email:
        session.customer_details?.email ??
        session.metadata?.email ??
        session.customer_email ??
        "",
      businessName: session.metadata?.businessName ?? "",
      message: "I just paid in full and have a question:\n\n",
    };
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
              days — come back in that window under normal edit terms. After 90 days, a $249
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
