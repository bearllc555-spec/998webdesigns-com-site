export const metadata = {
  title: "CRM — 998 web designs",
  robots: { index: false, follow: false },
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto overscroll-y-auto bg-bg text-ink">
      {children}
    </div>
  );
}
