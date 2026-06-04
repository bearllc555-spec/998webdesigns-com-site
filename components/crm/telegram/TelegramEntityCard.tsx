import type { ReactNode } from "react";

const CARD_CLASS = "rounded-2xl border border-rule bg-bg p-5 shadow-sm";

type TelegramEntityCardProps = {
  kind: string;
  title: string;
  children: ReactNode;
};

export function TelegramEntityCard({ kind, title, children }: TelegramEntityCardProps) {
  return (
    <li className={CARD_CLASS}>
      <p className="text-xs font-medium uppercase tracking-wider text-slate">{kind}</p>
      <p className="mt-1 font-display text-xl font-medium text-ink">{title}</p>
      <div className="mt-2 space-y-1 text-sm text-ink-soft">{children}</div>
    </li>
  );
}
