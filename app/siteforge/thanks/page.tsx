import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { stripe } from "@/lib/stripe";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/siteforge/thanks", {
  title: "Deposit received - 998 web designs",
  robots: { index: false, follow: false },
});

export const dynamic = "force-dynamic";

export default async function SiteforgeThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = typeof params.session_id === "string" ? params.session_id : "";

  let business = "your project";
  let previewUrl: string | null = null;

  if (sessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      business =
        session.metadata?.businessName ||
        session.customer_details?.name ||
        business;
      previewUrl = session.metadata?.previewUrl || null;
    } catch {
      // keep defaults
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main" className="mx-auto max-w-xl px-6 py-16 space-y-5">
        <h1 className="font-display text-3xl text-ink">Deposit received</h1>
        <p className="text-ink/80 leading-relaxed">
          Thanks — we recorded your deposit for <strong>{business}</strong>. We&apos;re
          building your real site from the approved concept next and will email when the draft
          is live.
        </p>
        {previewUrl ? (
          <p>
            <a
              href={previewUrl}
              className="text-accent underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Reopen your concept
            </a>
          </p>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
