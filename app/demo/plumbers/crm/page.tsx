import { PlumbingCrmDashboard } from "@/components/demo/PlumbingCrmDashboard";
import { PlumbingCrmLoginShell } from "@/components/demo/PlumbingCrmLoginShell";
import { isCrmAuthenticated } from "@/lib/crm-session";

export default async function PlumbingCrmPage() {
  if (!(await isCrmAuthenticated())) {
    return <PlumbingCrmLoginShell />;
  }
  return <PlumbingCrmDashboard />;
}
