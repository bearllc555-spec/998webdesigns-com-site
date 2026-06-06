import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DiscoveryIntakeForm } from "@/components/discovery/DiscoveryIntakeForm";

export const metadata: Metadata = {
  title: "Project brief — 998 web designs",
  robots: { index: false, follow: false },
};

export default function DiscoveryIntakePage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <Suspense fallback={<p className="px-5 py-16 text-ink-soft">Loading…</p>}>
          <DiscoveryIntakeForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
