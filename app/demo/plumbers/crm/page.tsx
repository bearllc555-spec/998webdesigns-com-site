import { redirect } from "next/navigation";
import { PlumbingCrmDashboard } from "@/components/demo/PlumbingCrmDashboard";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function PlumbingCrmPage() {
  if (!(await isCrmAuthenticated())) {
    redirect("/crm/login?next=/demo/plumbers/crm");
  }
  return <PlumbingCrmDashboard />;
}
