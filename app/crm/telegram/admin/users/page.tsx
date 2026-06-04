import { redirect } from "next/navigation";
import { CrmTelegramAdminUsers } from "@/components/crm/CrmTelegramAdminUsers";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function CrmTelegramAdminUsersPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  return <CrmTelegramAdminUsers />;
}
