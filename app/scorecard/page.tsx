import type { Metadata } from "next";
import { Suspense } from "react";
import { ScorecardForm } from "@/components/ScorecardForm";

export const metadata: Metadata = {
  title: "Free website scorecard — 998 Web Designs",
  description:
    "Get a free, sourced scorecard of your website's mobile speed, security, SEO and Google reviews.",
  robots: { index: true, follow: true },
};

export default function ScorecardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[70vh] bg-[#f7f6f2] px-5 py-12">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-[#6b6b66]">Loading…</p>
          </div>
        </main>
      }
    >
      <ScorecardForm />
    </Suspense>
  );
}
