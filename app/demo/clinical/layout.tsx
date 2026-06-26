import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { LUMEN_CONFIG } from "@/lib/demo-config/lumen";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: `${LUMEN_CONFIG.brandName} - Jarvis med spa demo`,
  description: LUMEN_CONFIG.heroSub,
  robots: { index: false, follow: false },
};

export default function ClinicalDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={playfair.variable}
      style={
        {
          "--demo-ink": LUMEN_CONFIG.palette.ink,
          "--demo-bg": LUMEN_CONFIG.palette.bg,
          "--demo-accent": LUMEN_CONFIG.palette.accent,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
