"use client";

import Link from "next/link";
import { CrmTelegramShell } from "@/components/crm/telegram/CrmTelegramShell";
import { useCrmTelegramStatus } from "@/components/crm/telegram/useCrmTelegramStatus";

const OPTIONS = [
  {
    href: "/crm/telegram/admin/bot",
    title: "Configure Bot",
    description: "BotFather token and connection test",
  },
  {
    href: "/crm/telegram/admin/users",
    title: "Add / Edit / Delete Users",
    description: "Manage who receives alert messages",
  },
] as const;

export function CrmTelegramAdminMenu() {
  const { loading, error, message, load } = useCrmTelegramStatus();

  return (
    <CrmTelegramShell
      title="Telegram Admin"
      subtitle="Choose a configuration screen"
      backHref="/crm/telegram"
      backLabel="Telegram"
      loading={loading}
      error={error}
      message={message}
      onRefresh={load}
    >
      <ul className="grid gap-4 sm:grid-cols-1">
        {OPTIONS.map((opt) => (
          <li key={opt.href}>
            <Link
              href={opt.href}
              className="block rounded-2xl border border-rule bg-bg p-6 shadow-sm transition hover:border-accent/50 hover:shadow-md"
            >
              <h2 className="font-display text-xl font-medium text-ink">{opt.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{opt.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </CrmTelegramShell>
  );
}
