import type { Metadata } from "next";

const title = "Compare NYC candidates on the issues — 2026 quiz · Ballot NYC";
const description =
  "Compare your views with sourced 2026 NYC candidate positions. Skip uncertain answers, see evidence coverage, and learn how the issue scores work.";

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
