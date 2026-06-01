import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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
  title: "998 web designs — handcrafted websites for small businesses. $998 once.",
  description:
    "A handcrafted custom website for small businesses. $998 once. Delivered in 5–7 business days. No agencies, no retainers, no surprises.",
  metadataBase: new URL("https://998webdesigns.com"),
  openGraph: {
    title: "998 web designs — handcrafted websites for small businesses",
    description:
      "A handcrafted custom website for $998. Delivered in 5–7 business days. No agencies, no retainers, no surprises.",
    url: "https://998webdesigns.com",
    siteName: "998 web designs",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-ink">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
