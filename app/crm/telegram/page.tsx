import { redirect } from "next/navigation";
import { CrmTelegramPanel } from "@/components/crm/CrmTelegramPanel";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function CrmTelegramPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  return <CrmTelegramPanel />;
}
