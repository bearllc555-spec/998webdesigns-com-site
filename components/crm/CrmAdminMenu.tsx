"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CrmAdminMenu() {
  const pathname = usePathname();
  const onTelegram = pathname?.startsWith("/crm/telegram") ?? false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={`rounded-full px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
          onTelegram
            ? "bg-accent text-white hover:bg-accent-deep"
            : "border border-rule bg-bg text-ink hover:border-accent/50"
        }`}
      >
        Admin
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem] border-rule bg-bg">
        <DropdownMenuItem asChild className="cursor-pointer text-ink focus:bg-accent/10 focus:text-ink">
          <Link href="/crm/telegram">Telegram</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
