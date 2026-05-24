import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Thanks — we have your brief. | 998 web designs",
  robots: { index: false, follow: false },
};

export default function Thanks() {
  return (
    <>
      <Nav />
      <main className="border-b border-rule">
        <div className="mx-auto max-w-3xl px-5 py-20 md:px-8 md:py-28">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-success">
            Submitted
          </p>
          <h1 className="mt-4 font-display text-4xl font-medium leading-tight md:text-6xl">
            Thanks &mdash; we have your brief.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-ink-soft">
            We&rsquo;ll send the $499 deposit invoice to your email within the next few minutes.
            Here&rsquo;s exactly what happens next, in writing, so there are no surprises.
          </p>

          <ol className="mt-12 space-y-6">
            <Step
              n="01"
              title="Your $499 deposit invoice"
              body="Sent to the email you provided. Pay it whenever you're ready — the project clock doesn't start until the deposit clears. No charge until you act on the invoice."
            />
            <Step
              n="02"
              title="The 5–7 business-day clock starts"
              body="The moment the deposit clears. We get to work that day. You'll see a first draft inside a week."
            />
            <Step
              n="03"
              title="Approval window"
              body="When we send the draft, you have 7 business days to respond. The clock pauses while we wait for your approval or edits."
            />
            <Step
              n="04"
              title="Go live + balance due"
              body="Approve the design, you pay the $499 balance invoice, and we host the site. Same-day launch."
            />
          </ol>

          <aside className="mt-12 rounded-2xl border border-warn-soft bg-warn-soft/40 p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-warn">
              One thing to know up front
            </p>
            <p className="mt-3 text-base leading-relaxed text-ink">
              If we send a design draft and don&rsquo;t hear back within 7 business days, the
              project auto-delivers as final and the balance comes due. We say this here so it&rsquo;s
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
              href="mailto:hello@998webdesigns.com"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-bg transition hover:bg-ink-soft"
            >
              Email us
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
