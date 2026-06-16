import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PortfolioSection } from "@/components/PortfolioSection";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/portfolio", {
  title: "Recent work - 998 web designs",
  description:
    "Client websites built by 998 web designs - local service businesses, spas, contractors, and more.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Recent work - 998 web designs",
    description:
      "Client websites built by 998 web designs - local service businesses, spas, contractors, and more.",
  },
});

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <PortfolioSection showIntro headingLevel="h1" />
      </main>
      <Footer />
    </div>
  );
}
