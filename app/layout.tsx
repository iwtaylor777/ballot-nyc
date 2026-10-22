import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { JsonLd } from "@/components/JsonLd";
import { organizationLd, websiteLd } from "@/lib/seo";

// Google retired "Big Shoulders Display"; "Big Shoulders" is its successor.
const display = Big_Shoulders({
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

const SHARE_TITLE = "Ballot NYC — What's on your ballot.";
const SHARE_DESCRIPTION =
  "Your personalized NYC ballot. Drop your address, see your races.";

export const metadata: Metadata = {
  metadataBase: new URL("https://ballotnyc.org"),
  title: SHARE_TITLE,
  description: SHARE_DESCRIPTION,
  applicationName: "Ballot NYC",
  category: "politics",
  authors: [{ name: "Ian Taylor" }],
  // Search Console / Bing Webmaster verification, set in Vercel env when ready.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    url: "/",
    siteName: "Ballot NYC",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#f2ede3",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">
        {children}
        <JsonLd data={[organizationLd(), websiteLd()]} />
        <Analytics />
      </body>
    </html>
  );
}
