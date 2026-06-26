import { AestheticsCrmDashboard } from "@/components/demo/aesthetics/AestheticsCrmDashboard";
import { AestheticsCrmLoginShell } from "@/components/demo/aesthetics/AestheticsCrmLoginShell";
import { isAestheticsDemoCrmAuthenticated } from "@/lib/aesthetics-demo-crm/session";

export default async function WellnessCrmPage() {
  if (!(await isAestheticsDemoCrmAuthenticated("wellness"))) {
    return <AestheticsCrmLoginShell brand="wellness" />;
  }
  return <AestheticsCrmDashboard brand="wellness" />;
}
