import type { Metadata } from "next";

const title = "Key dates · Ballot NYC";
const description =
  "Registration, early voting, mail ballot, and Election Day deadlines for the Nov 3, 2026 NYC election.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/dates" },
  openGraph: { title, description, url: "/dates" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
