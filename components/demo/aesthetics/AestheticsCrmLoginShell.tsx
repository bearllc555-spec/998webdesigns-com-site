import Link from "next/link";
import { AestheticsCrmLoginForm } from "@/components/demo/aesthetics/AestheticsCrmLoginForm";
import { SiteVersionPill } from "@/components/SiteVersionPill";
import type { AestheticsDemoBrand } from "@/lib/aesthetics-demo-crm/types";
import { getDemoBrandConfigByVertical } from "@/lib/demo-config";
import { brandBorder } from "@/lib/demo-config/brand-field-styles";

type AestheticsCrmLoginShellProps = {
  brand: AestheticsDemoBrand;
};

export function AestheticsCrmLoginShell({ brand }: AestheticsCrmLoginShellProps) {
  const config = getDemoBrandConfigByVertical(brand);
  const line = brandBorder(config);

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ backgroundColor: config.palette.bg, color: config.palette.ink, fontFamily: config.fonts.body }}
    >
      <header className="border-b" style={{ borderColor: line, backgroundColor: config.palette.surface }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p
              className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-[0.18em] uppercase"
              style={{ fontFamily: config.fonts.display, color: config.palette.headline }}
            >
              {config.brandName}
              <SiteVersionPill lightText />
            </p>
            <p className="text-sm font-medium" style={{ color: config.palette.accent }}>
              Demo CRM
            </p>
          </div>
          <Link
            href={config.demoRoute}
            className="rounded-full px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: config.palette.accent }}
          >
            Demo Jarvis
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-5 py-10 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em]" style={{ color: config.palette.muted }}>
          Private demo · not indexed
        </p>
        <h1
          className="mt-3 text-3xl font-semibold sm:text-4xl"
          style={{ fontFamily: config.fonts.display, color: config.palette.headline }}
        >
          CRM sign in
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed" style={{ color: config.palette.muted }}>
          Leads, appointments, texts, emails, and Jarvis conversations — fictional activity that updates live during
          sales demos.
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center px-5 pb-16">
        <div
          className="w-full max-w-sm rounded-2xl border p-6 shadow-sm sm:p-8"
          style={{
            borderColor: line,
            backgroundColor: config.palette.surface,
          }}
        >
          <AestheticsCrmLoginForm brand={brand} />
        </div>
      </div>
    </div>
  );
}
