import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { HostingManageForm } from "@/components/HostingManageForm";

export const metadata: Metadata = {
  title: "Manage hosting billing - 998 web designs",
  description:
    "Month-to-month hosting clients: request a secure link to update payment method or cancel hosting via Stripe.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Manage hosting billing - 998 web designs",
    description:
      "Request a secure one-time link to Stripe billing portal for month-to-month hosting.",
    url: "https://998webdesigns.com/hosting/manage",
  },
};

export default function HostingManagePage() {
  return (
    <div className="min-h-screen bg-bg">
      <Nav />
      <main id="main">
        <Suspense fallback={null}>
          <HostingManageForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
