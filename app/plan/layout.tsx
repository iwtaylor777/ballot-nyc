import type { Metadata } from "next";

const title = "Your voting plan · Ballot NYC";
const description =
  "Three steps to vote in NYC on Nov 3, 2026, plus answers to common first-time voter questions.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/plan" },
  openGraph: { title, description, url: "/plan" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
