"use client";

import Link from "next/link";
import { Frame } from "@/components/Frame";
import { Countdown } from "@/components/Countdown";
import { electionDates, ELECTION, electionState, deadlineStatus } from "@/lib/election";
import { useElectionNow } from "@/components/ElectionClock";
import { downloadICS } from "@/lib/ics";

const FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default function DatesPage() {
  const now = useElectionNow();
  const { archived } = electionState(now);
  const upcoming = electionDates.filter((d) => deadlineStatus(d, now) !== "passed");

  return (
    <Frame back={{ href: "/", label: "HOME" }}>
      <section className="pt-2">
        <p className="stamp text-ember">DEADLINES</p>
        <h1 className="poster mt-3 text-6xl">
          DON&apos;T
          <br />
          MISS IT.
        </h1>
        {!archived && <div className="mt-6">
          <p className="stamp text-muted">
            UNTIL POLLS CLOSE
          </p>
          <div className="mt-2">
            <Countdown date={ELECTION.day} />
          </div>
        </div>}
        <p className="mt-4 text-sm">Dates are evaluated in America/New_York. Passed deadlines remain below for reference. <a href={ELECTION.source} className="underline">Official registration and address-change rules</a>; <a href={ELECTION.hoursSource} className="underline">voting hours</a>.</p>
      </section>

      <hr className="rule-thick my-8" />

      <ol className="space-y-0 border-t-[3px] border-ink">
        {electionDates.map((d) => {
          const status = deadlineStatus(d, now);
          const isNextElection = d.id === "election-day" && status !== "passed";
          return (
            <li
              key={d.id}
              className={[
                "border-b-[3px] border-ink py-5",
                isNextElection ? "bg-ember/10" : "",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="stamp text-muted">
                  {FORMAT.format(new Date(d.date))}
                </span>
                <span className="text-sm font-semibold">{status === "passed" ? "PASSED" : status === "today" ? "TODAY" : "UPCOMING"}</span>
                {isNextElection && (
                  <span className="stamp bg-ember px-2 py-1 text-paper">
                    THE DAY
                  </span>
                )}
              </div>
              <h2
                className={[
                  "poster mt-1 text-3xl",
                  isNextElection ? "text-ember" : "",
                ].join(" ")}
              >
                {d.label}
              </h2>
              {d.note && (
                <p className="mt-2 text-sm text-muted">{d.note}</p>
              )}
              {d.actionUrl && (
                <a
                  href={d.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-ink underline"
                >
                  Official details: {d.label} →
                </a>
              )}
            </li>
          );
        })}
      </ol>

      <hr className="rule-thin my-8" />

      {upcoming.length > 0 && <button
        onClick={() => downloadICS(upcoming)}
        className="w-full bg-ink px-6 py-5 text-paper"
      >
        <span className="poster text-2xl">ADD REMAINING DATES TO CALENDAR ↓</span>
      </button>}

      <Link
        href="/plan"
        className="mt-3 inline-flex w-full items-center justify-center border-[3px] border-ink bg-paper px-6 py-5 text-ink no-underline"
      >
        <span className="poster text-2xl">MAKE MY PLAN →</span>
      </Link>
    </Frame>
  );
}
