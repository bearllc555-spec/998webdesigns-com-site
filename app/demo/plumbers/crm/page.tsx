import { PlumbingCrmDashboard } from "@/components/demo/PlumbingCrmDashboard";
import { PlumbingCrmLoginShell } from "@/components/demo/PlumbingCrmLoginShell";
import { isPlumbingDemoCrmAuthenticated } from "@/lib/plumbing-demo-crm-session";

export default async function PlumbingCrmPage() {
  if (!(await isPlumbingDemoCrmAuthenticated())) {
    return <PlumbingCrmLoginShell />;
  }
  return <PlumbingCrmDashboard />;
}
