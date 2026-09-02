export type Category = "GENERAL" | "EWS" | "NC_OBC" | "SC" | "ST";

export type Gender = "MALE" | "FEMALE" | "TRANSGENDER" | "OTHER";

export type Stream = "SCIENCE" | "COMMERCE" | "ARTS_HUMANITIES";

export type AcademicCategory =
  | "AC_1_PART_I"
  | "AC_1_PART_II"
  | "AC_2"
  | "AC_3"
  | "AC_4"
  | "AC_5"
  | "AC_6";

export type ProfessionalQualification =
  | "NONE"
  | "CA"
  | "ICWA"
  | "CMA"
  | "CS"
  | "FIAI"
  | "OTHER";

export type IimbAcademicDiscipline =
  | "ENGINEERING_TECHNOLOGY"
  | "SCIENCE"
  | "COMMERCE"
  | "ARTS_HUMANITIES"
  | "OTHER";

export type IimbAutomaticPiQualification = "UNKNOWN" | "QUALIFIED" | "NOT_QUALIFIED";

export type IimcAcademicProfile =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "11";

export type SourceType =
  | "OFFICIAL_POLICY"
  | "OFFICIAL_OBSERVED_RESULT"
  | "HISTORICAL_RTI"
  | "MODEL_ASSUMPTION"
  | "USER_INPUT"
  | "CALCULATED";

export interface PolicyMetadata {
  effectiveYear: number;
  source: string;
  sourceType: SourceType;
  verifiedDate: string;
  notes: string;
}

export interface HistoricalFinalBenchmarkPoint extends PolicyMetadata {
  batch: string;
  benchmark: number;
  offerCount?: number;
  waitlistMovement?: number;
}

export interface CatCutoff {
  overall: number;
  varc: number;
  dilr: number;
  qa: number;
}

export interface RatingBand {
  maxInclusive?: number;
  score: number;
}

export interface CandidateInput {
  category: Category;
  pwd: boolean;
  gender: Gender;
  dateOfBirth?: string;
  ageOnCutoffDate?: number;
  finalYearStudent: boolean;
  degreeName: string;
  degreeDurationYears?: number;
  class10Percent: number;
  class10Board?: string;
  class12Percent: number;
  class12Board?: string;
  class12Stream: Stream;
  academicCategory: AcademicCategory;
  bachelorPercent: number;
  professionalQualification: ProfessionalQualification;
  professionalInterPercent?: number;
  professionalFinalPercent?: number;
  professionalAggregatePercent?: number;
  workExperienceMonths: number;
  iimbAcademicDiscipline?: IimbAcademicDiscipline;
  iimbAutomaticPiQualification?: IimbAutomaticPiQualification;
  iimbWorkExperienceQuality?: 0.25 | 0.5 | 1 | 1.5 | 2;
  iimcAcademicProfile?: IimcAcademicProfile;
  catOverallPercentile: number;
  catVarcPercentile: number;
  catDilrPercentile: number;
  catQaPercentile: number;
  catVarcCorrectAnswers?: number;
  catVarcWrongAnswers?: number;
  catVarcCorrectTitaAnswers?: number;
  catVarcWrongTitaAnswers?: number;
  catDilrCorrectAnswers?: number;
  catDilrWrongAnswers?: number;
  catDilrCorrectTitaAnswers?: number;
  catDilrWrongTitaAnswers?: number;
  catQaCorrectAnswers?: number;
  catQaWrongAnswers?: number;
  catQaCorrectTitaAnswers?: number;
  catQaWrongTitaAnswers?: number;
  catVarcScaledScore: number;
  catDilrScaledScore: number;
  catQaScaledScore: number;
  catOverallScaledScore: number;
  positiveRawVarc: boolean;
  positiveRawDilr: boolean;
  positiveRawQa: boolean;
  normalizedPi?: number;
  normalizedAwt?: number;
}

export interface Stage1PoolContext {
  relevantGroupApplicantCount?: number;
  reservedApplicantsInAcademicCategory?: number;
  estimatedRank?: number;
  thresholdOverride?: number;
}

export interface BasicEligibilityResult {
  bachelorRequired: number;
  bachelorPass: boolean;
  ageAtCutoff: number | null;
  agePass: boolean | null;
  degreeDurationPass: boolean | null;
  provisionalFinalYear: boolean;
  passed: boolean;
  reasons: string[];
}

export interface CatEligibilityResult {
  cutoff: CatCutoff;
  cutoffKey: string;
  transgenderMappingApplied: boolean;
  overallPass: boolean;
  varcPass: boolean;
  dilrPass: boolean;
  qaPass: boolean;
  positiveRawScoresPass: boolean;
  catEligible: boolean;
}

export interface ApplicationRatingResult {
  class10: number;
  class12: number;
  bachelor: number;
  workExperience: number;
  gender: number;
  effectiveBachelorPercent: number;
  total: number;
}

export interface CriterionResult {
  passed: boolean;
  actual: number;
  required: number | null;
  sourceType: SourceType;
  available: boolean;
}

export interface AcademicConsistencyResult extends CriterionResult {
  average: number;
}

export type Stage1Route = "ACRC" | "SMALL_AC";

export interface Stage1Result {
  route: Stage1Route;
  c1: boolean;
  c2: AcademicConsistencyResult;
  c3: CriterionResult;
  c4: boolean;
  c5: CriterionResult;
  c6: CriterionResult;
  compositeScore: number;
  threshold: number | null;
  thresholdSource: "OBSERVED" | "POOL_CONTEXT" | "UNAVAILABLE";
  selectionCapacity: number | null;
  rankPass: boolean | null;
  eligible: boolean;
  predictedShortlist: boolean;
  reason: string;
}

