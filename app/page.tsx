import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { electionEventsLd, SITE_DESCRIPTION } from "@/lib/seo";
import { Frame } from "@/components/Frame";
import { ElectionSummary } from "@/components/ElectionSummary";

export const metadata: Metadata = {
  title: {
    absolute: "Ballot NYC — What's on my NYC ballot? Nov 3, 2026 nonpartisan voter guide",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function Home() {

  return (
    <>
    <JsonLd data={electionEventsLd()} />
    <Frame>
      <section className="pt-4">
        <p className="stamp text-ember">YOUR BALLOT · NEW YORK CITY · 2026</p>
        <h1 className="poster mt-3 text-[56px] min-[360px]:text-[64px] sm:text-[80px]">
          WHAT&apos;S ON<br /><span className="text-ember">YOUR BALLOT.</span>
        </h1>
        <p className="mt-4 text-base text-ink/90">Explore your NYC races and proposals. Understand what each office does before you vote.</p>
        <Link href="/onboarding" className="mt-5 inline-flex w-full items-center justify-center bg-ink px-5 py-5 text-paper no-underline">
          <span className="poster text-3xl">BUILD MY BALLOT →</span>
        </Link>
        <p className="mt-3 text-sm text-muted">Independent guide, not your official sample ballot. Covers statewide offices, Congress, State Senate, Assembly, borough Supreme Court races, and city proposals. Verify local contests with the Board of Elections.</p>
      </section>
      <nav aria-label="Explore without an address" className="mt-6 space-y-3 text-base font-semibold">
        <Link href="/judges" className="block underline">Who are the judges on my ballot? →</Link>
        <Link href="/proposals" className="block underline">2026 ballot proposals →</Link>
        <Link href="/races" className="block underline">Browse races by office or district →</Link>
      </nav>
      <hr className="rule-thin my-7" />
      <ElectionSummary />
      <hr className="rule-thin my-7" />

      <section>
        <p className="stamp text-muted">WHY THIS EXISTS</p>
        <p className="mt-3 text-base text-ink/90">
          Most of us don&apos;t know who all of our reps are or what they
          stand for. State and local elections decide your rent, your fare,
          your tuition, and whether your landlord can evict you — and the
          people running for those seats are mostly strangers. We&apos;re
          making it easy to learn. Just know a little bit more when you cast
          your vote.
        </p>
        <p className="mt-3 text-base font-semibold text-ink">
          Nonpartisan, no signup, no ads, no judgment.
        </p>
        <Link href="/partners#share" className="mt-4 inline-block underline">Share the guide with your neighbors →</Link>
      </section>
    </Frame>
    </>
  );
}
