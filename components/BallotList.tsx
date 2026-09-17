"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { seatsForRace, type BallotRace } from "@/lib/data";

function runningLabel(n: number, seats: number): string {
  if (n === 0) return "see who's running";
  if (n === 1) return "1 candidate";
  return seats > 1 ? `${n} running · pick ${seats}` : `${n} running`;
}

export function BallotList({
  races,
  proposalCount = 0,
}: {
  races: BallotRace[];
  proposalCount?: number;
}) {
  const reduce = useReducedMotion();
  const rows = races.length + (proposalCount > 0 ? 1 : 0);
  return (
    <ol className="space-y-0 border-t-[3px] border-ink">
      {races.map((race, idx) => (
        <motion.li
          key={`${race.office.id}-${race.district.id}`}
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.55,
            delay: idx * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="border-b-[3px] border-ink"
        >
          <Link
            href={`/race/${race.office.id}/${race.district.id}`}
            className="group block py-5 no-underline"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="poster text-7xl text-ink group-hover:text-ember">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <span className="stamp text-muted">
                {runningLabel(
                  race.candidates.length,
                  seatsForRace(race.office.id, race.district.id),
                )}
              </span>
            </div>
            <h3 className="poster mt-1 text-3xl text-ink">
              {race.office.title}
            </h3>
            <p className="stamp mt-1 text-muted">
              {race.district.type === "statewide"
                ? "STATEWIDE"
                : race.district.name.toUpperCase()}
            </p>
            {race.candidates.length > 0 && (
              <p className="mt-2 text-sm font-semibold text-ink">
                {race.candidates.map((c) => c.name).join(" · ")}
              </p>
            )}
            <p className="mt-2 text-sm text-ink/85">
              <span className="font-bold">Why it matters: </span>
              {race.office.stakes[0]}
            </p>
          </Link>
        </motion.li>
      ))}
      {proposalCount > 0 && (
        <motion.li
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.55,
            delay: races.length * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="border-b-[3px] border-ink"
        >
          <Link href="/proposals" className="group block py-5 no-underline">
            <div className="flex items-baseline justify-between gap-4">
              <span className="poster text-7xl text-ink group-hover:text-ember">
                {String(rows).padStart(2, "0")}
              </span>
              <span className="stamp text-ember">flip your ballot</span>
            </div>
            <h3 className="poster mt-1 text-3xl text-ink">
              {proposalCount} City Ballot Proposals
            </h3>
            <p className="stamp mt-1 text-muted">CITYWIDE · YES / NO</p>
            <p className="mt-2 text-sm text-ink/85">
              <span className="font-bold">Why it matters: </span>
              Changes to the City Charter — permits, contracting, street
              projects, and the City&apos;s rainy day fund.
            </p>
          </Link>
        </motion.li>
      )}
    </ol>
  );
}
