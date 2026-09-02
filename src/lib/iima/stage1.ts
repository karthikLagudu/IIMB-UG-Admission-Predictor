import type {
  AcademicConsistencyResult,
  ApplicationRatingResult,
  CandidateInput,
  CatEligibilityResult,
  IimaPolicyConfig,
  Stage1PoolContext,
  Stage1Result,
} from "@/types/iima";
import { isSmallAcademicCategory } from "./academic-category";
import { evaluateC1, evaluateC2, evaluateC3, evaluateC4, evaluateC5, evaluateC6 } from "./c1-c6";
import { academicKey, pooledPwdKey } from "./keys";

function capacityFor(
  candidate: CandidateInput,
  context: Stage1PoolContext | undefined,
  policy: IimaPolicyConfig,
  smallRoute: boolean,
): number | null {
  if (context?.relevantGroupApplicantCount == null) return null;
  const topFivePercent = Math.ceil(context.relevantGroupApplicantCount * 0.05);
  if (smallRoute) return Math.min(100, topFivePercent);
  const table = candidate.academicCategory === "AC_4" ? "AC_4" : "STANDARD_AC";
  const upperLimit = policy.stage1UpperLimits[table][pooledPwdKey(candidate)];
  return upperLimit == null ? topFivePercent : Math.min(upperLimit, topFivePercent);
}

export function evaluateStage1(args: {
  candidate: CandidateInput;
  applicationRating: ApplicationRatingResult;
  catEligibility: CatEligibilityResult;
  compositeScore: number;
  policy: IimaPolicyConfig;
  poolContext?: Stage1PoolContext;
  c2?: AcademicConsistencyResult;
}): Stage1Result {
  const { candidate, catEligibility, compositeScore, policy, poolContext } = args;
  const smallRoute =
    poolContext?.reservedApplicantsInAcademicCategory != null
      ? poolContext.reservedApplicantsInAcademicCategory < 100
      : isSmallAcademicCategory(candidate.academicCategory);
  const c1 = evaluateC1(catEligibility);
  const c2 = args.c2 ?? evaluateC2(candidate, policy);
  const c3 = evaluateC3(candidate, policy);
  const c4 = evaluateC4(candidate);
  const c5 = evaluateC5(candidate, policy);
  const c6 = evaluateC6(candidate, policy);
  const observed = policy.stage1ObservedThresholds[academicKey(candidate)] ?? null;
  const threshold = poolContext?.thresholdOverride ?? observed;
  const thresholdSource =
    poolContext?.thresholdOverride != null
      ? "POOL_CONTEXT"
      : observed != null
        ? "OBSERVED"
        : "UNAVAILABLE";
  const selectionCapacity = capacityFor(candidate, poolContext, policy, smallRoute);
  const rankPass =
    poolContext?.estimatedRank != null && selectionCapacity != null
      ? poolContext.estimatedRank <= selectionCapacity
      : null;
  const eligible = smallRoute ? c4 && c5.passed && c6.passed : c1 && c2.passed && c3.passed;
  const scorePass = threshold == null ? null : compositeScore >= threshold;
  const selectionEvidencePass =
    scorePass == null ? rankPass === true : scorePass && rankPass !== false;
  const predictedShortlist = eligible && selectionEvidencePass;
  let reason: string;
  if (!eligible) {
    const failed = smallRoute
      ? [!c4 && "C4", !c5.passed && "C5", !c6.passed && "C6"].filter(Boolean).join(", ")
      : [!c1 && "C1", !c2.passed && "C2", !c3.passed && "C3"].filter(Boolean).join(", ");
    reason = `Stage 1 ${smallRoute ? "small-AC" : "ACRC"} criteria failed: ${failed}.`;
  } else if (threshold == null && rankPass == null) {
    reason = "Stage 1 criteria pass, but no observed route threshold or pool rank is available; proceed to Stage 2.";
  } else if (predictedShortlist) {
    reason = `Stage 1 ${smallRoute ? "small-AC" : "ACRC"} route is predicted to shortlist the candidate.`;
  } else {
    reason = "Stage 1 criteria pass, but the observed score/rank boundary is not met; proceed to Stage 2.";
  }
  return {
    route: smallRoute ? "SMALL_AC" : "ACRC",
    c1,
    c2,
    c3,
    c4,
    c5,
    c6,
    compositeScore,
    threshold,
    thresholdSource,
    selectionCapacity,
    rankPass,
    eligible,
    predictedShortlist,
    reason,
  };
}
