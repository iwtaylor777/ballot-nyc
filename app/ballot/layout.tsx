import type { Metadata } from "next";

const title = "Your ballot · Ballot NYC";
const description =
  "An independent guide to covered races on your Nov 3, 2026 NYC ballot. Verify all contests on your official sample ballot.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ballot" },
  // Personal, device-stored page with no content for crawlers; keep it out
  // of search results but let them follow its links.
  robots: { index: false, follow: true },
  openGraph: { title, description, url: "/ballot" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