export interface Stage2Result {
  c1: boolean;
  c2: AcademicConsistencyResult;
  threshold: number;
  compositeScore: number;
  margin: number;
  eligible: boolean;
  predictedShortlist: boolean;
  reason: string;
}

export type CallRoute = "STAGE_1" | "STAGE_2" | null;

export type PredictionBand =
  | "VERY_LOW"
  | "LOW"
  | "BORDERLINE"
  | "GOOD"
  | "STRONG"
  | "VERY_STRONG";

export type PredictionStatus =
  | "NOT_ELIGIBLE"
  | "CAT_CUTOFF_FAILED"
  | "ACADEMIC_GATE_FAILED"
  | "STAGE_1_NOT_QUALIFIED"
  | "STAGE_2_NOT_QUALIFIED"
  | "AWT_PI_CALL_PREDICTED"
  | "BORDERLINE_FINAL_CONVERSION"
  | "GOOD_FINAL_CONVERSION_PROBABILITY"
  | "STRONG_FINAL_CONVERSION_PROBABILITY"
  | "VERY_STRONG_FINAL_CONVERSION_PROBABILITY";

export interface RequiredScoreResult {
  required: number;
  rawRequired: number;
  current: number;
  gap: number;
  achievable: boolean;
}

export interface FinalSelectionResult {
  normalizedAr: number;
  normalizedCat: number;
  normalizedPi: number;
  normalizedAwt: number;
  finalCompositeScore: number;
  officialCurrentFinalCutoff: null;
  historicalBenchmark: number;
  planningTarget: number;
  targetDifference: number;
  requiredNormalizedPi: number;
  piGap: number;
  seatProbability: number;
  predictionBand: PredictionBand;
  calibration: {
    method: "RECENCY_WEIGHTED_ENSEMBLE";
    confidence: "LIMITED";
    weightedTarget: number;
    probabilityLow: number;
    probabilityHigh: number;
    cycles: Array<{
      batch: string;
      benchmark: number;
      planningTarget: number;
      weight: number;
      probability: number;
    }>;
  };
}

export interface SensitivityScenario {
  key: string;
  label: string;
  finalCompositeScore: number | null;
  probability: number;
  probabilityDelta: number;
}

export interface PredictionInsight {
  title: string;
  detail: string;
  metric: string;
  importance: "HIGH" | "MEDIUM" | "INFO";
}

export interface PredictionDiagnostics {
  strengths: PredictionInsight[];
  gaps: PredictionInsight[];
  nextSteps: string[];
}

export interface IimaPredictionResult {
  policyVersion: string;
  admissionCycle: string;
  basicEligibility: BasicEligibilityResult;
  catEligibility: CatEligibilityResult | null;
  applicationRating: ApplicationRatingResult | null;
  academicConsistency: AcademicConsistencyResult | null;
  compositeScore: number | null;
  stage1: Stage1Result | null;
  stage2: Stage2Result | null;
  callPrediction: boolean;
  callRoute: CallRoute;
  applicableCallThreshold: number | null;
  callMargin: number | null;
  requiredCatScaledScore: RequiredScoreResult | null;
  finalSelection: FinalSelectionResult | null;
  sensitivity: SensitivityScenario[];
  status: PredictionStatus;
  explanation: string[];
  sourceClassifications: Record<string, SourceType>;
  diagnostics?: PredictionDiagnostics;
}

export interface IimaPolicyConfig {
  version: string;
  admissionCycle: string;
  catYear: number;
  ageCutoffDate: string;
  minimumAge: number;
  minimumDegreeDurationYears: number;
  finalYearCompletionDeadline: string;
  finalDocumentDeadline: string;
  degreeEligibility: Record<"STANDARD" | "RELAXED", number>;
  catCutoffs: Record<string, CatCutoff>;
  class10Bands: RatingBand[];
  class12Bands: Record<Stream, RatingBand[]>;
  bachelorBands: Record<AcademicCategory, RatingBand[]>;
  workExperience: { minimumMonths: number; maximumRatedMonths: number; monthlyRate: number };
  genderRatings: Record<Gender, number>;
  c2Thresholds: Record<Stream, Record<string, number>>;
  c5Thresholds: Record<Stream, number>;
  c3Observed: Record<string, number>;
  c6Observed: Record<string, number>;
  arNormalizationDenominator: number;
  catNormalizationDenominator: number;
  compositeWeights: { ar: number; cat: number };
  stage1UpperLimits: Record<"STANDARD_AC" | "AC_4", Record<string, number | null>>;
  stage1ObservedThresholds: Record<string, number>;
  stage2Thresholds: Record<string, number>;
  finalWeights: { pi: number; awt: number; cat: number; ar: number };
  historicalFinalBenchmarks: Record<string, number>;
  historicalFinalBenchmarkSeries: Record<string, HistoricalFinalBenchmarkPoint[]>;
  model: {
    safetyMargin: number;
    logisticSlope: number;
    calibrationMethod: "RECENCY_WEIGHTED_ENSEMBLE";
    benchmarkRecencyWeights: number[];
  };
  probabilityBands: Array<{ maxExclusive: number; band: PredictionBand }>;
  metadata: Record<string, PolicyMetadata>;
}
