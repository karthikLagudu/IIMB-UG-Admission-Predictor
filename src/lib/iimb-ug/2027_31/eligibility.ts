import type { IimbUgCandidateInput, IimbUgPolicyConfig, RuleResult } from "@/types/iimb-ug";

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1])
    && date.getUTCMonth() === Number(match[2]) - 1
    && date.getUTCDate() === Number(match[3])
    ? date
    : null;
}

export function calculateAgeOnDate(dateOfBirth: string, cutoffDate: string): number | null {
  const dob = parseIsoDate(dateOfBirth);
  const cutoff = parseIsoDate(cutoffDate);
  if (!dob || !cutoff) return null;
  let age = cutoff.getUTCFullYear() - dob.getUTCFullYear();
  const beforeBirthday = cutoff.getUTCMonth() < dob.getUTCMonth()
    || (cutoff.getUTCMonth() === dob.getUTCMonth() && cutoff.getUTCDate() < dob.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function calculateAgeEligibility(
  dateOfBirth: string,
  policy: IimbUgPolicyConfig,
): RuleResult {
  const dob = parseIsoDate(dateOfBirth);
  const earliest = parseIsoDate(policy.eligibility.earliestEligibleDob);
  const age = calculateAgeOnDate(dateOfBirth, policy.eligibility.ageCutoffDate);
  if (!dob || !earliest || age == null) {
    return {
      key: "age",
      label: "Age",
      status: "DATA_REQUIRED",
      actual: dateOfBirth,
      required: `Age ≤ ${policy.eligibility.maximumAge} on ${policy.eligibility.ageCutoffDate}`,
      explanation: "A valid date of birth is required for exact date comparison.",
      sourceType: "OFFICIAL_CURRENT",
    };
  }
  const passed = dob.getTime() >= earliest.getTime();
  return {
    key: "age",
    label: "Age",
    status: passed ? "PASS" : "FAIL",
    actual: `${age} years on ${policy.eligibility.ageCutoffDate}`,
    required: `Born on or after ${policy.eligibility.earliestEligibleDob}`,
    explanation: passed
      ? `The candidate is not more than ${policy.eligibility.maximumAge} on the cutoff date.`
      : `The candidate is older than ${policy.eligibility.maximumAge} on the cutoff date.`,
    sourceType: "OFFICIAL_CURRENT",
  };
}

function booleanRule(key: string, label: string, actual: boolean, explanation: string): RuleResult {
  return {
    key,
    label,
    status: actual ? "PASS" : "FAIL",
    actual,
    required: true,
    explanation,
    sourceType: "OFFICIAL_CURRENT",
  };
}

export function calculateAcademicEligibility(
  candidate: IimbUgCandidateInput,
  policy: IimbUgPolicyConfig,
) {
  const overallPass = candidate.class10OverallPercent >= policy.eligibility.class10Minimum;
  const mathXiPass = !policy.eligibility.requireMathClass11 || candidate.studiedMathClass11;
  const mathXiiPass = !policy.eligibility.requireMathClass12 || candidate.studiedMathClass12;
  const mathPercentKnown = candidate.class10MathPercent != null;
  const mathPercentPass = mathPercentKnown
    ? candidate.class10MathPercent! >= policy.eligibility.class10Minimum
    : null;

  const primaryRules: RuleResult[] = [
    {
      key: "class10Overall",
      label: "Class X overall",
      status: overallPass ? "PASS" : "FAIL",
      actual: candidate.class10OverallPercent,
      required: policy.eligibility.class10Minimum,
      explanation: `The formal 2027–31 procedure requires at least ${policy.eligibility.class10Minimum}% in Class X overall.`,
      sourceType: "OFFICIAL_CURRENT",
    },
    booleanRule("mathClass11", "Mathematics XI", mathXiPass, "Mathematics must have been studied in Class XI."),
    booleanRule("mathClass12", "Mathematics XII", mathXiiPass, "Mathematics must have been studied in Class XII."),
  ];
  const alternateRules: RuleResult[] = [
    {
      key: "class10Math",
      label: "Class X Mathematics",
      status: mathPercentPass == null ? "DATA_REQUIRED" : mathPercentPass ? "PASS" : "FAIL",
      actual: candidate.class10MathPercent ?? null,
      required: policy.eligibility.class10Minimum,
      explanation: `The current FAQ states at least ${policy.eligibility.class10Minimum}% in Class X Mathematics.`,
      sourceType: "SOURCE_CONFLICT",
    },
    booleanRule("alternateMathClass11", "Mathematics XI", mathXiPass, "Mathematics must have been studied in Class XI."),
    booleanRule("alternateMathClass12", "Mathematics XII", mathXiiPass, "Mathematics must have been studied in Class XII."),
  ];
  return {
    primaryEligibility: overallPass && mathXiPass && mathXiiPass,
    alternateEligibility: mathPercentPass == null ? null : mathPercentPass && mathXiPass && mathXiiPass,
    primaryRules,
    alternateRules,
    sourceConflict: true as const,
    explanation: "The formal current-cycle procedure uses Class X overall marks, while the current-cycle FAQ names Class X Mathematics marks. Both official interpretations are shown.",
  };
}

export function calculateClass12Eligibility(candidate: IimbUgCandidateInput): RuleResult {
  if (candidate.class12Status === "PASSED") {
    return {
      key: "class12",
      label: "Class XII",
      status: "PASS",
      actual: "PASSED",
      required: "Pass from a recognised board",
      explanation: "Class XII completion is reported as passed.",
      sourceType: "USER_INPUT",
    };
  }
  return {
    key: "class12",
    label: "Class XII",
    status: "PROVISIONAL",
    actual: candidate.class12Status,
    required: "Pass and submit the final certificate by the policy deadline",
    explanation: "The candidate may proceed provisionally but must satisfy the final document requirement.",
    sourceType: "OFFICIAL_CURRENT",
  };
}

