import type { Metadata } from "next";
import { WILLOW_SAGE_CONFIG } from "@/lib/demo-config/willow-sage";

export const metadata: Metadata = {
  title: { absolute: `${WILLOW_SAGE_CONFIG.brandName} demo CRM` },
  robots: { index: false, follow: false },
};

export default function WellnessCrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-y-auto bg-bg text-ink">
      {children}
    </div>
  );
}
