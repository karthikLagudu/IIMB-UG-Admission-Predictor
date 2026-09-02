import type { ExamSectionKey, IimbUgPolicyConfig } from "@/types/iimb-ug";
import { calculateRequiredAccuracy, calculateScoreFromAccuracy } from "./marking";

export function calculateExamPlan(args: {
  section: ExamSectionKey;
  attempts: number;
  accuracyPercent: number;
  policy: IimbUgPolicyConfig;
}) {
  const accuracy = args.accuracyPercent / 100;
  const canonicalScore = calculateScoreFromAccuracy(args.attempts, accuracy);
  const definition = args.policy.exam.sections[args.section];
  const weight = args.policy.prePi.weights.testSections[args.section];
  return {
    correct: args.attempts * accuracy,
    wrong: args.attempts * (1 - accuracy),
    canonicalScore,
    unitScore: canonicalScore == null ? null : canonicalScore / 3,
    weightedPlanningContribution: canonicalScore == null
      ? null
      : Math.max(0, Math.min(weight, canonicalScore / definition.maxCanonical * weight)),
  };
}

export function calculateRequiredSectionScore(args: {
  targetPrePi: number;
  knownContribution: number;
  section: ExamSectionKey;
  policy: IimbUgPolicyConfig;
}) {
  const requiredWeighted = args.targetPrePi - args.knownContribution;
  const definition = args.policy.exam.sections[args.section];
  const weight = args.policy.prePi.weights.testSections[args.section];
  const requiredUnit = requiredWeighted * definition.maxUnit / weight;
  return {
    requiredWeighted,
    requiredUnit,
    requiredCanonical: requiredUnit * 3,
    achievable: requiredWeighted >= 0 && requiredWeighted <= weight,
  };
}

export { calculateRequiredAccuracy };

