import Link from "next/link";
import { CrmLoginForm } from "@/components/crm/CrmLoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PLUMBING_CRM_VERSION } from "@/lib/plumbing-crm-version";
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
        <p className="mb-3 flex justify-center">
          <span className="rounded-full bg-rule-soft px-2 py-0.5 text-[10px] font-medium tracking-wider text-slate">
            {PLUMBING_CRM_VERSION}
          </span>
        </p>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          {PLUMBING_DEMO_BUSINESS_NAME} demo
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium">Demo CRM sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">Private — not indexed.</p>
      </div>
      <CrmLoginForm redirectTo="/demo/plumbers/crm" />
    </div>
  );
}
