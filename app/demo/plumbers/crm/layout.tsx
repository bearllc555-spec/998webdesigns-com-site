import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Metro Plumbing demo CRM" },
  robots: { index: false, follow: false },
};

export default function PlumbingCrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-y-auto bg-bg text-ink">
      {children}
    </div>
  );
}
