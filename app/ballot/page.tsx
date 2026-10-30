"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Frame } from "@/components/Frame";
import { BallotList } from "@/components/BallotList";
import { buildBallot, nextElection, proposals, unsupportedSelections } from "@/lib/data";
import { pollSiteUrl } from "@/lib/geo/places";
import { resolveDistricts } from "@/lib/resolveDistricts";
import { useHomeAddress, useSelectedDistricts } from "@/lib/storage";
import { useElectionNow } from "@/components/ElectionClock";
import { electionState } from "@/lib/election";
import { Countdown } from "@/components/Countdown";

export default function BallotPage() {
  const [selected, , hydrated] = useSelectedDistricts();
  const [home, , homeHydrated] = useHomeAddress();
  const races = useMemo(
    () => buildBallot(resolveDistricts(selected)),
    [selected],
  );
  // Districts saved before we limited coverage to the five boroughs.
  const unsupported = useMemo(() => unsupportedSelections(selected), [selected]);
  const { archived } = electionState(useElectionNow());
  const next = nextElection();
  const isPrimary = next.id === "primary-day";

  if (!hydrated || !homeHydrated) {
    return (
      <Frame>
        <p className="stamp text-muted">LOADING…</p>
      </Frame>
    );
  }

  const hasDistrictRaces = races.some((r) => r.district.type !== "statewide");
  const sampleBallot =
    home?.houseNumber && home.street
      ? pollSiteUrl({
          houseNumber: home.houseNumber,
          street: home.street,
          zip: home.zip,
        })
      : "https://findmypollsite.vote.nyc/";

  return (
    <Frame back={{ href: "/onboarding", label: "EDIT DISTRICTS" }}>
      <section className="pt-2">
        <p className="stamp text-ember">YOUR INDEPENDENT GUIDE</p>
        <h1 className="poster mt-3 text-6xl">
          {races.length} RACES.
          <br />
          IN YOUR GUIDE.
        </h1>
        {home && (
          <p className="mt-3 text-sm text-muted">
            FOR {home.label.toUpperCase()} ·{" "}
            <Link href="/onboarding" className="text-ink underline">
              CHANGE
            </Link>
          </p>
        )}
        {!archived && <div className="mt-5 flex items-center gap-3 border-l-4 border-ember pl-4">
          <Countdown date={next.date} compact />
          <span className="stamp text-muted">
            UNTIL {isPrimary ? "PRIMARY" : "POLLS CLOSE"}
          </span>
        </div>}
      </section>

      <aside className="mt-5 border-[3px] border-ink p-4 text-sm" aria-label="Guide coverage and official verification">
        <p className="font-bold">Independent guide, not your official sample ballot.</p>
        <p className="mt-2">Civil Court judges and special local contests may be missing. An address match identifies districts; it does not verify your registration, eligibility, or every contest.</p>
        <a href={sampleBallot} target="_blank" rel="noreferrer" className="mt-3 inline-block font-bold underline">Verify my official sample ballot and poll sites →</a>
      </aside>

      <hr className="rule-thick my-8" />

      {races.length === 0 ? (
        <p className="text-base text-ink/85">
          No races yet — pick your districts to build your ballot.{" "}
          <Link href="/onboarding" className="font-bold underline">
            Start here →
          </Link>
        </p>
      ) : (
        <BallotList races={races} proposalCount={proposals.length} />
      )}

      {unsupported.length > 0 && (
        <p className="mt-4 border-l-4 border-ember bg-ember/10 p-3 text-sm">
          We don&apos;t have a ballot for{" "}
          {unsupported.map((d) => d.name).join(", ")} — Ballot NYC covers the
          five boroughs.{" "}
          <a
            href="https://voterlookup.elections.ny.gov/"
            target="_blank"
            rel="noreferrer"
            className="font-bold underline"
          >
            NY State voter lookup →
          </a>
        </p>
      )}

      {!hasDistrictRaces && races.length > 0 && (
        <p className="mt-6 text-sm text-muted">
          Add your address to see your Congress, State Senate, and Assembly
          races too.{" "}
          <Link href="/onboarding" className="font-bold underline">
            Add it →
          </Link>
        </p>
      )}

      <hr className="rule-thin my-10" />

      <section className="space-y-4">
        <p className="stamp text-muted">NEXT</p>
        <h2 className="poster text-4xl">
          NOT SURE WHO
          <br />
          TO PICK?
        </h2>
        <p className="text-base text-ink/90">
          Answer 7 questions. See where your views line up with candidates
          whose positions we&apos;ve sourced.
        </p>
        <Link
          href="/quiz"
          className="inline-flex w-full items-center justify-center border-[3px] border-ink bg-ember px-6 py-5 text-paper no-underline"
        >
          <span className="poster text-3xl">TAKE THE MATCH QUIZ →</span>
        </Link>
        <Link
          href="/plan"
          className="block text-center text-sm font-semibold underline-offset-4 hover:underline"
        >
          Or jump to my voting plan
        </Link>
      </section>
    </Frame>
  );
}
