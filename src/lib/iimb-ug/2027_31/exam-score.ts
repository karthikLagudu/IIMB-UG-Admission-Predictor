import type { ExamSectionKey, ExamSectionResult, IimbUgCandidateInput, IimbUgPolicyConfig } from "@/types/iimb-ug";

export function calculateSectionRawScore(correct: number, wrong: number) {
  return {
    rawUnit: correct - wrong / 3,
    rawCanonical: 3 * correct - wrong,
  };
}

export function calculateAccuracy(correct: number, wrong: number): number | null {
  const attempted = correct + wrong;
  return attempted === 0 ? null : 100 * correct / attempted;
}

function candidateField(section: ExamSectionKey, suffix: string) {
  return `${section.toLowerCase()}${suffix}` as keyof IimbUgCandidateInput;
}

export function calculateExamSection(
  section: ExamSectionKey,
  candidate: IimbUgCandidateInput,
  policy: IimbUgPolicyConfig,
): ExamSectionResult {
  const definition = policy.exam.sections[section];
  const correct = candidate[candidateField(section, "Correct")] as number | undefined;
  const wrong = candidate[candidateField(section, "Wrong")] as number | undefined;
  const unattempted = candidate[candidateField(section, "Unattempted")] as number | undefined;
  const unitInput = candidate[candidateField(section, "Raw")] as number | undefined;
  const canonicalInput = candidate[candidateField(section, "CanonicalRaw")] as number | undefined;
  if (correct != null && wrong != null && unattempted != null) {
    const raw = calculateSectionRawScore(correct, wrong);
    return {
      key: section,
      label: definition.label,
      correct,
      wrong,
      unattempted,
      attempted: correct + wrong,
      accuracyPercent: calculateAccuracy(correct, wrong),
      rawUnit: raw.rawUnit,
      rawCanonical: raw.rawCanonical,
      maxUnit: definition.maxUnit,
      maxCanonical: definition.maxCanonical,
      positive: raw.rawCanonical > 0,
      status: "CALCULATED",
      sourceType: "DERIVED",
    };
  }
  const rawCanonical = canonicalInput ?? (unitInput == null ? null : unitInput * 3);
  const rawUnit = unitInput ?? (canonicalInput == null ? null : canonicalInput / 3);
  return {
    key: section,
    label: definition.label,
    correct: null,
    wrong: null,
    unattempted: null,
    attempted: null,
    accuracyPercent: null,
    rawUnit,
    rawCanonical,
    maxUnit: definition.maxUnit,
    maxCanonical: definition.maxCanonical,
    positive: rawCanonical == null ? null : rawCanonical > 0,
    status: rawCanonical == null ? "DATA_REQUIRED" : "CALCULATED",
    sourceType: rawCanonical == null ? "DATA_REQUIRED" : "USER_INPUT",
  };
}

export function calculateTotalRawScore(sections: ExamSectionResult[]) {
  if (sections.some((section) => section.rawCanonical == null)) {
    return { totalCanonical: null, totalUnit: null };
  }
  const totalCanonical = sections.reduce((sum, section) => sum + section.rawCanonical!, 0);
  return { totalCanonical, totalUnit: totalCanonical / 3 };
}

export function evaluatePositiveSectionGate(sections: ExamSectionResult[]): boolean | null {
  if (sections.some((section) => section.positive == null)) return null;
  return sections.every((section) => section.positive === true);
}

