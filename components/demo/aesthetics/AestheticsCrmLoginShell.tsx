import Link from "next/link";
import { AestheticsCrmLoginForm } from "@/components/demo/aesthetics/AestheticsCrmLoginForm";
import { SiteVersionPill } from "@/components/SiteVersionPill";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";

type AestheticsCrmLoginShellProps = {
  brand: AestheticsDemoBrand;
};

export function AestheticsCrmLoginShell({ brand }: AestheticsCrmLoginShellProps) {
  const config = getDemoBrandConfigByVertical(brand);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <div className="relative border-b border-rule px-5 py-4">
        <div className="absolute right-5 top-4 z-10">
          <Link
            href={config.demoRoute}
            className="rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-accent hover:text-ink"
          >
            Demo Jarvis
          </Link>
        </div>
        <div className="mx-auto max-w-lg pt-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
            {config.brandName} demo
          </p>
          <h1 className="mt-2 flex flex-wrap items-center justify-center gap-2 font-display text-3xl font-medium">
            CRM sign in
            <SiteVersionPill />
          </h1>
          <p className="mt-2 text-sm text-ink-soft">Private demonstration — not indexed.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-6 text-center text-sm text-ink-soft">
        Dedicated demo CRM with leads, appointments, texts, emails, and Jarvis conversations —
        populated with fictional activity that updates live during sales demos.
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-10">
        <AestheticsCrmLoginForm brand={brand} />
      </div>
    </div>
  );
}
