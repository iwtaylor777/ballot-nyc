import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { electionEventsLd } from "@/lib/seo";

const title = "NYC voting deadlines 2026: registration, early voting, mail ballots · Ballot NYC";
const description =
  "Every deadline for the Nov 3, 2026 NYC general election: register or update your address by Oct 24, early voting Oct 24 – Nov 1, mail ballot request and return dates, and Election Day hours (6 AM – 9 PM).";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/dates" },
  openGraph: { title, description, url: "/dates" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={electionEventsLd()} />
      {children}
    </>
  );
}
