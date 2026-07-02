import type { Metadata } from "next";

const TELEGRAM_CRM_ICON = "/crm-telegram-icon.svg";

/** Override root favicons — OpenNext does not pick up nested app/icon.svg on CF. */
export const metadata: Metadata = {
  icons: {
    icon: [{ url: TELEGRAM_CRM_ICON, type: "image/svg+xml" }],
    shortcut: [{ url: TELEGRAM_CRM_ICON, type: "image/svg+xml" }],
    apple: [{ url: TELEGRAM_CRM_ICON, type: "image/svg+xml" }],
  },
};

export default function CrmTelegramLayout({ children }: { children: React.ReactNode }) {
  return children;
}
