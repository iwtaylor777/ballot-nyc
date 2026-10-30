import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { electionEventsLd } from "@/lib/seo";

const title = "NYC voting deadlines 2026: registration, early voting, mail ballots · Ballot NYC";
const description =
  "2026 NYC election deadlines: new registration, address-change processing, early voting, mail ballots, and Election Day hours. Passed dates are labeled; check official guidance for your situation.";

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
