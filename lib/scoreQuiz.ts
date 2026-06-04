import type {
  Candidate,
  IssueTag,
  QuizAnswers,
  QuizQuestion,
} from "./types";

/**
 * Returns a 0–100 match score for a candidate given the user's answers.
 * Computed as inverse mean absolute distance on a 0–100 scale,
 * restricted to issues the user actually answered AND the candidate
 * has a stated position on.
 */
export function scoreCandidate(
  candidate: Candidate,
  answers: QuizAnswers,
  questions: QuizQuestion[],
): { match: number; overlap: number } {
  let total = 0;
  let count = 0;
  for (const q of questions) {
    const userValue = answers[q.id];
    if (userValue == null) continue;
    const position = candidate.positions.find((p) => p.tag === q.tag);
    if (!position) continue;
    total += Math.abs(userValue - position.value);
    count += 1;
  }
  if (count === 0) return { match: 0, overlap: 0 };
  const avgDistance = total / count;
  const match = Math.round(100 - avgDistance);
  return { match: Math.max(0, Math.min(100, match)), overlap: count };
}

export function rankCandidates(
  candidates: Candidate[],
  answers: QuizAnswers,
  questions: QuizQuestion[],
): Array<Candidate & { match: number; overlap: number }> {
  return candidates
    .map((c) => ({ ...c, ...scoreCandidate(c, answers, questions) }))
    .sort((a, b) => b.match - a.match);
}

export function topIssues(
  answers: QuizAnswers,
  questions: QuizQuestion[],
): IssueTag[] {
  // The "top" issues are the ones the user feels strongest about —
  // measured as distance from the neutral midpoint (50).
  const strengths = questions
    .map((q) => {
      const v = answers[q.id];
      if (v == null) return null;
      return { tag: q.tag, intensity: Math.abs(v - 50) };
    })
    .filter((x): x is { tag: IssueTag; intensity: number } => x !== null)
    .sort((a, b) => b.intensity - a.intensity);
  return strengths.slice(0, 3).map((s) => s.tag);
}
