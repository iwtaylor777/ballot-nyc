"use client";

import { useEffect, useState } from "react";
import { keyDates } from "@/lib/data";
import { daysUntil, isOnOrBefore } from "@/lib/nyTime";
import type { KeyDate } from "@/lib/types";

const FORMAT = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

// Deadlines that change what a first-time voter must do next, in order.
const ACTIONABLE = ["register", "early-end", "election-day"];

/** "Next up: Register by Sat, Oct 24 — 37 days." Client-only (needs today's date). */
export function NextDeadline() {
  const [next, setNext] = useState<{ d: KeyDate; days: number } | null>(null);

  useEffect(() => {
    const recompute = () => {
      const now = Date.now();
      for (const id of ACTIONABLE) {
        const d = keyDates.find((k) => k.id === id);
        if (!d) continue;
        // Deadlines run to the end of that day in New York.
        if (isOnOrBefore(d.date, now)) {
          setNext({ d, days: Math.max(0, daysUntil(d.date, now)) });
          return;
        }
      }
      setNext(null);
    };
    recompute();
    // A page left open across midnight, or a phone coming back from sleep,
    // must not keep showing yesterday's deadline.
    const id = setInterval(recompute, 600_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") recompute();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  if (!next) return null;
  const { d, days } = next;
  const when =
    d.id === "early-end"
      ? "vote early"
      : days === 0
        ? "today"
        : days === 1
          ? "tomorrow"
          : `in ${days} days`;
  const label =
    d.id === "register"
      ? `Register to vote by ${FORMAT.format(new Date(d.date))}`
      : d.id === "early-end"
        ? `Early voting is open through ${FORMAT.format(new Date(d.date))}`
        : `Election Day is ${FORMAT.format(new Date(d.date))}`;

  return (
    <a
      href={d.actionUrl ?? "/dates"}
      target={d.actionUrl ? "_blank" : undefined}
      rel={d.actionUrl ? "noreferrer" : undefined}
      className="mt-4 block border-[3px] border-ink bg-emberDeep px-4 py-3 text-paper no-underline"
    >
      <span className="stamp block text-paper">NEXT DEADLINE · {when.toUpperCase()}</span>
      <span className="poster mt-1 block text-2xl">{label} →</span>
    </a>
  );
}
