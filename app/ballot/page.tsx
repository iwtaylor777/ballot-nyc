"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Frame } from "@/components/Frame";
import { BallotList } from "@/components/BallotList";
import { buildBallot, keyDates } from "@/lib/data";
import { resolveDistricts } from "@/lib/resolveDistricts";
import { useSelectedDistricts } from "@/lib/storage";
import { Countdown } from "@/components/Countdown";

export default function BallotPage() {
  const [selected, , hydrated] = useSelectedDistricts();
  const races = useMemo(
    () => buildBallot(resolveDistricts(selected)),
    [selected],
  );
  const electionDay = keyDates.find((d) => d.id === "election-day")!.date;

  if (!hydrated) {
    return (
      <Frame>
        <p className="stamp text-muted">LOADING…</p>
      </Frame>
    );
  }

  const hasDistrictRaces = races.some((r) => r.district.type !== "statewide");

  return (
    <Frame back={{ href: "/onboarding", label: "EDIT DISTRICTS" }}>
      <section className="pt-2">
        <p className="stamp text-ember">YOUR BALLOT</p>
        <h1 className="poster mt-3 text-6xl">
          {races.length} RACES.
          <br />
          ONE DAY.
        </h1>
        <div className="mt-5 flex items-center gap-3 border-l-4 border-ember pl-4">
          <Countdown date={electionDay} compact />
          <span className="stamp text-muted">UNTIL POLLS CLOSE</span>
        </div>
      </section>

      <hr className="rule-thick my-8" />

      {races.length === 0 ? (
        <p className="text-base text-ink/85">
          No races yet — pick your districts to build your ballot.{" "}
          <Link href="/onboarding" className="font-bold underline">
            Start here →
          </Link>
        </p>
      ) : (
        <BallotList races={races} />
      )}

      {!hasDistrictRaces && races.length > 0 && (
        <p className="mt-6 text-sm text-muted">
          Add your district selections to see your local races too.{" "}
          <Link href="/onboarding" className="font-bold underline">
            Edit →
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
          Answer 7 questions. See where your views actually line up across
          your races.
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
