import { z } from "zod";
import { estimateCat2025OverallPercentile } from "@/lib/iima/cat-percentile";

const percentage = z.number().min(0).max(100);
const percentile = z.number().min(0).max(100);

export const candidateInputSchema = z.object({
  category: z.enum(["GENERAL", "EWS", "NC_OBC", "SC", "ST"]),
  pwd: z.boolean(),
  gender: z.enum(["MALE", "FEMALE", "TRANSGENDER", "OTHER"]),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Invalid date")
    .optional(),
  ageOnCutoffDate: z.number().min(0).max(100).optional(),
  finalYearStudent: z.boolean().default(false),
  degreeName: z.string().trim().min(1).max(160).default("Bachelor's degree"),
  degreeDurationYears: z.number().min(0).max(10).optional(),
  class10Percent: percentage,
  class10Board: z.string().trim().min(1).max(120).optional(),
  class12Percent: percentage,
  class12Board: z.string().trim().min(1).max(120).optional(),
  class12Stream: z.enum(["SCIENCE", "COMMERCE", "ARTS_HUMANITIES"]),
  academicCategory: z.enum([
    "AC_1_PART_I",
    "AC_1_PART_II",
    "AC_2",
    "AC_3",
    "AC_4",
    "AC_5",
    "AC_6",
  ]),
  bachelorPercent: percentage,
  professionalQualification: z
    .enum(["NONE", "CA", "ICWA", "CMA", "CS", "FIAI", "OTHER"])
    .default("NONE"),
  professionalInterPercent: percentage.optional(),
  professionalFinalPercent: percentage.optional(),
  professionalAggregatePercent: percentage.optional(),
  workExperienceMonths: z.number().int().min(0).max(600),
  iimbAcademicDiscipline: z
    .enum(["ENGINEERING_TECHNOLOGY", "SCIENCE", "COMMERCE", "ARTS_HUMANITIES", "OTHER"])
    .optional(),
  iimbAutomaticPiQualification: z.enum(["UNKNOWN", "QUALIFIED", "NOT_QUALIFIED"]).optional(),
  iimbWorkExperienceQuality: z.union([
    z.literal(0.25),
    z.literal(0.5),
    z.literal(1),
    z.literal(1.5),
    z.literal(2),
  ]).optional(),
  iimcAcademicProfile: z.enum(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]).optional(),
  catOverallPercentile: percentile,
  catVarcPercentile: percentile,
  catDilrPercentile: percentile,
  catQaPercentile: percentile,
  catVarcCorrectAnswers: z.number().int().min(0).max(24).optional(),
  catVarcWrongAnswers: z.number().int().min(0).max(24).optional(),
  catVarcCorrectTitaAnswers: z.number().int().min(0).max(24).optional(),
  catVarcWrongTitaAnswers: z.number().int().min(0).max(24).optional(),
  catDilrCorrectAnswers: z.number().int().min(0).max(22).optional(),
  catDilrWrongAnswers: z.number().int().min(0).max(22).optional(),
  catDilrCorrectTitaAnswers: z.number().int().min(0).max(22).optional(),
  catDilrWrongTitaAnswers: z.number().int().min(0).max(22).optional(),
  catQaCorrectAnswers: z.number().int().min(0).max(22).optional(),
  catQaWrongAnswers: z.number().int().min(0).max(22).optional(),
  catQaCorrectTitaAnswers: z.number().int().min(0).max(22).optional(),
  catQaWrongTitaAnswers: z.number().int().min(0).max(22).optional(),
  catVarcScaledScore: z.number().min(-24).max(72),
  catDilrScaledScore: z.number().min(-22).max(66),
  catQaScaledScore: z.number().min(-22).max(66),
  catOverallScaledScore: z.number().min(-68).max(204),
  positiveRawVarc: z.boolean(),
  positiveRawDilr: z.boolean(),
  positiveRawQa: z.boolean(),
  normalizedPi: z.number().min(0).max(2).optional(),
  normalizedAwt: z.number().min(0).max(2).optional(),
}).superRefine((candidate, context) => {
  const calculatedOverall = Number((
    candidate.catVarcScaledScore
    + candidate.catDilrScaledScore
    + candidate.catQaScaledScore
  ).toFixed(2));
  if (Math.abs(candidate.catOverallScaledScore - calculatedOverall) > 0.001) {
    context.addIssue({
      code: "custom",
      path: ["catOverallScaledScore"],
      message: `Overall scaled score must equal VARC + DILR + QA (${calculatedOverall.toFixed(2)}).`,
    });
  }
  const expectedPercentile = estimateCat2025OverallPercentile(calculatedOverall);
  if (Math.abs(candidate.catOverallPercentile - expectedPercentile) > 0.001) {
    context.addIssue({
      code: "custom",
      path: ["catOverallPercentile"],
      message: `Expected overall percentile must be calculated from the overall scaled score (${expectedPercentile.toFixed(2)}).`,
    });
  }
});

export const stage1PoolContextSchema = z.object({
  relevantGroupApplicantCount: z.number().int().positive().optional(),
  reservedApplicantsInAcademicCategory: z.number().int().min(0).optional(),
  estimatedRank: z.number().int().positive().optional(),
  thresholdOverride: z.number().min(0).max(1.5).optional(),
});

