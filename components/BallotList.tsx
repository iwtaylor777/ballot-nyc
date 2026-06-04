"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { BallotRace } from "@/lib/data";

export function BallotList({ races }: { races: BallotRace[] }) {
  return (
    <ol className="space-y-0 border-t-[3px] border-ink">
      {races.map((race, idx) => (
        <motion.li
          key={`${race.office.id}-${race.district.id}`}
          initial={{ opacity: 0, y: 20 }}
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
              <span className="stamp text-muted">{race.candidates.length} running</span>
            </div>
            <h3 className="poster mt-1 text-3xl text-ink">
              {race.office.title}
            </h3>
            <p className="stamp mt-1 text-muted">
              {race.district.type === "statewide"
                ? "STATEWIDE"
                : race.district.name.toUpperCase()}
            </p>
            <p className="mt-3 text-sm text-ink/85">
              <span className="font-bold">Why it matters: </span>
              {race.office.stakes[0]}
            </p>
          </Link>
        </motion.li>
      ))}
    </ol>
  );
}
