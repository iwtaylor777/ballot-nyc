"use client";

import Link from "next/link";
import { Frame } from "@/components/Frame";
import { Countdown } from "@/components/Countdown";
import { keyDates } from "@/lib/data";
import { downloadICS } from "@/lib/ics";

const FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default function DatesPage() {
  const electionDay = keyDates.find((d) => d.id === "election-day")!;

  return (
    <Frame back={{ href: "/", label: "HOME" }}>
      <section className="pt-2">
        <p className="stamp text-ember">DEADLINES</p>
        <h1 className="poster mt-3 text-6xl">
          DON&apos;T
          <br />
          MISS IT.
        </h1>
        <div className="mt-6">
          <p className="stamp text-muted">UNTIL ELECTION DAY</p>
          <div className="mt-2">
            <Countdown date={electionDay.date} />
          </div>
        </div>
      </section>

      <hr className="rule-thick my-8" />

      <ol className="space-y-0 border-t-[3px] border-ink">
        {keyDates.map((d) => {
          const isElection = d.id === "election-day";
          return (
            <li
              key={d.id}
              className={[
                "border-b-[3px] border-ink py-5",
                isElection ? "bg-ember/10" : "",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="stamp text-muted">
                  {FORMAT.format(new Date(d.date))}
                </span>
                {isElection && (
                  <span className="stamp bg-ember px-2 py-1 text-paper">
                    THE DAY
                  </span>
                )}
              </div>
              <h2
                className={[
                  "poster mt-1 text-3xl",
                  isElection ? "text-ember" : "",
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
                  className="mt-2 inline-block stamp text-ink underline"
                >
                  GO →
                </a>
              )}
            </li>
          );
        })}
      </ol>

      <hr className="rule-thin my-8" />

      <button
        onClick={() => downloadICS(keyDates)}
        className="w-full bg-ink px-6 py-5 text-paper"
      >
        <span className="poster text-2xl">ADD ALL TO CALENDAR ↓</span>
      </button>

      <Link
        href="/plan"
        className="mt-3 inline-flex w-full items-center justify-center border-[3px] border-ink bg-paper px-6 py-5 text-ink no-underline"
      >
        <span className="poster text-2xl">MAKE MY PLAN →</span>
      </Link>
    </Frame>
  );
}
