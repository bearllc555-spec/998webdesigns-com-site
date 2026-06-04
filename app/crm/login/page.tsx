import { redirect } from "next/navigation";
import { CrmLoginForm } from "@/components/crm/CrmLoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isCrmAuthenticated } from "@/lib/crm-session";
import { CRM_VERSION } from "@/lib/crm-version";

export default async function CrmLoginPage() {
  if (await isCrmAuthenticated()) {
    redirect("/crm");
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-12">
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <p className="mb-3 flex justify-center">
          <span className="rounded-full bg-rule-soft px-2 py-0.5 text-[10px] font-medium tracking-wider text-slate">
            {CRM_VERSION}
          </span>
        </p>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          998 web designs
        </p>
        <h1 className="mt-2 font-display text-3xl font-medium">CRM sign in</h1>
        <p className="mt-2 text-sm text-ink-soft">Private — not indexed.</p>
      </div>
      <CrmLoginForm />
    </div>
  );
}
