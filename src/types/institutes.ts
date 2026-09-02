import type { CandidateInput, PredictionBand, SourceType } from "./iima";

export type InstituteKey =
  | "IIMA"
  | "IIMB"
  | "IIMC"
  | "IIMBG"
  | "IIMG"
  | "IIMI"
  | "IIMJ"
  | "IIMKASHIPUR"
  | "IIMK"
  | "IIML"
  | "IIMM"
  | "IIMN"
  | "IIMRAIPUR"
  | "IIMRANCHI"
  | "IIMROHTAK"
  | "IIMSAMBALPUR"
  | "IIMSHILLONG"
  | "IIMSIRMAUR"
  | "IIMTRICHY"
  | "IIMUDAIPUR"
  | "IIMV";
export type CalculationStatus = "CALCULATED" | "DATA_REQUIRED" | "SPECIAL_CASE_REVIEW_REQUIRED" | "NOT_REACHED";
export type InstituteCallStatus =
  | "ELIGIBLE_FOR_RANKING"
  | "PREDICTED_CALL"
  | "NO_CALL"
  | "DATA_REQUIRED"
  | "SPECIAL_CASE_REVIEW_REQUIRED";
export type BenchmarkType = "OFFICIAL_RESULT" | "OFFICIAL_POLICY_REFERENCE" | "HISTORICAL" | "MODEL" | "NONE";

export interface InstituteCatCutoff {
  overall: number | null;
  varc: number | null;
  dilr: number | null;
  qa: number | null;
}

export interface PredictionBenchmark {
  value: number;
  benchmarkType: Exclude<BenchmarkType, "NONE">;
  label: string;
}

export interface InstituteScoreComponent {
  key: string;
  label: string;
  score: number | null;
  maxScore: number;
  status: CalculationStatus;
  formula: string;
  detail: string;
  sourceType: SourceType;
}

export interface InstituteEligibilityResult {
  passed: boolean;
  bachelorRequired: number;
  bachelorPass: boolean;
  cutoff: InstituteCatCutoff;
  overallPass: boolean;
  varcPass: boolean;
  dilrPass: boolean;
  qaPass: boolean;
  rawScoreGatePass: boolean;
  failedRules: string[];
}

export interface InstituteSelectionStages {
  interview: boolean;
  wat: boolean;
  groupDiscussion: boolean;
  directMerit: boolean;
}

export interface InstituteScoreResult {
  status: CalculationStatus;
  score: number | null;
  maxScore: number;
  components: InstituteScoreComponent[];
  missingRuntimeData: string[];
}

export interface InstituteCallResult {
  status: InstituteCallStatus;
  officialMinimumsPassed: boolean;
  benchmarkType: BenchmarkType;
  benchmarkValue: number | null;
  margin: number | null;
  reason: string;
}

export interface InstitutePredictionLayer {
  probability: number | null;
  band: PredictionBand | null;
  benchmarkType: BenchmarkType;
  benchmarkValue: number | null;
  disclaimer: string;
}

export interface InstitutePredictionResult {
  institute: Exclude<InstituteKey, "IIMA">;
  instituteName: string;
  programme: string;
  examYear: number;
  admissionBatch: string;
  policyVersion: string;
  sourceUrl: string;
  scoreLabel: string;
  selectionStages: InstituteSelectionStages;
  eligibility: InstituteEligibilityResult;
  preInterview: InstituteScoreResult;
  call: InstituteCallResult;
  final: InstituteScoreResult;
  prediction: InstitutePredictionLayer;
  strengths: string[];
  gaps: string[];
  nextSteps: string[];
  explanation: string[];
}

export interface InstitutePredictRequest {
  institute: InstituteKey;
  candidate: CandidateInput;
  useTestModel?: boolean;
}
