import type { IimbUgPolicyConfig, IimbUgRuntimeData } from "@/types/iimb-ug";

export const IIMB_UG_2027_POLICY = {
  policyId: "IIMB-UG-2027-31-v1.0.0",
  version: "IIMB-UG-2027-31-v1.0.0",
  institution: "IIM Bangalore",
  admissionCycle: "2027-31",
  examYear: 2026,
  admissionYear: 2027,
  dates: {
    applicationOpen: "2026-08-17",
    applicationClose: "2026-10-15T17:00:00+05:30",
    ugTestDate: "2026-11-15",
    ugTestDateStatus: "TENTATIVE",
    interviewWindow: "SECOND_AND_THIRD_WEEK_JANUARY_2027",
    interviewStatus: "TENTATIVE",
    offerWindow: "THIRD_WEEK_FEBRUARY_2027",
    offerStatus: "TENTATIVE",
    class12DocumentDeadline: "2027-12-31",
  },
  programmes: {
    DATA_SCIENCES: {
      displayName: "B.Sc. (Honours) in Data Sciences",
      durationYears: 4,
      mode: "FULL_TIME_RESIDENTIAL",
      intake: 40,
    },
    ECONOMICS: {
      displayName: "B.Sc. (Honours) in Economics",
      durationYears: 4,
      mode: "FULL_TIME_RESIDENTIAL",
      intake: 40,
    },
  },
  eligibility: {
    ageCutoffDate: "2027-08-01",
    maximumAge: 20,
    earliestEligibleDob: "2006-08-02",
    class10Minimum: 60,
    primaryInterpretation: "CYCLE_2027_PROCEDURE",
    alternateInterpretation: "CYCLE_2027_FAQ",
    requireMathClass11: true,
    requireMathClass12: true,
    sourceConflict: true,
  },
  exam: {
    totalQuestions: 60,
    durationMinutes: 135,
    sections: {
      VARC: {
        label: "Verbal Ability & Reading Comprehension",
        questions: 15,
        maxUnit: 15,
        maxCanonical: 45,
      },
      LR: {
        label: "Logical Reasoning",
        questions: 15,
        maxUnit: 15,
        maxCanonical: 45,
      },
      QADI: {
        label: "Quantitative Aptitude & Data Interpretation",
        questions: 30,
        maxUnit: 30,
        maxCanonical: 90,
      },
    },
    totalMaxUnit: 60,
    totalMaxCanonical: 180,
    markingScheme: {
      correctUnit: 1,
      wrongUnit: -1 / 3,
      correctCanonical: 3,
      wrongCanonical: -1,
      unattempted: 0,
      status: "CURRENT_CONFIRMED",
    },
  },
  historical: {
    cycle: "2026-30",
    examYear: 2025,
    tableAmbiguity: true,
    pwdResolution: "PWD_OVERRIDE",
    thresholds: {
      GENERAL: { qadiPercentileFloor: 80, aggregateCanonicalScoreFloor: 114 },
      NC_OBC: { qadiPercentileFloor: 75, aggregateCanonicalScoreFloor: 75 },
      EWS: { qadiPercentileFloor: 75, aggregateCanonicalScoreFloor: 75 },
      SC: { qadiPercentileFloor: 70, aggregateCanonicalScoreFloor: 51 },
      ST: { qadiPercentileFloor: 70, aggregateCanonicalScoreFloor: 50 },
      PWD: { qadiPercentileFloor: 70, aggregateCanonicalScoreFloor: 60 },
    },
  },
  prePi: {
    weights: {
      test: 70,
      class10Overall: 15,
      class10Math: 10,
      gender: 5,
      testSections: { VARC: 20, LR: 30, QADI: 20 },
    },
    defaultTestStrategy: "LINEAR_RAW_PLANNING",
    defaultAcademicStrategy: "LINEAR_PLANNING",
  },
  postPi: {
    weights: {
      class10Overall: 10,
      class10Math: 10,
      test: 40,
      pi: 40,
    },
    defaultTestStrategy: "TOTAL_RAW_LINEAR",
    piScenarioPercents: [40, 50, 60, 70, 80, 90, 100],
  },
  currentThresholds: {
    firstShortlist: null,
    callBenchmark: null,
    finalBenchmark: null,
    programmeClosingScores: null,
  },
  model: {
    probabilityEnabled: false,
    logisticSlope: null,
    planningMargin: null,
    historicalRecencyWeights: [],
  },
} as const satisfies IimbUgPolicyConfig;

export const EMPTY_IIMB_UG_RUNTIME_DATA: IimbUgRuntimeData = {
  version: "EMPTY",
  sourceType: "DATA_REQUIRED",
  sourceLabel: "No current-cycle runtime dataset configured",
};

export const IIMB_UG_TEST_RUNTIME_DATA: IimbUgRuntimeData = {
  version: "SYNTHETIC-TEST-v1",
  class10OverallStats: { mean: 85, sd: 8, population: "Synthetic test fixture" },
  class10MathStats: { mean: 88, sd: 7, population: "Synthetic test fixture" },
  testStats: {
    VARC: { mean: 22, sd: 8, population: "Synthetic test fixture" },
    LR: { mean: 22, sd: 8, population: "Synthetic test fixture" },
    QADI: { mean: 45, sd: 15, population: "Synthetic test fixture" },
  },
  genderDiversityEligible: ["FEMALE", "TRANSGENDER"],
  callBenchmark: { GENERAL: 72 },
  finalBenchmark: { GENERAL: 68 },
  sourceType: "MODEL_ASSUMPTION",
  sourceLabel: "Synthetic test fixture — never production data",
};

