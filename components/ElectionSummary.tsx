"use client";
import { useElectionNow } from "./ElectionClock";
import { ELECTION, electionState } from "@/lib/election";
import { Countdown } from "./Countdown";
import { NextDeadline } from "./NextDeadline";
export function ElectionSummary() {
  const { archived } = electionState(useElectionNow());
  return <section aria-label="Election timing">
    <p className="stamp text-muted">{archived ? "2026 ELECTION ARCHIVE" : "ELECTION DAY · NOV 3 · 2026"}</p>
    {!archived && <div className="mt-3"><Countdown date={ELECTION.day} /></div>}
    <NextDeadline />
    <a href={ELECTION.registrationLookup} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm underline">Check my existing registration →</a>
  </section>;
}
