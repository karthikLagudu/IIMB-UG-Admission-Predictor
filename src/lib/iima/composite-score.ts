import type { IimaPolicyConfig, RequiredScoreResult } from "@/types/iima";

/** CAT-2025 AWT/PI shortlist composite score. Values remain unrounded for comparisons. */
export function calculateCompositeScore(
  applicationRating: number,
  catScaledScore: number,
  policy: IimaPolicyConfig,
): number {
  return (
    policy.compositeWeights.ar * (applicationRating / policy.arNormalizationDenominator) +
    policy.compositeWeights.cat * (catScaledScore / policy.catNormalizationDenominator)
  );
}

export function requiredCatScaledScore(
  applicationRating: number,
  categoryThreshold: number,
  currentCatScaledScore: number,
  policy: IimaPolicyConfig,
): RequiredScoreResult {
  const rawRequired =
    ((categoryThreshold -
      policy.compositeWeights.ar * (applicationRating / policy.arNormalizationDenominator)) *
      policy.catNormalizationDenominator) /
    policy.compositeWeights.cat;
  const required = Math.min(policy.catNormalizationDenominator, Math.max(0, rawRequired));
  return {
    required,
    rawRequired,
    current: currentCatScaledScore,
    gap: currentCatScaledScore - required,
    achievable: rawRequired <= policy.catNormalizationDenominator,
  };
}
