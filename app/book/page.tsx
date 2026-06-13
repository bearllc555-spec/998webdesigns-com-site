import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BookDiscoveryForm } from "@/components/discovery/BookDiscoveryForm";

export const metadata: Metadata = {
  title: "Book a discovery call - 998 web designs",
  description:
    "Verify your phone, complete a short brief, and book a call before checkout. Custom websites from $5,998.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Book a discovery call - 998 web designs",
    url: "https://998webdesigns.com/book",
  },
};

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
