import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SmsOptInContent } from "./SmsOptInContent";

export const metadata: Metadata = {
  title: "SMS opt-in documentation - 998 web designs",
  description:
    "How end users opt in to SMS from 998 web designs - discovery form, voice demo, and required disclosures.",
  robots: { index: true, follow: true },
};

export default function SmsOptInPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <SmsOptInContent />
      <Footer />
    </div>
  );
}
