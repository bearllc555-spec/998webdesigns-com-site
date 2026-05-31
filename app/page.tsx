import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ValueProps } from "@/components/ValueProps";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { LeadForm } from "@/components/LeadForm";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
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
