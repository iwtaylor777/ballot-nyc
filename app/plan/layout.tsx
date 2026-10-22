import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { FAQ } from "@/lib/faq";
import { abs, faqLd } from "@/lib/seo";

const title = "How to vote in NYC on Nov 3, 2026: voting plan & FAQs · Ballot NYC";
const description =
  "Three steps to vote in New York City on Nov 3, 2026 — register, know your races, pick early voting, Election Day or mail — plus answers on voter ID, moving, poll hours and fusion voting.";

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
      <JsonLd data={faqLd(FAQ, abs("/plan"))} />
      {children}
    </>
  );
}
