import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { CloseCheckoutClient } from "@/components/discovery/CloseCheckoutClient";

export const metadata: Metadata = {
  title: "Your checkout — 998 web designs",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ClosePage({ searchParams }: Props) {
  const { token } = await searchParams;

  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main" className="px-5 py-16 md:py-24">
        <CloseCheckoutClient token={token ?? ""} />
      </main>
      <Footer />
    </div>
  );
}
