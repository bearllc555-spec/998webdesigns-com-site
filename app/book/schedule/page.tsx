import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { discoveryBookCallUrl } from "@/lib/book-call";
import { getDiscoveryProspect, markDiscoveryEmailVerified } from "@/lib/discovery-db";
import { verifyDiscoveryScheduleToken } from "@/lib/discovery-token";

export const metadata: Metadata = {
  title: "Schedule your call - 998 web designs",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function SchedulePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const bookUrl = discoveryBookCallUrl();
  const trimmedToken = token?.trim() ?? "";

  if (trimmedToken) {
    const payload = verifyDiscoveryScheduleToken(trimmedToken);
    if (!payload) {
      return (
        <div className="min-h-screen bg-bg">
          <Nav />
          <main id="main" className="mx-auto max-w-xl px-5 py-16 md:py-24">
            <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Link expired</h1>
            <p className="mt-4 text-ink-soft">
              This scheduling link is invalid or has expired. Start again from the discovery form or
              email hello@998webdesigns.com for help.
            </p>
            <Link
              href="/book"
              className="mt-8 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white"
            >
              Book a discovery call
            </Link>
          </main>
          <Footer />
        </div>
      );
    }

    const prospect = await getDiscoveryProspect(payload.prospectId);
    if (!prospect) {
      return (
        <div className="min-h-screen bg-bg">
          <Nav />
          <main id="main" className="mx-auto max-w-xl px-5 py-16 md:py-24">
            <p className="text-warn">We could not find your session. Please start again from /book.</p>
            <Link href="/book" className="mt-6 inline-block text-accent underline">
              Book a discovery call
            </Link>
          </main>
          <Footer />
        </div>
      );
    }

    if (!prospect.email_verified_at) {
      await markDiscoveryEmailVerified(payload.prospectId);
    }

    if (bookUrl) {
      redirect(bookUrl);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main" className="mx-auto max-w-xl px-5 py-16 md:py-24">
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Book your call</h1>
        <p className="mt-4 text-ink-soft">
          Pick a time that works - we will walk through scope, hosting, and add-ons on the call, then
          email you a personalized checkout link.
        </p>
        {bookUrl ? (
          <a
            href={bookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white"
          >
            Open scheduling calendar
          </a>
        ) : (
          <p className="mt-8 text-sm text-ink-soft">
            Scheduling link is being configured. Email{" "}
            <Link href="mailto:hello@998webdesigns.com" className="text-accent underline">
              hello@998webdesigns.com
            </Link>{" "}
            with your availability.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
