export function logisticProbability(score: number, benchmark: number, slope: number): number {
  return 1 / (1 + Math.exp(-slope * (score - benchmark)));
}

export function weightedBenchmark(
  points: Array<{ benchmark: number; weight: number }>,
): number | null {
  const totalWeight = points.reduce((sum, point) => sum + point.weight, 0);
  if (points.length === 0 || totalWeight <= 0) return null;
  return points.reduce((sum, point) => sum + point.benchmark * point.weight, 0) / totalWeight;
}

export const IIMB_UG_PROBABILITY_DISABLED = {
  status: "DISABLED" as const,
  value: null,
  explanation: "Probability is disabled because the UG programme does not yet have sufficient verified multi-cycle calibration data.",
};

