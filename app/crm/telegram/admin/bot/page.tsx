import { redirect } from "next/navigation";
import { CrmTelegramAdminBot } from "@/components/crm/CrmTelegramAdminBot";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function CrmTelegramAdminBotPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  return <CrmTelegramAdminBot />;
}
