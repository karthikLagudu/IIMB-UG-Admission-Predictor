import type { ExamSectionKey, IimbUgPolicyConfig } from "@/types/iimb-ug";
import { IIMB_UG_SECTION_ORDER } from "./constants";

export function calculateSensitivity(policy: IimbUgPolicyConfig) {
  return IIMB_UG_SECTION_ORDER.map((section: ExamSectionKey) => {
    const definition = policy.exam.sections[section];
    const weight = policy.prePi.weights.testSections[section];
    const prePiIncrease = weight / definition.maxUnit;
    return {
      section,
      unitRawIncrease: 1,
      prePiIncrease,
      explanation: `Under linear planning, +1 unit raw mark in ${section} adds ${prePiIncrease.toFixed(4)} Pre-PI points. This is not a marginal admission probability.`,
    };
  });
}

