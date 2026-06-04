import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata: Metadata = {
  title: { absolute: "LinkedIn banner preview — 998 webdesigns" },
  robots: { index: false, follow: false },
};

export default function TempLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${bricolage.variable} fixed inset-0 z-40 overflow-auto`}>
      {children}
    </div>
  );
}
