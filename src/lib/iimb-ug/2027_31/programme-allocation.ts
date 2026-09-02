import type { IimbUgCandidateInput, IimbUgRuntimeData } from "@/types/iimb-ug";

export function evaluateProgrammePreference(
  candidate: IimbUgCandidateInput,
  runtime: IimbUgRuntimeData,
) {
  const preference1 = candidate.firstPreference ?? candidate.targetProgrammes[0];
  const preference2 = candidate.targetProgrammes.length > 1
    ? candidate.secondPreference ?? candidate.targetProgrammes.find((programme) => programme !== preference1)
    : undefined;
  const hasAllocationData = candidate.targetProgrammes.every((programme) => runtime.programmeFinalBenchmark?.[programme]);
  return {
    targetProgrammes: candidate.targetProgrammes,
    preference1,
    preference2,
    allocationStatus: hasAllocationData ? "EVALUATED" as const : "PROGRAMME_ALLOCATION_DATA_REQUIRED" as const,
    explanation: hasAllocationData
      ? "Programme benchmarks are configured. A real allocation still depends on merit order, reservations, capacity and the applicant pool."
      : "Preferences are recorded, but programme-level closing scores and allocation data are unavailable. No programme offer is invented.",
  };
}
