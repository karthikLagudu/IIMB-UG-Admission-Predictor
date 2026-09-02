export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function iimbStyleStandardize(
  value: number,
  mean: number | undefined,
  sd: number | undefined,
  weight: number,
): number | null {
  if (!Number.isFinite(value) || !Number.isFinite(mean) || !Number.isFinite(sd) || sd == null || sd <= 0) return null;
  return clamp(weight / 2 + ((value - mean!) / sd) * weight / 6, 0, weight);
}

export function linearPercentScore(percent: number | undefined, weight: number): number | null {
  if (percent == null || !Number.isFinite(percent)) return null;
  return clamp(percent / 100 * weight, 0, weight);
}
