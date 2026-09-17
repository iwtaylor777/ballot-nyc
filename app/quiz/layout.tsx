import type { Metadata } from "next";

const title = "Match quiz · Ballot NYC";
const description =
  "Answer 7 questions and see where NYC candidates' sourced positions line up with yours.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/quiz" },
  openGraph: { title, description, url: "/quiz" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
