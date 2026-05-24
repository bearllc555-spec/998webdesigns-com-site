import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
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
  title: "998 web designs — custom site design for $998",
  description:
    "Handcrafted custom site design for small businesses — $998 flat. Delivered in 5–7 business days. First month hosting free; $98/mo or $1,799 lifetime after that.",
  metadataBase: new URL("https://998webdesigns.com"),
  openGraph: {
    title: "998 web designs — custom site design for $998",
    description:
      "Handcrafted custom site design for $998. Delivered in 5–7 business days. Hosting separate after a free first month.",
    url: "https://998webdesigns.com",
    siteName: "998 web designs",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "998 web designs — custom site design for $998",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "998 web designs — custom site design for $998",
    description:
      "Handcrafted custom site design for $998. Delivered in 5–7 business days.",
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geist.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-ink">{children}</body>
    </html>
  );
}
