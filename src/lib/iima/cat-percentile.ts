interface ScorePercentileAnchor {
  score: number;
  percentile: number;
}

// CAT 2025 planning anchors synthesized from published post-exam estimates.
// The official scorecard percentile remains authoritative.
export const CAT_2025_OVERALL_PERCENTILE_ANCHORS: ScorePercentileAnchor[] = [
  { score: 0, percentile: 0 },
  { score: 10, percentile: 20 },
  { score: 20, percentile: 50 },
  { score: 29, percentile: 70 },
  { score: 31, percentile: 75 },
  { score: 36, percentile: 80 },
  { score: 42.5, percentile: 85 },
  { score: 48.5, percentile: 90 },
  { score: 59, percentile: 95 },
  { score: 71, percentile: 98 },
  { score: 80.5, percentile: 99 },
  { score: 89, percentile: 99.5 },
  { score: 106, percentile: 99.9 },
  { score: 130, percentile: 99.99 },
  { score: 204, percentile: 100 },
];

export function estimateCat2025OverallPercentile(overallScaledScore: number): number {
  const score = Math.min(204, Math.max(0, overallScaledScore));
  const upperIndex = CAT_2025_OVERALL_PERCENTILE_ANCHORS.findIndex(
    (anchor) => score <= anchor.score,
  );
  if (upperIndex <= 0) return CAT_2025_OVERALL_PERCENTILE_ANCHORS[0].percentile;
  const upper = CAT_2025_OVERALL_PERCENTILE_ANCHORS[upperIndex];
  const lower = CAT_2025_OVERALL_PERCENTILE_ANCHORS[upperIndex - 1];
  const progress = (score - lower.score) / (upper.score - lower.score);
  return Number((lower.percentile + progress * (upper.percentile - lower.percentile)).toFixed(2));
}

export function estimateCat2025OverallScaledScore(overallPercentile: number): number {
  const percentile = Math.min(100, Math.max(0, overallPercentile));
  const upperIndex = CAT_2025_OVERALL_PERCENTILE_ANCHORS.findIndex(
    (anchor) => percentile <= anchor.percentile,
  );
  if (upperIndex <= 0) return CAT_2025_OVERALL_PERCENTILE_ANCHORS[0].score;
  const upper = CAT_2025_OVERALL_PERCENTILE_ANCHORS[upperIndex];
  const lower = CAT_2025_OVERALL_PERCENTILE_ANCHORS[upperIndex - 1];
  const progress = (percentile - lower.percentile) / (upper.percentile - lower.percentile);
  return Number((lower.score + progress * (upper.score - lower.score)).toFixed(2));
}

// Sectional score is a planning estimate because CAT does not publish a fixed
// percentile-to-score conversion. Dividing the equivalent overall score by
// three keeps all section estimates on the same 204-point total-score basis.
export function estimateCat2025SectionScaledScore(sectionPercentile: number): number {
  return Number((estimateCat2025OverallScaledScore(sectionPercentile) / 3).toFixed(2));
}
