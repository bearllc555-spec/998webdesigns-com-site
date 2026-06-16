import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AddonSummaryBar } from "@/components/AddonSummaryBar";
import { SkipLink } from "@/components/SkipLink";
import { VoiceDemoWidgetGate } from "@/components/VoiceDemo/VoiceDemoWidgetGate";
import { SITE_ORIGIN, siteUrl } from "@/lib/site-origin";
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
  title: "998 web designs - growth systems for local businesses. Sites from $5,998.",
  description:
    "We build growth systems for local service businesses - handcrafted websites from $5,998, delivered in 7 business days. Stack SEO, automation, and AI add-ons when you are ready.",
  metadataBase: new URL(SITE_ORIGIN),
  openGraph: {
    title: "998 web designs - growth systems for local businesses",
    description:
      "Handcrafted websites from $5,998. Delivered in 7 business days. Stack SEO, chatbot, email automation, and content add-ons as you grow.",
    url: siteUrl(),
    siteName: "998 web designs",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "998 web designs - growth systems for local businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "998 web designs - growth systems for local businesses",
    description:
      "Handcrafted websites from $5,998. Delivered in 7 business days. Stack SEO, automation, and AI add-ons as you grow.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geist.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg text-ink">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SkipLink />
          {children}
          <VoiceDemoWidgetGate />
          <AddonSummaryBar />
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
