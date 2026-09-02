export type IimbUgSourceType =
  | "OFFICIAL_CURRENT"
  | "OFFICIAL_HISTORICAL"
  | "OFFICIAL_ANALOGUE"
  | "DERIVED"
  | "MODEL_ASSUMPTION"
  | "THIRD_PARTY_REPORTED"
  | "USER_INPUT"
  | "ADMIN_CONFIGURED"
  | "SOURCE_CONFLICT"
  | "DATA_REQUIRED";

export type Programme = "DATA_SCIENCES" | "ECONOMICS";
export type IimbUgCategory = "GENERAL" | "EWS" | "NC_OBC" | "SC" | "ST";
export type IimbUgGender =
  | "MALE"
  | "FEMALE"
  | "TRANSGENDER"
  | "NON_BINARY"
  | "OTHER"
  | "PREFER_NOT_TO_SAY";
export type GenderDiversityEligibility = "ELIGIBLE" | "NOT_ELIGIBLE" | "UNKNOWN";
export type EligibilityStatus = "ELIGIBLE" | "PROVISIONALLY_ELIGIBLE" | "INELIGIBLE" | "DATA_REQUIRED";
export type CalculationMode = "EXACT" | "PLANNING";
export type TestWeightingStrategy =
  | "DIRECT_OFFICIAL_WEIGHTED"
  | "LINEAR_RAW_PLANNING"
  | "IIMB_STYLE_STANDARDIZATION"
  | "DATA_REQUIRED";
export type AcademicWeightingStrategy = "IIMB_STYLE_STANDARDIZATION" | "LINEAR_PLANNING" | "DATA_REQUIRED";
export type FinalTestStrategy =
  | "DIRECT_OFFICIAL_40"
  | "TOTAL_RAW_LINEAR"
  | "RESCALE_PREPI_TEST"
  | "CUSTOM_RUNTIME"
  | "DATA_REQUIRED";
export type ExamSectionKey = "VARC" | "LR" | "QADI";

export interface IimbUgCandidateInput {
  targetProgrammes: Programme[];
  firstPreference?: Programme;
  secondPreference?: Programme;
  dateOfBirth: string;
  category: IimbUgCategory;
  pwd: boolean;
  gender: IimbUgGender;
  genderDiversityEligibility: GenderDiversityEligibility;
  class10Board?: string;
  class10OverallPercent: number;
  class10MathPercent?: number;
  studiedMathClass11: boolean;
  studiedMathClass12: boolean;
  class12Status: "PASSED" | "APPEARING" | "RESULT_AWAITED";
  class12Board?: string;
  class12Percent?: number;
  varcCorrect?: number;
  varcWrong?: number;
  varcUnattempted?: number;
  lrCorrect?: number;
  lrWrong?: number;
  lrUnattempted?: number;
  qadiCorrect?: number;
  qadiWrong?: number;
  qadiUnattempted?: number;
  varcRaw?: number;
  lrRaw?: number;
  qadiRaw?: number;
  varcCanonicalRaw?: number;
  lrCanonicalRaw?: number;
  qadiCanonicalRaw?: number;
  varcPercentile?: number;
  lrPercentile?: number;
  qadiPercentile?: number;
  overallPercentile?: number;
  varcWeighted20?: number;
  lrWeighted30?: number;
  qadiWeighted20?: number;
  testWeighted40?: number;
  piPerformancePercent?: number;
  piWeightedScore?: number;
  sopReady?: boolean;
  class10DocumentReady?: boolean;
  class12DocumentReady?: boolean;
  categoryCertificateReady?: boolean;
  pwdCertificateReady?: boolean;
  udidReady?: boolean;
  reference1Ready?: boolean;
  reference2Ready?: boolean;
}

export interface MeanSd {
  mean: number;
  sd: number;
  population?: string;
}

export interface ScorePercentilePoint {
  score: number;
  percentile: number;
}

export interface FirstShortlistThreshold {
  varcMinimum?: number;
  lrMinimum?: number;
  qadiMinimum?: number;
  aggregateMinimum?: number;
}

export interface IimbUgRuntimeData {
  version?: string;
  class10OverallStats?: MeanSd;
  class10MathStats?: MeanSd;
  testStats?: Partial<Record<ExamSectionKey, MeanSd>>;
  currentFirstShortlist?: Partial<Record<IimbUgCategory | "PWD", FirstShortlistThreshold>>;
  callBenchmark?: Partial<Record<IimbUgCategory | "PWD", number>>;
  finalBenchmark?: Partial<Record<IimbUgCategory | "PWD", number>>;
  programmeFinalBenchmark?: Partial<Record<Programme, Partial<Record<IimbUgCategory | "PWD", number>>>>;
  genderDiversityEligible?: IimbUgGender[];
  scorePercentileMap?: Partial<Record<ExamSectionKey | "OVERALL", ScorePercentilePoint[]>>;
  customFinalTestScore?: number;
  sourceType?: IimbUgSourceType;
  sourceLabel?: string;
  observedAt?: string;
}

