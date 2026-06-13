import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Schedule your call - 998 web designs",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function SchedulePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const bookUrl = process.env.NEXT_PUBLIC_BOOK_CALL_URL?.trim();

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main" className="mx-auto max-w-xl px-5 py-16 md:py-24">
        <h1 className="font-display text-3xl font-medium text-ink md:text-4xl">Book your call</h1>
        <p className="mt-4 text-ink-soft">
          Brief received. Pick a time that works - we will walk through scope, hosting, and add-ons on
          the call, then email you a personalized checkout link.
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
            with your availability{token ? " and mention you completed the discovery brief" : ""}.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
}
