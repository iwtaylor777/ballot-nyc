import type { Candidate } from "./types";

/**
 * Why a candidate has no match percentage. These are different things and the
 * results page must not blur them: we either have no research on the person,
 * or we have research that doesn't touch any question this user answered, or
 * the office isn't one a policy quiz should score at all.
 */
export type CandidateStatus =
  | "scored"
  | "no_overlap"
  | "unresearched"
  | "judicial";

export function candidateStatus(
  candidate: Pick<Candidate, "positions">,
  overlap: number,
  judicial: boolean,
): CandidateStatus {
  if (judicial) return "judicial";
  if (candidate.positions.length === 0) return "unresearched";
  return overlap > 0 ? "scored" : "no_overlap";
}

export const STATUS_LABEL: Record<Exclude<CandidateStatus, "scored">, string> = {
  no_overlap: "NOT ON YOUR ANSWERS",
  unresearched: "NO POSITIONS RESEARCHED",
  judicial: "NOT SCORED",
};

export interface CoverageCounts {
  /** Candidates on this ballot. */
  total: number;
  /** Candidates whose positions we have sourced. */
  researched: number;
  /** Of those, the ones that overlap with what this user answered. */
  comparable: number;
  /** Judicial candidates, which we never score. */
  judicial: number;
}

export function coverageCounts(
  entries: Array<{ positions: Candidate["positions"]; overlap: number; judicial: boolean }>,
): CoverageCounts {
  const counts: CoverageCounts = { total: 0, researched: 0, comparable: 0, judicial: 0 };
  for (const e of entries) {
    counts.total += 1;
    const status = candidateStatus(e, e.overlap, e.judicial);
    if (status === "judicial") counts.judicial += 1;
    if (status === "scored") {
      counts.researched += 1;
      counts.comparable += 1;
    } else if (status === "no_overlap") {
      counts.researched += 1;
    }
  }
  return counts;
}
