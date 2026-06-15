import type {
  Candidate,
  IssueTag,
  QuizAnswers,
  QuizQuestion,
} from "./types";

const PRIORITY_WEIGHT = 2;
const BASELINE_WEIGHT = 1;

/**
 * Returns a 0–100 match score for a candidate given the user's answers
 * and (optionally) their hand-picked priority issues.
 *
 * Issues the user flagged as priorities count twice as much as the rest.
 * `overlap` is the raw number of issues compared — surfaced so callers can
 * show users how much signal the score is built on.
 */
export function scoreCandidate(
  candidate: Candidate,
  answers: QuizAnswers,
  questions: QuizQuestion[],
  priorities: IssueTag[] = [],
): { match: number; overlap: number } {
  const prioritySet = new Set(priorities);
  let weightedDistance = 0;
  let totalWeight = 0;
  let overlap = 0;

  for (const q of questions) {
    const userValue = answers[q.id];
    if (userValue == null) continue;
    const position = candidate.positions.find((p) => p.tag === q.tag);
    if (!position) continue;
    const weight = prioritySet.has(q.tag) ? PRIORITY_WEIGHT : BASELINE_WEIGHT;
    weightedDistance += weight * Math.abs(userValue - position.value);
    totalWeight += weight;
    overlap += 1;
  }

  if (totalWeight === 0) return { match: 0, overlap: 0 };
  const avgDistance = weightedDistance / totalWeight;
  const match = Math.round(100 - avgDistance);
  return { match: Math.max(0, Math.min(100, match)), overlap };
}

export function rankCandidates(
  candidates: Candidate[],
  answers: QuizAnswers,
  questions: QuizQuestion[],
  priorities: IssueTag[] = [],
): Array<Candidate & { match: number; overlap: number }> {
  return candidates
    .map((c) => ({ ...c, ...scoreCandidate(c, answers, questions, priorities) }))
    .sort((a, b) => b.match - a.match);
}

/**
 * The user's "top issues" — their hand-picked priorities if they set them,
 * otherwise a sensible default derived from quiz intensity. We surface
 * these in the share card and on the results page.
 */
export function topIssues(
  answers: QuizAnswers,
  questions: QuizQuestion[],
  priorities: IssueTag[] = [],
): IssueTag[] {
  if (priorities.length > 0) return priorities.slice(0, 3);
  return suggestPriorities(answers, questions);
}

/**
 * Picks 3 default priorities from the user's quiz answers — the issues
 * they answered most strongly (distance from neutral). Used to pre-fill
 * the priorities picker so the user has something to react to instead of
 * a blank slate.
 */
export function suggestPriorities(
  answers: QuizAnswers,
  questions: QuizQuestion[],
): IssueTag[] {
  const seen = new Set<IssueTag>();
  return questions
    .map((q) => {
      const v = answers[q.id];
      if (v == null) return null;
      if (seen.has(q.tag)) return null;
      seen.add(q.tag);
      return { tag: q.tag, intensity: Math.abs(v - 50) };
    })
    .filter((x): x is { tag: IssueTag; intensity: number } => x !== null)
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 3)
    .map((s) => s.tag);
}
