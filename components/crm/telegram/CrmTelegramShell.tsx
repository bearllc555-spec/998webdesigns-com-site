"use client";

import Link from "next/link";
import { CrmHeader } from "@/components/crm/CrmHeader";

type CrmTelegramShellProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  message?: string | null;
  children: React.ReactNode;
};

export function CrmTelegramShell({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  actions,
  loading,
  error,
  message,
  children,
}: CrmTelegramShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      <CrmHeader
        title={title}
        subtitle={subtitle}
        actions={
          <>
            {actions}
            {backHref && (
              <Link
                href={backHref}
                className="rounded-full border border-rule px-4 py-2 text-sm font-medium hover:border-accent/50"
              >
                {backLabel}
              </Link>
            )}
          </>
        }
      />

      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 pb-24 md:px-8">
        {loading && <p className="text-sm text-ink-soft">Loading…</p>}
        {error && (
          <p className="mb-4 rounded-xl border border-warn/40 bg-warn-soft/30 px-4 py-3 text-sm text-warn">
            {error}
          </p>
        )}
        {message && !error && (
          <p className="mb-4 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-ink">
            {message}
          </p>
        )}
        {!loading && children}
      </main>
    </div>
  );
}
