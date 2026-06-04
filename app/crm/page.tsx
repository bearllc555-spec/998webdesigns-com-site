import { redirect } from "next/navigation";
import { CrmDashboard } from "@/components/crm/CrmDashboard";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function CrmPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login");
  }
  return <CrmDashboard />;
}
