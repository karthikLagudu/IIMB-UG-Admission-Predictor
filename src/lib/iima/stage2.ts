import type {
  AcademicConsistencyResult,
  CandidateInput,
  CatEligibilityResult,
  IimaPolicyConfig,
  Stage2Result,
} from "@/types/iima";
import { evaluateC1, evaluateC2 } from "./c1-c6";
import { pwdCategoryKey } from "./keys";

export function evaluateStage2(args: {
  candidate: CandidateInput;
  catEligibility: CatEligibilityResult;
  compositeScore: number;
  policy: IimaPolicyConfig;
  c2?: AcademicConsistencyResult;
}): Stage2Result {
  const { candidate, catEligibility, compositeScore, policy } = args;
  const c1 = evaluateC1(catEligibility);
  const c2 = args.c2 ?? evaluateC2(candidate, policy);
  const threshold = policy.stage2Thresholds[pwdCategoryKey(candidate)];
  if (threshold == null) throw new Error("Missing Stage-2 threshold configuration");
  const eligible = c1 && c2.passed;
  const margin = compositeScore - threshold;
  const predictedShortlist = eligible && compositeScore >= threshold;
  const reason = !eligible
    ? `Stage 2 eligibility failed (${!c1 ? "C1" : "C2"}).`
    : predictedShortlist
      ? `Composite Score clears the Stage-2 threshold by ${margin.toFixed(6)}.`
      : `Composite Score is ${Math.abs(margin).toFixed(6)} below the Stage-2 threshold.`;
  return { c1, c2, threshold, compositeScore, margin, eligible, predictedShortlist, reason };
}
