import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: "LinkedIn banner preview — 998 webdesigns" },
  robots: { index: false, follow: false },
};

export default function TempLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${geist.variable} fixed inset-0 z-40 overflow-auto`}>
      {children}
    </div>
  );
}
