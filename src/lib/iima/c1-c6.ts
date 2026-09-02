import type {
  AcademicConsistencyResult,
  CandidateInput,
  CatEligibilityResult,
  CriterionResult,
  IimaPolicyConfig,
} from "@/types/iima";
import { academicKey } from "./keys";

function c2Key(candidate: CandidateInput): string {
  if (!candidate.pwd) return candidate.category;
  return candidate.category === "ST" ? "PWD_ST" : "PWD";
}

export function evaluateC1(catEligibility: CatEligibilityResult): boolean {
  return catEligibility.catEligible;
}

export function evaluateC2(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
): AcademicConsistencyResult {
  const average = (candidate.class10Percent + candidate.class12Percent) / 2;
  const required = policy.c2Thresholds[candidate.class12Stream][c2Key(candidate)];
  return {
    average,
    actual: average,
    required,
    passed: average >= required,
    sourceType: "OFFICIAL_POLICY",
    available: true,
  };
}

export function evaluateC3(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
): CriterionResult {
  const required = policy.c3Observed[academicKey(candidate)] ?? null;
  return {
    actual: candidate.bachelorPercent,
    required,
    passed: required != null && candidate.bachelorPercent >= required,
    sourceType: "OFFICIAL_OBSERVED_RESULT",
    available: required != null,
  };
}

export function evaluateC4(candidate: CandidateInput): boolean {
  return (
    candidate.catOverallPercentile >= 95 &&
    candidate.catVarcPercentile >= 85 &&
    candidate.catDilrPercentile >= 85 &&
    candidate.catQaPercentile >= 85 &&
    candidate.positiveRawVarc &&
    candidate.positiveRawDilr &&
    candidate.positiveRawQa
  );
}

export function evaluateC5(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
): CriterionResult {
  const actual = (candidate.class10Percent + candidate.class12Percent) / 2;
  const required = policy.c5Thresholds[candidate.class12Stream];
  return {
    actual,
    required,
    passed: actual >= required,
    sourceType: "OFFICIAL_POLICY",
    available: true,
  };
}

export function evaluateC6(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
): CriterionResult {
  const required = policy.c6Observed[candidate.academicCategory] ?? null;
  return {
    actual: candidate.bachelorPercent,
    required,
    passed: required != null && candidate.bachelorPercent >= required,
    sourceType: "OFFICIAL_OBSERVED_RESULT",
    available: required != null,
  };
}