export interface PolicySource {
  id: string;
  title: string;
  institution: string;
  url: string;
  cycle?: string;
  sourceType: IimbUgSourceType;
  verifiedAt: string;
  supports: string[];
  notes?: string;
}

export interface IimbUgPolicyConfig {
  policyId: string;
  version: string;
  institution: string;
  admissionCycle: string;
  examYear: number;
  admissionYear: number;
  dates: {
    applicationOpen: string;
    applicationClose: string;
    ugTestDate: string;
    ugTestDateStatus: "CONFIRMED" | "TENTATIVE";
    interviewWindow: string;
    interviewStatus: "CONFIRMED" | "TENTATIVE";
    offerWindow: string;
    offerStatus: "CONFIRMED" | "TENTATIVE";
    class12DocumentDeadline: string;
  };
  programmes: Record<Programme, {
    displayName: string;
    durationYears: number;
    mode: "FULL_TIME_RESIDENTIAL";
    intake: number;
  }>;
  eligibility: {
    ageCutoffDate: string;
    maximumAge: number;
    earliestEligibleDob: string;
    class10Minimum: number;
    primaryInterpretation: "CYCLE_2027_PROCEDURE";
    alternateInterpretation: "CYCLE_2027_FAQ";
    requireMathClass11: boolean;
    requireMathClass12: boolean;
    sourceConflict: true;
  };
  exam: {
    totalQuestions: number;
    durationMinutes: number;
    sections: Record<ExamSectionKey, {
      label: string;
      questions: number;
      maxUnit: number;
      maxCanonical: number;
    }>;
    totalMaxUnit: number;
    totalMaxCanonical: number;
    markingScheme: {
      correctUnit: number;
      wrongUnit: number;
      correctCanonical: number;
      wrongCanonical: number;
      unattempted: number;
      status: "CURRENT_CONFIRMED" | "HISTORICAL_EQUIVALENT" | "UNCONFIRMED_CURRENT";
    };
  };
  historical: {
    cycle: string;
    examYear: number;
    tableAmbiguity: true;
    pwdResolution: "PWD_OVERRIDE" | "BASE_CATEGORY" | "MORE_LENIENT" | "MORE_STRINGENT";
    thresholds: Record<IimbUgCategory | "PWD", {
      qadiPercentileFloor: number;
      aggregateCanonicalScoreFloor: number;
    }>;
  };
  prePi: {
    weights: {
      test: number;
      class10Overall: number;
      class10Math: number;
      gender: number;
      testSections: Record<ExamSectionKey, number>;
    };
    defaultTestStrategy: TestWeightingStrategy;
    defaultAcademicStrategy: AcademicWeightingStrategy;
  };
  postPi: {
    weights: {
      class10Overall: number;
      class10Math: number;
      test: number;
      pi: number;
    };
    defaultTestStrategy: FinalTestStrategy;
    piScenarioPercents: number[];
  };
  currentThresholds: {
    firstShortlist: null;
    callBenchmark: null;
    finalBenchmark: null;
    programmeClosingScores: null;
  };
  model: {
    probabilityEnabled: false;
    logisticSlope: number | null;
    planningMargin: number | null;
    historicalRecencyWeights: number[];
  };
}

export interface RuleResult {
  key: string;
  label: string;
  status: "PASS" | "FAIL" | "PROVISIONAL" | "DATA_REQUIRED";
  actual?: string | number | boolean | null;
  required?: string | number | boolean | null;
  explanation: string;
  sourceType: IimbUgSourceType;
}

export interface ScoreComponent {
  key: string;
  label: string;
  rawValue?: number | null;
  normalizedValue?: number | null;
  weightedValue?: number | null;
  maxScore: number;
  status: "CALCULATED" | "ESTIMATED" | "DATA_REQUIRED" | "NOT_APPLICABLE";
  formula?: string;
  sourceType: IimbUgSourceType;
  sourceLabel?: string;
  explanation: string;
  missingInputs?: string[];
}

