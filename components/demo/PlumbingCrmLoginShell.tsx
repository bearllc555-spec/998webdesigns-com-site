import Link from "next/link";
import { CrmLoginForm } from "@/components/crm/CrmLoginForm";
import { SiteVersionPill } from "@/components/SiteVersionPill";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PLUMBING_DEMO_BUSINESS_NAME } from "@/lib/voice-demo-plumbing-constants";

export function PlumbingCrmLoginShell() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="absolute left-5 top-5 z-10">
        <Link
          href="/demo/plumbers"
          className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50"
        >
          Voice demo
        </Link>
      </div>
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          {PLUMBING_DEMO_BUSINESS_NAME} demo
        </p>
        <h1 className="mt-2 flex flex-wrap items-center justify-center gap-2 font-display text-3xl font-medium">
          Demo CRM sign in
          <SiteVersionPill />
        </h1>
        <p className="mt-2 text-sm text-ink-soft">Private — not indexed.</p>
      </div>
      <CrmLoginForm redirectTo="/demo/plumbers/crm" />
    </div>
  );
}
