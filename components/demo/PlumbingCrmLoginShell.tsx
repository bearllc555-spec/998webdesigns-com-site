import Link from "next/link";
import { PlumbingCrmLoginForm } from "@/components/demo/PlumbingCrmLoginForm";
import { PlumbingDemoCrmBanner } from "@/components/demo/PlumbingDemoCrmBanner";
import { SiteVersionPill } from "@/components/SiteVersionPill";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PLUMBING_DEMO_BUSINESS_NAME } from "@/lib/voice-demo-plumbing-constants";

export function PlumbingCrmLoginShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <div className="relative border-b border-rule px-5 py-4">
        <div className="absolute left-5 top-4 z-10">
          <Link
            href="/demo/plumbers"
            className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50"
          >
            Voice demo
          </Link>
        </div>
        <div className="absolute right-5 top-4 z-10">
          <ThemeToggle />
        </div>
        <div className="mx-auto max-w-lg pt-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            {PLUMBING_DEMO_BUSINESS_NAME} demo
          </p>
          <h1 className="mt-2 flex flex-wrap items-center justify-center gap-2 font-display text-3xl font-medium">
            CRM sign in
            <SiteVersionPill />
          </h1>
          <p className="mt-2 text-sm text-ink-soft">Private demonstration — not indexed.</p>
        </div>
      </div>

      <PlumbingDemoCrmBanner />

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <PlumbingCrmLoginForm />
      </div>
    </div>
  );
}
