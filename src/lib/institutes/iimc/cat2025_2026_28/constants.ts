import type { CatCutoff, IimcAcademicProfile } from "@/types/iima";
import type { PredictionBenchmark } from "@/types/institutes";

export interface IimcCycleData {
  callBenchmark?: PredictionBenchmark;
  finalBenchmark?: PredictionBenchmark;
  logisticSlope?: number;
}

export const IIMC_CAT_2025_CONFIG = {
  institute: "IIMC" as const,
  instituteName: "IIM Calcutta",
  programme: "MBA 2026-28",
  examYear: 2025,
  admissionBatch: "2026-28",
  policyVersion: "IIMC-CAT2025-2026-28-v1.0.0",
  officialSource: "https://www.iimcal.ac.in/programs/pgp/admission/admission-policy/admission-procedure-for-domestic-candidates",
  degreeEligibility: { STANDARD: 50, RELAXED: 45 },
  catMaxPossibleTotal: 204,
  catCutoffs: {
    GENERAL: { overall: 85, varc: 80, dilr: 80, qa: 75 },
    EWS: { overall: 75, varc: 70, dilr: 65, qa: 65 },
    NC_OBC: { overall: 75, varc: 70, dilr: 65, qa: 65 },
    SC: { overall: 70, varc: 65, dilr: 60, qa: 60 },
    ST: { overall: 65, varc: 55, dilr: 55, qa: 55 },
    PWD: { overall: 55, varc: 45, dilr: 45, qa: 45 },
  } satisfies Record<string, CatCutoff>,
  academicDiversityPoints: {
    "1": 0,
    "2": 4,
    "3": 5,
    "4": 2,
    "5": 5,
    "6": 5,
    "7": 1,
    "8": 5,
    "9": 6,
    "10": 6,
    "11": 6,
  } satisfies Record<IimcAcademicProfile, number>,
} as const;

export const IIMC_EMPTY_CYCLE_DATA: IimcCycleData = {};

/**
 * Local mock-mode planning fixture. IIMC does not publish a permanent Stage-II
 * cutoff in advance, so these are explicitly MODEL benchmarks rather than
 * observed or official IIMC cutoffs.
 */
export const IIMC_TEST_CYCLE_DATA: IimcCycleData = {
  callBenchmark: {
    value: 62,
    benchmarkType: "MODEL",
    label: "Mock-mode Stage-II planning benchmark",
  },
  finalBenchmark: {
    value: 68,
    benchmarkType: "MODEL",
    label: "Mock-mode final-score planning benchmark",
  },
  logisticSlope: 0.22,
};
