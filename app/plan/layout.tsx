import type { Metadata } from "next";

const title = "How to vote in NYC on Nov 3, 2026: voting plan & FAQs · Ballot NYC";
const description =
  "Three steps to vote in New York City on Nov 3, 2026 — check registration, know your races, and check current voting options — plus answers on voter ID, moving, poll hours and fusion voting.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/plan" },
  openGraph: { title, description, url: "/plan" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
