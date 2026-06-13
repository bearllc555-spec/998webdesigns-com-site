import Link from "next/link";
import { redirect } from "next/navigation";
import { CrmLoginForm } from "@/components/crm/CrmLoginForm";
import { SiteVersionPill } from "@/components/SiteVersionPill";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isCrmAuthenticated } from "@/lib/crm-session";

function safeNextPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/crm/login")) {
    return "/crm";
  }
  return raw;
}

type Props = { searchParams: Promise<{ next?: string }> };

export default async function CrmLoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  if (await isCrmAuthenticated()) {
    redirect(safeNextPath(next));
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-12">
      <div className="absolute left-5 top-5 z-10">
        <Link
          href="/"
          className="rounded-full border border-rule px-4 py-2 text-sm text-ink-soft hover:border-accent/50"
        >
          Home
        </Link>
      </div>
      <div className="absolute right-5 top-5 z-10">
        <ThemeToggle />
      </div>
      <div className="mb-8 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
          998 web designs
        </p>
        <h1 className="mt-2 flex flex-wrap items-center justify-center gap-2 font-display text-3xl font-medium">
          CRM sign in
          <SiteVersionPill />
        </h1>
        <p className="mt-2 text-sm text-ink-soft">Private - not indexed.</p>
      </div>
      <CrmLoginForm />
    </div>
  );
}
