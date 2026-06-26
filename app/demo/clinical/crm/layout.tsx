import type { Metadata } from "next";
import { LUMEN_CONFIG } from "@/lib/demo-config/lumen";

export const metadata: Metadata = {
  title: { absolute: `${LUMEN_CONFIG.brandName} demo CRM` },
  robots: { index: false, follow: false },
};

export default function ClinicalCrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-y-auto bg-bg text-ink">
      {children}
    </div>
  );
}
