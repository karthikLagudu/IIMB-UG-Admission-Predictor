export { calculateAccuracy, calculateExamSection, calculateSectionRawScore, calculateTotalRawScore, evaluatePositiveSectionGate } from "./exam-score";

export function calculateScoreFromAccuracy(attempts: number, accuracy: number): number | null {
  if (!Number.isFinite(attempts) || !Number.isFinite(accuracy) || attempts < 0 || accuracy < 0 || accuracy > 1) return null;
  return attempts * (4 * accuracy - 1);
}

export function calculateRequiredAccuracy(targetCanonicalScore: number, attempts: number): number | null {
  if (!Number.isFinite(targetCanonicalScore) || !Number.isFinite(attempts) || attempts <= 0) return null;
  return (targetCanonicalScore / attempts + 1) / 4;
}

