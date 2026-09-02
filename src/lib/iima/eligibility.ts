import type {
  BasicEligibilityResult,
  CandidateInput,
  CatEligibilityResult,
  IimaPolicyConfig,
} from "@/types/iima";

function parseIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00Z`);
}

export function calculateAgeOnDate(dateOfBirth: string, cutoffDate: string): number {
  const dob = parseIsoDate(dateOfBirth);
  const cutoff = parseIsoDate(cutoffDate);
  let age = cutoff.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday =
    cutoff.getUTCMonth() < dob.getUTCMonth() ||
    (cutoff.getUTCMonth() === dob.getUTCMonth() && cutoff.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function evaluateBasicEligibility(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
): BasicEligibilityResult {
  const relaxed = candidate.pwd || candidate.category === "SC" || candidate.category === "ST";
  const bachelorRequired = relaxed
    ? policy.degreeEligibility.RELAXED
    : policy.degreeEligibility.STANDARD;
  const bachelorPass = candidate.bachelorPercent >= bachelorRequired;
  const ageAtCutoff = candidate.dateOfBirth
    ? calculateAgeOnDate(candidate.dateOfBirth, policy.ageCutoffDate)
    : candidate.ageOnCutoffDate ?? null;
  const agePass = ageAtCutoff == null ? null : ageAtCutoff >= policy.minimumAge;
  const degreeDurationPass =
    candidate.degreeDurationYears == null
      ? null
      : candidate.degreeDurationYears >= policy.minimumDegreeDurationYears;
  const passed = bachelorPass && agePass !== false && degreeDurationPass !== false;
  const reasons: string[] = [];
  if (!bachelorPass) {
    reasons.push(
      `Bachelor percentage ${candidate.bachelorPercent}% is below the required ${bachelorRequired}%.`,
    );
  }
  if (agePass === false) {
    reasons.push(`Candidate must be at least ${policy.minimumAge} on ${policy.ageCutoffDate}.`);
  }
  if (degreeDurationPass === false) {
    reasons.push(
      `Recognised degree duration must be at least ${policy.minimumDegreeDurationYears} years after 10+2.`,
    );
  }
  if (candidate.finalYearStudent) {
    reasons.push(
      `Final-year eligibility is provisional: complete degree requirements by ${policy.finalYearCompletionDeadline} and submit final documents by ${policy.finalDocumentDeadline}.`,
    );
  }
  return {
    bachelorRequired,
    bachelorPass,
    ageAtCutoff,
    agePass,
    degreeDurationPass,
    provisionalFinalYear: candidate.finalYearStudent,
    passed,
    reasons,
  };
}

function resolveCatCutoffKey(candidate: CandidateInput): {
  key: string;
  transgenderMappingApplied: boolean;
} {
  const transgenderMappingApplied =
    candidate.category === "GENERAL" && candidate.gender === "TRANSGENDER";
  const mappedCategory = transgenderMappingApplied ? "NC_OBC" : candidate.category;
  return {
    key: candidate.pwd ? `PWD_${mappedCategory}` : mappedCategory,
    transgenderMappingApplied,
  };
}

export function evaluateCatEligibility(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
): CatEligibilityResult {
  const { key, transgenderMappingApplied } = resolveCatCutoffKey(candidate);
  const cutoff = policy.catCutoffs[key];
  if (!cutoff) throw new Error(`Missing CAT cutoff configuration for ${key}`);
  const overallPass = candidate.catOverallPercentile >= cutoff.overall;
  const varcPass = candidate.catVarcPercentile >= cutoff.varc;
  const dilrPass = candidate.catDilrPercentile >= cutoff.dilr;
  const qaPass = candidate.catQaPercentile >= cutoff.qa;
  const positiveRawScoresPass =
    candidate.positiveRawVarc && candidate.positiveRawDilr && candidate.positiveRawQa;
  return {
    cutoff,
    cutoffKey: key,
    transgenderMappingApplied,
    overallPass,
    varcPass,
    dilrPass,
    qaPass,
    positiveRawScoresPass,
    catEligible: overallPass && varcPass && dilrPass && qaPass && positiveRawScoresPass,
  };
}
