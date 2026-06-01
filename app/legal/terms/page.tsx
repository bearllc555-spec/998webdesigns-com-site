import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { TermsContent } from "./TermsContent";

export const metadata: Metadata = {
  title: "Terms of Service — 998 web designs",
  description: "Terms of service for 998 web designs",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <TermsContent />
      <Footer />
    </div>
  );
}

