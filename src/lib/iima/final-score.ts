import type { IimaPolicyConfig } from "@/types/iima";

/** Official IIMA final composite-score formula. */
export function calculateFinalCompositeScore(
  values: {
    normalizedPi: number;
    normalizedAwt: number;
    normalizedCat: number;
    normalizedAr: number;
  },
  policy: IimaPolicyConfig,
): number {
  return (
    policy.finalWeights.pi * values.normalizedPi +
    policy.finalWeights.awt * values.normalizedAwt +
    policy.finalWeights.cat * values.normalizedCat +
    policy.finalWeights.ar * values.normalizedAr
  );
}

export function requiredNormalizedPi(args: {
  target: number;
  normalizedAwt: number;
  normalizedCat: number;
  normalizedAr: number;
  policy: IimaPolicyConfig;
}): number {
  const { target, normalizedAwt, normalizedCat, normalizedAr, policy } = args;
  return (
    (target -
      policy.finalWeights.awt * normalizedAwt -
      policy.finalWeights.cat * normalizedCat -
      policy.finalWeights.ar * normalizedAr) /
    policy.finalWeights.pi
  );
}