export interface ExamSectionResult {
  key: ExamSectionKey;
  label: string;
  correct: number | null;
  wrong: number | null;
  unattempted: number | null;
  attempted: number | null;
  accuracyPercent: number | null;
  rawUnit: number | null;
  rawCanonical: number | null;
  maxUnit: number;
  maxCanonical: number;
  positive: boolean | null;
  status: "CALCULATED" | "DATA_REQUIRED";
  sourceType: IimbUgSourceType;
}

export type CallOutlook =
  | "INELIGIBLE"
  | "SECTION_GATE_FAILED"
  | "BELOW_HISTORICAL_FIRST_SHORTLIST"
  | "MEETS_HISTORICAL_FIRST_SHORTLIST"
  | "CURRENT_THRESHOLD_UNKNOWN"
  | "BORDERLINE_ESTIMATE"
  | "COMPETITIVE_ESTIMATE"
  | "STRONG_ESTIMATE"
  | "DATA_INSUFFICIENT";

export interface PiScenario {
  piPerformancePercent: number;
  piWeightedScore: number;
  finalCompositeMinimum: number | null;
  finalCompositeMaximum: number | null;
}

export interface RequiredPiResult {
  target: number;
  requiredWeightedScore: number | null;
  requiredPercent: number | null;
  status: "ALREADY_ABOVE_TARGET" | "REACHABLE" | "UNREACHABLE" | "DATA_REQUIRED";
  explanation: string;
}

export interface ReadinessItem {
  key: string;
  label: string;
  status: "READY" | "MISSING" | "NOT_REQUIRED" | "PENDING" | "VERIFY";
  explanation: string;
}

export interface IimbUgPredictionResult {
  policy: { policyId: string; cycle: string; mode: CalculationMode };
  eligibility: {
    status: EligibilityStatus;
    age: RuleResult;
    class12: RuleResult;
    academics: {
      primaryEligibility: boolean;
      alternateEligibility: boolean | null;
      primaryRules: RuleResult[];
      alternateRules: RuleResult[];
      sourceConflict: true;
      explanation: string;
    };
  };
  exam: {
    varc: ExamSectionResult;
    lr: ExamSectionResult;
    qadi: ExamSectionResult;
    totalCanonical: number | null;
    totalUnit: number | null;
    positiveGate: boolean | null;
  };
  historicalShortlist: {
    status: "PASS" | "FAIL" | "DATA_REQUIRED";
    benchmark: IimbUgPolicyConfig["historical"]["thresholds"]["GENERAL"];
    resolvedCategory: IimbUgCategory | "PWD";
    qadiPercentile: number | null;
    sectionGatePass: boolean | null;
    qadiPass: boolean | null;
    aggregatePass: boolean | null;
    explanation: string;
    sourceType: IimbUgSourceType;
  };
  prePi: {
    strategy: TestWeightingStrategy;
    academicStrategy: AcademicWeightingStrategy;
    components: ScoreComponent[];
    test70: number | null;
    prePi: number | null;
    minimum: number | null;
    maximum: number | null;
    status: "CALCULATED" | "ESTIMATED" | "DATA_REQUIRED";
  };
  callOutlook: {
    label: CallOutlook;
    benchmark: number | null;
    gapMinimum: number | null;
    gapMaximum: number | null;
    explanation: string;
  };
  postPi: {
    components: ScoreComponent[];
    fixedMinimum: number | null;
    fixedMaximum: number | null;
    test40: number | null;
    scenarios: PiScenario[];
    selectedPiPercent: number;
    selectedFinalMinimum: number | null;
    selectedFinalMaximum: number | null;
    status: "CALCULATED" | "ESTIMATED" | "DATA_REQUIRED";
  };
  requiredPi: RequiredPiResult;
  sensitivity: Array<{
    section: ExamSectionKey;
    unitRawIncrease: number;
    prePiIncrease: number;
    explanation: string;
  }>;
  programmePreference: {
    targetProgrammes: Programme[];
    preference1?: Programme;
    preference2?: Programme;
    allocationStatus: "PROGRAMME_ALLOCATION_DATA_REQUIRED" | "EVALUATED";
    explanation: string;
  };
  readiness: ReadinessItem[];
  probability: {
    status: "DISABLED" | "DATA_REQUIRED";
    value: null;
    explanation: string;
  };
  warnings: string[];
  assumptions: string[];
  sources: PolicySource[];
}

export interface IimbUgPredictRequest {
  candidate: IimbUgCandidateInput;
  calculationMode?: CalculationMode;
  targetFinalComposite?: number;
  testWeightingStrategy?: TestWeightingStrategy;
  academicWeightingStrategy?: AcademicWeightingStrategy;
  finalTestStrategy?: FinalTestStrategy;
}
