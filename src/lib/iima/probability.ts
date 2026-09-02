import type {
  HistoricalFinalBenchmarkPoint,
  IimaPolicyConfig,
  PredictionBand,
} from "@/types/iima";

export function logisticProbability(score: number, target: number, slope: number): number {
  return 1 / (1 + Math.exp(-slope * (score - target)));
}

export function calculateSeatProbability(args: {
  eligibilityGate: boolean;
  callGate: boolean;
  finalCompositeScore: number;
  planningTarget: number;
  logisticSlope: number;
}): number {
  if (!args.eligibilityGate || !args.callGate) return 0;
  return logisticProbability(
    args.finalCompositeScore,
    args.planningTarget,
    args.logisticSlope,
  );
}

/**
 * Smooths the unpublished current-cycle boundary over multiple completed
 * cycles. This keeps the mandated logistic model while reducing dependence on
 * any single historical minimum FCS.
 */
export function calculateCalibratedSeatProbability(args: {
  eligibilityGate: boolean;
  callGate: boolean;
  finalCompositeScore: number;
  benchmarks: HistoricalFinalBenchmarkPoint[];
  safetyMargin: number;
  logisticSlope: number;
  recencyWeights: number[];
}) {
  if (args.benchmarks.length === 0) {
    throw new Error("At least one historical final benchmark is required.");
  }
  const suppliedWeights = args.benchmarks.map((_, index) =>
    Math.max(0, args.recencyWeights[index] ?? 0),
  );
  const suppliedTotal = suppliedWeights.reduce((sum, weight) => sum + weight, 0);
  const weights = suppliedTotal > 0
    ? suppliedWeights.map((weight) => weight / suppliedTotal)
    : args.benchmarks.map(() => 1 / args.benchmarks.length);
  const gate = args.eligibilityGate && args.callGate ? 1 : 0;
  const cycles = args.benchmarks.map((point, index) => {
    const planningTarget = point.benchmark + args.safetyMargin;
    return {
      batch: point.batch,
      benchmark: point.benchmark,
      planningTarget,
      weight: weights[index],
      probability:
        gate * logisticProbability(args.finalCompositeScore, planningTarget, args.logisticSlope),
    };
  });
  const probability = cycles.reduce(
    (sum, cycle) => sum + cycle.weight * cycle.probability,
    0,
  );
  const weightedTarget = cycles.reduce(
    (sum, cycle) => sum + cycle.weight * cycle.planningTarget,
    0,
  );
  const probabilities = cycles.map((cycle) => cycle.probability);
  return {
    probability,
    calibration: {
      method: "RECENCY_WEIGHTED_ENSEMBLE" as const,
      confidence: "LIMITED" as const,
      weightedTarget,
      probabilityLow: Math.min(...probabilities),
      probabilityHigh: Math.max(...probabilities),
      cycles,
    },
  };
}

export function predictionBand(probability: number, policy: IimaPolicyConfig): PredictionBand {
  return (
    policy.probabilityBands.find((item) => probability < item.maxExclusive)?.band ?? "VERY_STRONG"
  );
}
