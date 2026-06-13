import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { PrivacyContent } from "./PrivacyContent";

export const metadata: Metadata = {
  title: "Privacy Policy - 998 web designs",
  description: "Privacy policy for 998 web designs",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <PrivacyContent />
      <Footer />
    </div>
  );
}

