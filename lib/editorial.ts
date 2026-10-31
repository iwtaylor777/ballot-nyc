/** Dates record actual work, not a recurring freshness timestamp. */
export const EDITORIAL = {
  guidanceReviewed: "2026-10-30",
  methodologyReviewed: "2026-10-30",
  interfaceUpdated: "2026-10-30",
  discoveryUpdated: "2026-10-31",
  priorContentUpdated: "2026-10-22",
  // No claim-by-claim review dates have been recorded in the supplied dataset.
  candidateReview: null,
  proposalReview: null,
} as const;
