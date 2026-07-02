import type { Metadata } from "next";
import { CrmTelegramHome } from "@/components/crm/CrmTelegramHome";

export const metadata: Metadata = {
  title: { absolute: "Telegram CRM" },
};

export default function CrmTelegramPage() {
  return <CrmTelegramHome />;
}
