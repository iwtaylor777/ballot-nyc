import type { Metadata, Viewport } from "next";
import { Big_Shoulders_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Big_Shoulders_Display({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ballot-nyc.vercel.app"),
  title: "Ballot NYC — What's on your ballot Nov 3",
  description:
    "Your personalized NYC ballot for November 3, 2026. Drop your address, see your races.",
  openGraph: {
    title: "Ballot NYC — What's on your ballot Nov 3",
    description:
      "Your personalized NYC ballot for November 3, 2026. Drop your address, see your races.",
    url: "/",
    siteName: "Ballot NYC",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ballot NYC — What's on your ballot Nov 3",
    description:
      "Your personalized NYC ballot for November 3, 2026. Drop your address, see your races.",
  },
};

export const viewport: Viewport = {
  themeColor: "#f2ede3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
