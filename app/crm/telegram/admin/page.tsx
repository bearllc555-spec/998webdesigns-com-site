import { redirect } from "next/navigation";
import { CrmTelegramAdminMenu } from "@/components/crm/CrmTelegramAdminMenu";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function CrmTelegramAdminPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  return <CrmTelegramAdminMenu />;
}
