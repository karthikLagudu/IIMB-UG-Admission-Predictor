import type { RequiredPiResult } from "@/types/iimb-ug";

export function calculateRequiredPi(
  target: number,
  fixedScore: number | null,
  piWeight: number,
): RequiredPiResult {
  if (fixedScore == null || !Number.isFinite(target) || !Number.isFinite(piWeight) || piWeight <= 0) {
    return {
      target,
      requiredWeightedScore: null,
      requiredPercent: null,
      status: "DATA_REQUIRED",
      explanation: "Complete fixed post-PI components are required before solving for PI.",
    };
  }
  const requiredWeightedScore = target - fixedScore;
  const requiredPercent = requiredWeightedScore / piWeight * 100;
  if (requiredPercent <= 0) {
    return {
      target,
      requiredWeightedScore,
      requiredPercent,
      status: "ALREADY_ABOVE_TARGET",
      explanation: "Already above the selected target before PI contribution.",
    };
  }
  if (requiredPercent > 100) {
    return {
      target,
      requiredWeightedScore,
      requiredPercent,
      status: "UNREACHABLE",
      explanation: "Target cannot be reached even with the maximum PI score.",
    };
  }
  return {
    target,
    requiredWeightedScore,
    requiredPercent,
    status: "REACHABLE",
    explanation: `A PI performance of ${requiredPercent.toFixed(2)}% reaches the selected target under this scenario.`,
  };
}

export function calculatePiWeightedScore(piPercent: number, piWeight: number): number {
  return piPercent / 100 * piWeight;
}

