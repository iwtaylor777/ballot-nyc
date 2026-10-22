import type { Metadata } from "next";

const title = "What's on my ballot? Look up your NYC ballot by address · Ballot NYC";
const description =
  "Type your NYC address to see every race and proposal on your Nov 3, 2026 ballot: Governor, Congress, State Senate, Assembly, State Supreme Court and the five city Charter proposals.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/onboarding" },
  openGraph: { title, description, url: "/onboarding" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
