import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { FilloutStandardEmbed } from "@/components/fillout/FilloutStandardEmbed";
import { BOOK_FILLOUT_ID } from "@/lib/book-fillout";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/book", {
  title: "Book a discovery call - 998 web designs",
  description:
    "Tell us what you need. We’ll follow up to schedule a short discovery call before personalized checkout. Custom websites from $7,998.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Book a discovery call - 998 web designs",
  },
});

export default function BookPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <div className="mx-auto max-w-xl px-5 py-16 md:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Discovery
          </p>
          <h1 className="mt-4 font-display text-3xl font-medium leading-tight text-ink md:text-4xl">
            Book a discovery call
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Not ready to pay yet? Tell us what you need. We&apos;ll follow up to schedule a short
            call, then send a personalized checkout link.
          </p>

          {BOOK_FILLOUT_ID ? (
            <div className="mt-10 overflow-hidden rounded-md border border-rule bg-bg">
              <FilloutStandardEmbed
                filloutId={BOOK_FILLOUT_ID}
                title="Book a discovery call"
              />
            </div>
          ) : (
            <div className="mt-10 rounded-md border border-rule bg-rule-soft/60 px-5 py-8 text-sm text-ink-soft">
              <p>
                Discovery form is almost ready. Prefer to start now?{" "}
                <Link href="/start" className="text-accent underline hover:text-accent-deep">
                  Get started
                </Link>{" "}
                or{" "}
                <Link href="/intake" className="text-accent underline hover:text-accent-deep">
                  get a free mockup
                </Link>
                .
              </p>
            </div>
          )}

          <p className="mt-8 text-sm text-slate">
            Prefer to skip the call?{" "}
            <Link href="/start" className="text-accent underline hover:text-accent-deep">
              Start checkout
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
