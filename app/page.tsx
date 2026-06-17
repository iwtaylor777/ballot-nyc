import Link from "next/link";
import { Frame } from "@/components/Frame";
import { Countdown } from "@/components/Countdown";
import { nextElection } from "@/lib/data";

export default function Home() {
  const next = nextElection();
  const isPrimary = next.id === "primary-day";

  return (
    <Frame>
      <section className="pt-6">
        <p className="stamp text-ember">YOUR BALLOT · NEW YORK CITY</p>
        <h1 className="poster mt-3 text-[88px] sm:text-[112px]">
          WHAT&apos;S
          <br />
          ON YOUR
          <br />
          <span className="text-ember">BALLOT.</span>
        </h1>
        <p className="mt-6 text-lg font-medium text-ink/90">
          Get informed. Quick and easy.
        </p>
      </section>

      <hr className="rule-thick my-10" />

      <section>
        <p className="stamp text-muted">
          {isPrimary ? "PRIMARY DAY · JUNE 23" : "ELECTION DAY · NOV 3"}
        </p>
        <div className="mt-3">
          <Countdown date={next.date} />
        </div>
        {isPrimary && (
          <p className="mt-3 text-xs text-muted">
            Party primaries are next. The general election is Nov 3.
          </p>
        )}
      </section>

      <hr className="rule-thin my-10" />

      <section className="space-y-4">
        <h2 className="poster text-4xl">START HERE.</h2>
        <p className="text-base text-ink/90">
          Drop your address. We&apos;ll show you the exact races you&apos;ll
          vote on — and what each office actually controls in your life.
        </p>
        <Link
          href="/onboarding"
          className="mt-4 inline-flex w-full items-center justify-center bg-ink px-6 py-5 text-paper no-underline"
        >
          <span className="poster text-3xl">BUILD MY BALLOT →</span>
        </Link>
        <Link
          href="/dates"
          className="block text-center text-sm font-semibold text-ink underline-offset-4 hover:underline"
        >
          Just show me the key dates
        </Link>
      </section>

      <hr className="rule-thin my-10" />

      <section>
        <p className="stamp text-muted">WHY THIS EXISTS</p>
        <p className="mt-3 text-base text-ink/90">
          Most of us don't know who all of our reps are or what they stand for. 
          State and local elections decide your rent, your fare, your tuition, and
          whether your landlord can evict you — and the people running for
          those seats are mostly strangers. We're making it easy to learn. 
          Just know a little bit more when you cast your vote.
          
          Nonpartisan, no signup, no ads, no judgement.
        </p>
      </section>
    </Frame>
  );
}
