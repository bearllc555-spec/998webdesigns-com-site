import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Carousel } from "@/components/Carousel";

export const metadata: Metadata = {
  title: "Recent work — 998 web designs",
  description:
    "Client websites built by 998 web designs — local service businesses, spas, contractors, and more.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Recent work — 998 web designs",
    description:
      "Client websites built by 998 web designs — local service businesses, spas, contractors, and more.",
    url: "https://998webdesigns.com/portfolio",
  },
};

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-6xl px-5 pt-16 pb-3 md:px-8 md:pt-24 md:pb-4">
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
                Recent work
              </p>
              <h1 className="mt-4 font-display text-4xl font-medium leading-tight tracking-tight text-ink md:text-5xl">
                Sites we&apos;ve built for local businesses.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-ink-soft">
                Hover any thumbnail to preview the live site. Open a card to visit it in a new tab.
              </p>
            </div>
          </div>
          <Carousel />
        </section>
      </main>
      <Footer />
    </div>
  );
}
