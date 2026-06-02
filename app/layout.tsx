import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
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
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "998 web designs — handcrafted websites for small businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "998 web designs — handcrafted websites for small businesses",
    description:
      "A handcrafted custom website for $998. Delivered in 5–7 business days. No agencies, no retainers, no surprises.",
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
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
