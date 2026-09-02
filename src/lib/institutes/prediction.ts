import type { PredictionBand } from "@/types/iima";
import type {
  BenchmarkType,
  InstitutePredictionLayer,
  PredictionBenchmark,
} from "@/types/institutes";

export const DEFAULT_LOGISTIC_SLOPE = 0.35;

export function institutePredictionBand(probability: number): PredictionBand {
  if (probability < 0.2) return "VERY_LOW";
  if (probability < 0.4) return "LOW";
  if (probability < 0.6) return "BORDERLINE";
  if (probability < 0.75) return "GOOD";
  if (probability < 0.9) return "STRONG";
  return "VERY_STRONG";
}

export function calculateInstituteSeatPrediction(args: {
  eligibilityGate: boolean;
  callGate: boolean;
  finalScore: number | null;
  benchmark?: PredictionBenchmark;
  logisticSlope?: number;
}): InstitutePredictionLayer {
  const { eligibilityGate, callGate, finalScore, benchmark } = args;
  const benchmarkType: BenchmarkType = benchmark?.benchmarkType ?? "NONE";
  if (finalScore == null || !benchmark) {
    return {
      probability: null,
      band: null,
      benchmarkType,
      benchmarkValue: benchmark?.value ?? null,
      disclaimer: "No defensible final-selection benchmark is configured, so no seat percentage is shown.",
    };
  }

  const slope = args.logisticSlope ?? DEFAULT_LOGISTIC_SLOPE;
  const probability = eligibilityGate && callGate
    ? 1 / (1 + Math.exp(-slope * (finalScore - benchmark.value)))
    : 0;
  const sourceWarning = benchmark.benchmarkType === "OFFICIAL_RESULT"
    ? "This is a modelled probability around an official result benchmark, not a guarantee."
    : `This uses a ${benchmark.benchmarkType.toLowerCase()} benchmark and is not an official admission probability or guarantee.`;
  return {
    probability,
    band: institutePredictionBand(probability),
    benchmarkType: benchmark.benchmarkType,
    benchmarkValue: benchmark.value,
    disclaimer: sourceWarning,
  };
}
