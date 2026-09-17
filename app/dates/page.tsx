"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Frame } from "@/components/Frame";
import { Countdown } from "@/components/Countdown";
import { keyDates, nextElection } from "@/lib/data";
import { isOnOrBefore } from "@/lib/nyTime";
import { downloadICS } from "@/lib/ics";

const FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export default function DatesPage() {
  const next = nextElection();
  const isPrimary = next.id === "primary-day";
  // Keep each deadline listed through the end of its day, Eastern time
  // (UTC midnight + 29h ≈ midnight ET), so Election Day stays on the list
  // while polls are still open.
  // `now` is only known after mount (the page is pre-rendered), so the first
  // render lists every date and then drops the ones already past in New York.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    // Re-check on the hour so an open page doesn't show a passed deadline.
    const id = setInterval(() => setNow(Date.now()), 600_000);
    return () => clearInterval(id);
  }, []);
  const upcoming = keyDates.filter((d) => now == null || isOnOrBefore(d.date, now));

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
          <p className="stamp text-muted">
            UNTIL {isPrimary ? "PRIMARY DAY" : "ELECTION DAY"}
          </p>
          <div className="mt-2">
            <Countdown date={next.date} />
          </div>
        </div>
      </section>

      <hr className="rule-thick my-8" />

      <ol className="space-y-0 border-t-[3px] border-ink">
        {upcoming.map((d) => {
          const isNextElection = d.id === next.id;
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
        onClick={() => downloadICS(upcoming)}
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
