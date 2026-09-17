import type { Metadata } from "next";

const title = "Your ballot · Ballot NYC";
const description =
  "Every race on your Nov 3, 2026 NYC ballot.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ballot" },
  openGraph: { title, description, url: "/ballot" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
