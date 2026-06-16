import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { LeadForm } from "@/components/LeadForm";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/start", {
  title: "Start your site - 998 web designs",
  description:
    "Tell us about your business in five short steps. Custom website from $5,998, delivered in 7 business days.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Start your site - 998 web designs",
    description:
      "Tell us about your business in five short steps. Custom website from $5,998, delivered in 7 business days.",
  },
});

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ promo?: string }>;
}) {
  const params = await searchParams;
  const initialPromo = typeof params.promo === "string" ? params.promo : "";

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <LeadForm initialPromo={initialPromo} />
      </main>
      <Footer />
    </div>
  );
}
