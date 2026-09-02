import type { CatCutoff, Gender, IimbAcademicDiscipline, ProfessionalQualification, SourceType } from "@/types/iima";
import type { PredictionBenchmark } from "@/types/institutes";

export interface MeanSd {
  mean: number;
  sd: number;
}

export interface IimbCycleRuntimeData {
  boardPercentile90?: Partial<Record<"10" | "12", Record<string, number>>>;
  boardAdjustedStats?: Partial<Record<"10" | "12", MeanSd>>;
  bachelorStats?: Partial<Record<IimbAcademicDiscipline, MeanSd>>;
  catSectionStats?: Partial<Record<"VARC" | "DILR" | "QA", MeanSd>>;
  professionalStats?: Partial<Record<ProfessionalQualification, MeanSd>>;
  genderDiversityEligible?: Gender[];
  callBenchmark?: PredictionBenchmark;
  finalBenchmark?: PredictionBenchmark;
  logisticSlope?: number;
  dataSourceType?: SourceType;
  dataLabel?: string;
}

export const IIMB_CAT_2025_CONFIG = {
  institute: "IIMB" as const,
  instituteName: "IIM Bangalore",
  programme: "PGP 2026-28",
  examYear: 2025,
  admissionBatch: "2026-28",
  policyVersion: "IIMB-CAT2025-2026-28-v1.0.0",
  officialSource: "https://www.iimb.ac.in/admissions/pgp-admissions/admission-process",
  degreeEligibility: { STANDARD: 50, RELAXED: 45 },
  catCutoffs: {
    GENERAL: { overall: 85, varc: 80, dilr: 75, qa: 75 },
    EWS: { overall: 75, varc: 70, dilr: 65, qa: 65 },
    NC_OBC: { overall: 75, varc: 70, dilr: 65, qa: 65 },
    SC: { overall: 70, varc: 65, dilr: 60, qa: 60 },
    ST: { overall: 65, varc: 55, dilr: 55, qa: 55 },
    PWD: { overall: 60, varc: 50, dilr: 50, qa: 50 },
  } satisfies Record<string, CatCutoff>,
  preInterviewWeights: {
    cat: { VARC: 19, DILR: 21, QA: 15 },
    class10: 10,
    class12: 10,
    bachelor: 10,
    workOrProfessional: 10,
    gender: 5,
  },
  finalWeights: {
    pi: 40,
    wat: 10,
    cat: { VARC: 8.75, DILR: 10, QA: 6.25 },
    class10: 5,
    class12: 5,
    bachelor: 5,
    workOrProfessional: 10,
  },
  professionalQualifications: ["CA", "ICWA", "CMA", "CS"] as ProfessionalQualification[],
  workExperienceCutoff: "2025-07-31",
  qualityMultipliers: [0.25, 0.5, 1, 1.5, 2] as const,
} as const;

export const IIMB_EMPTY_RUNTIME_DATA: IimbCycleRuntimeData = {};

/**
 * Synthetic, local-only normalization fixture used while the UI is in mock-data
 * testing mode. These values are deliberately labelled as model assumptions and
 * must never be presented as IIMB-observed applicant-pool statistics.
 */
export const IIMB_TEST_RUNTIME_DATA: IimbCycleRuntimeData = {
  dataSourceType: "MODEL_ASSUMPTION",
  dataLabel: "Synthetic test normalization fixture",
  boardPercentile90: {
    "10": { CBSE: 95, CISCE: 96, STATE_BOARD: 92, INTERNATIONAL_BOARD: 94, OTHER: 93 },
    "12": { CBSE: 95, CISCE: 96, STATE_BOARD: 92, INTERNATIONAL_BOARD: 94, OTHER: 93 },
  },
  boardAdjustedStats: {
    "10": { mean: 0.85, sd: 0.1 },
    "12": { mean: 0.85, sd: 0.1 },
  },
  bachelorStats: {
    ENGINEERING_TECHNOLOGY: { mean: 75, sd: 10 },
    SCIENCE: { mean: 72, sd: 10 },
    COMMERCE: { mean: 70, sd: 10 },
    ARTS_HUMANITIES: { mean: 68, sd: 10 },
    OTHER: { mean: 70, sd: 12 },
  },
  catSectionStats: {
    VARC: { mean: 35, sd: 10 },
    DILR: { mean: 35, sd: 10 },
    QA: { mean: 35, sd: 10 },
  },
  professionalStats: {
    CA: { mean: 70, sd: 10 },
    ICWA: { mean: 70, sd: 10 },
    CMA: { mean: 70, sd: 10 },
    CS: { mean: 70, sd: 10 },
  },
  genderDiversityEligible: ["FEMALE", "TRANSGENDER"],
  callBenchmark: {
    value: 65,
    benchmarkType: "MODEL",
    label: "Synthetic test pre-PI benchmark",
  },
  finalBenchmark: {
    value: 68,
    benchmarkType: "MODEL",
    label: "Synthetic test final-score benchmark",
  },
  logisticSlope: 0.22,
};
