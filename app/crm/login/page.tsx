import { redirect } from "next/navigation";
import { CrmLoginForm } from "@/components/crm/CrmLoginForm";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function CrmLoginPage() {
  if (await isCrmAuthenticated()) {
    redirect("/crm");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-12">
      <div className="mb-8 text-center">
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
