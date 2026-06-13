import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Pricing } from "@/components/Pricing";
import { HOSTING_MONTHLY_PRICE_MO_LABEL } from "@/lib/hosting-policy";

const pricingDescription = `Flat $5,998 design fee. First 30 days of hosting free — then ${HOSTING_MONTHLY_PRICE_MO_LABEL} or $2,996 10-year. No tiers, no hidden fees.`;

export const metadata: Metadata = {
  title: "Pricing — 998 web designs",
  description: pricingDescription,
  robots: { index: true, follow: true },
  openGraph: {
    title: "Pricing — 998 web designs",
    description: pricingDescription,
    url: "https://998webdesigns.com/pricing",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <Pricing standalone />
        <div className="border-b border-rule bg-rule-soft/60">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between md:px-8">
            <p className="text-base text-ink-soft">
              Ready to start? The lead form takes about five minutes.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/#faq"
                className="inline-flex items-center justify-center rounded-full border border-rule px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-rule-soft"
              >
                Read FAQ
              </Link>
              <Link
                href="/start"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent transition hover:bg-accent-deep"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
