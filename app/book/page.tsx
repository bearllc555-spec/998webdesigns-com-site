import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BookDiscoveryForm } from "@/components/discovery/BookDiscoveryForm";
import { withSiteSeo } from "@/lib/site-origin";

export const metadata: Metadata = withSiteSeo("/book", {
  title: "Book a discovery call - 998 web designs",
  description:
    "Verify your phone, book a discovery call, then get a personalized checkout link. Custom websites from $5,998.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Book a discovery call - 998 web designs",
  },
});

export default function BookPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <BookDiscoveryForm />
      </main>
      <Footer />
    </div>
  );
}
