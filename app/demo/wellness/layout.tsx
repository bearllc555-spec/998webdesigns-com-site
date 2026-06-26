import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import { WILLOW_SAGE_CONFIG } from "@/lib/demo-config/willow-sage";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: `${WILLOW_SAGE_CONFIG.brandName} - Jarvis med spa demo`,
  description: WILLOW_SAGE_CONFIG.heroSub,
  robots: { index: false, follow: false },
};

export default function WellnessDemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${fraunces.variable} ${nunito.variable}`}
      style={
        {
          "--demo-ink": WILLOW_SAGE_CONFIG.palette.ink,
          "--demo-bg": WILLOW_SAGE_CONFIG.palette.bg,
          "--demo-accent": WILLOW_SAGE_CONFIG.palette.accent,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
