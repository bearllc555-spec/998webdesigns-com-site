import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { PortfolioSection } from "@/components/PortfolioSection";
import { ValueProps } from "@/components/ValueProps";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { LeadForm } from "@/components/LeadForm";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/", {});

export default function Home() {
  return (
    <>
      <JsonLd />
      <Nav />
      <main id="main">
        <Hero />
        <PortfolioSection />
        <ValueProps />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <LeadForm />
      </main>
      <Footer />
    </>
  );
}
