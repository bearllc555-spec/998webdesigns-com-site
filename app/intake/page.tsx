import type { Metadata } from "next";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SiteForgeFilloutEmbed } from "@/components/intake/SiteForgeFilloutEmbed";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/intake", {
  title: "Free website mockup - 998 web designs",
  description:
    "Tell us about your business and get a free website mockup preview. No checkout required — we email your draft shortly.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Free website mockup - 998 web designs",
  },
});

export default function IntakePage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <div className="mx-auto max-w-xl px-5 py-16 md:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            Free mockup
          </p>
          <h1 className="mt-4 font-display text-3xl font-medium leading-tight text-ink md:text-4xl">
            Get a free website design preview
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">
            Tell us about your business. We&apos;ll build a draft preview and email it to you —
            no card, no call required.
          </p>
          <div className="mt-10 overflow-hidden rounded-md border border-rule bg-bg">
            <SiteForgeFilloutEmbed />
          </div>
          <p className="mt-8 text-sm text-slate">
            Ready to start a paid project instead?{" "}
            <Link href="/start" className="text-accent underline hover:text-accent-deep">
              Get started
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