export const predictRequestSchema = z.object({
  candidate: candidateInputSchema,
  poolContext: stage1PoolContextSchema.optional(),
});

const sourceTypeSchema = z.enum([
  "OFFICIAL_POLICY",
  "OFFICIAL_OBSERVED_RESULT",
  "HISTORICAL_RTI",
  "MODEL_ASSUMPTION",
  "USER_INPUT",
  "CALCULATED",
]);

const ratingBandSchema = z.object({
  maxInclusive: z.number().min(0).max(100).optional(),
  score: z.number().min(0).max(10),
});

const metadataSchema = z.object({
  effectiveYear: z.number().int().min(2000).max(2100),
  source: z.string().min(1),
  sourceType: sourceTypeSchema,
  verifiedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string(),
});

const historicalBenchmarkPointSchema = metadataSchema.extend({
  batch: z.string().regex(/^\d{4}-\d{2}$/),
  benchmark: z.number().min(0).max(2),
  offerCount: z.number().int().nonnegative().optional(),
  waitlistMovement: z.number().int().nonnegative().optional(),
  sourceType: z.literal("HISTORICAL_RTI"),
});

export const policyConfigSchema = z.object({
  version: z.string().min(1).max(80),
  admissionCycle: z.string().min(1).max(40),
  catYear: z.number().int().min(2000).max(2100),
  ageCutoffDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  minimumAge: z.number().int().min(0).max(100),
  minimumDegreeDurationYears: z.number().min(0).max(10),
  finalYearCompletionDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  finalDocumentDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  degreeEligibility: z.object({ STANDARD: percentage, RELAXED: percentage }),
  catCutoffs: z.record(
    z.string(),
    z.object({ overall: percentile, varc: percentile, dilr: percentile, qa: percentile }),
  ),
  class10Bands: z.array(ratingBandSchema).min(1),
  class12Bands: z.object({
    SCIENCE: z.array(ratingBandSchema).min(1),
    COMMERCE: z.array(ratingBandSchema).min(1),
    ARTS_HUMANITIES: z.array(ratingBandSchema).min(1),
  }),
  bachelorBands: z.object({
    AC_1_PART_I: z.array(ratingBandSchema).min(1),
    AC_1_PART_II: z.array(ratingBandSchema).min(1),
    AC_2: z.array(ratingBandSchema).min(1),
    AC_3: z.array(ratingBandSchema).min(1),
    AC_4: z.array(ratingBandSchema).min(1),
    AC_5: z.array(ratingBandSchema).min(1),
    AC_6: z.array(ratingBandSchema).min(1),
  }),
  workExperience: z.object({
    minimumMonths: z.number().int().min(0),
    maximumRatedMonths: z.number().int().min(0),
    monthlyRate: z.number().min(0).max(5),
  }),
  genderRatings: z.object({
    MALE: z.number().min(0).max(3),
    FEMALE: z.number().min(0).max(3),
    TRANSGENDER: z.number().min(0).max(3),
    OTHER: z.number().min(0).max(3),
  }),
  c2Thresholds: z.record(z.string(), z.record(z.string(), percentage)),
  c5Thresholds: z.record(z.string(), percentage),
  c3Observed: z.record(z.string(), percentage),
  c6Observed: z.record(z.string(), percentage),
  arNormalizationDenominator: z.number().positive(),
  catNormalizationDenominator: z.number().positive(),
  compositeWeights: z.object({ ar: z.number().min(0).max(1), cat: z.number().min(0).max(1) }),
  stage1UpperLimits: z.record(
    z.string(),
    z.record(z.string(), z.number().int().nonnegative().nullable()),
  ),
  stage1ObservedThresholds: z.record(z.string(), z.number().min(0).max(2)),
  stage2Thresholds: z.record(z.string(), z.number().min(0).max(2)),
  finalWeights: z.object({
    pi: z.number().min(0).max(1),
    awt: z.number().min(0).max(1),
    cat: z.number().min(0).max(1),
    ar: z.number().min(0).max(1),
  }),
  historicalFinalBenchmarks: z.record(z.string(), z.number().min(0).max(2)),
  historicalFinalBenchmarkSeries: z.record(
    z.string(),
    z.array(historicalBenchmarkPointSchema).min(1),
  ),
  model: z.object({
    safetyMargin: z.number().min(0).max(1),
    logisticSlope: z.number().positive().max(500),
    calibrationMethod: z.literal("RECENCY_WEIGHTED_ENSEMBLE"),
    benchmarkRecencyWeights: z
      .array(z.number().nonnegative())
      .min(1)
      .refine((weights) => weights.some((weight) => weight > 0), "At least one weight must be positive"),
  }),
  probabilityBands: z.array(
    z.object({
      maxExclusive: z.number().positive().max(2),
      band: z.enum(["VERY_LOW", "LOW", "BORDERLINE", "GOOD", "STRONG", "VERY_STRONG"]),
    }),
  ),
  metadata: z.record(z.string(), metadataSchema),
});

export type ValidatedPredictRequest = z.infer<typeof predictRequestSchema>;
