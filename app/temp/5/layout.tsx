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

export default function TempV5Layout({ children }: { children: React.ReactNode }) {
  return <div className={`${inter.variable} ${geist.variable}`}>{children}</div>;
}
