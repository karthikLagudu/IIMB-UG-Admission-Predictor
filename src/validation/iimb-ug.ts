import { z } from "zod";
import type { IimbUgPolicyConfig } from "@/types/iimb-ug";
import { SCORE_TOLERANCE } from "@/lib/iimb-ug/2027_31/constants";

const percent = z.number().finite().min(0).max(100);
const percentile = z.number().finite().min(0).max(100);
const count = z.number().int().min(0);

const programme = z.enum(["DATA_SCIENCES", "ECONOMICS"]);
const sourceType = z.enum([
  "OFFICIAL_CURRENT",
  "OFFICIAL_HISTORICAL",
  "OFFICIAL_ANALOGUE",
  "DERIVED",
  "MODEL_ASSUMPTION",
  "THIRD_PARTY_REPORTED",
  "USER_INPUT",
  "ADMIN_CONFIGURED",
  "SOURCE_CONFLICT",
  "DATA_REQUIRED",
]);

function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export const iimbUgCandidateSchema = z.object({
  targetProgrammes: z.array(programme).min(1).max(2),
  firstPreference: programme.optional(),
  secondPreference: programme.optional(),
  dateOfBirth: z.string().refine(isRealIsoDate, "Enter a valid date in YYYY-MM-DD format."),
  category: z.enum(["GENERAL", "EWS", "NC_OBC", "SC", "ST"]),
  pwd: z.boolean(),
  gender: z.enum(["MALE", "FEMALE", "TRANSGENDER", "NON_BINARY", "OTHER", "PREFER_NOT_TO_SAY"]),
  genderDiversityEligibility: z.enum(["ELIGIBLE", "NOT_ELIGIBLE", "UNKNOWN"]),
  class10Board: z.string().trim().min(1).max(120).optional(),
  class10OverallPercent: percent,
  class10MathPercent: percent.optional(),
  studiedMathClass11: z.boolean(),
  studiedMathClass12: z.boolean(),
  class12Status: z.enum(["PASSED", "APPEARING", "RESULT_AWAITED"]),
  class12Board: z.string().trim().min(1).max(120).optional(),
  class12Percent: percent.optional(),
  varcCorrect: count.optional(),
  varcWrong: count.optional(),
  varcUnattempted: count.optional(),
  lrCorrect: count.optional(),
  lrWrong: count.optional(),
  lrUnattempted: count.optional(),
  qadiCorrect: count.optional(),
  qadiWrong: count.optional(),
  qadiUnattempted: count.optional(),
  varcRaw: z.number().finite().min(-5).max(15).optional(),
  lrRaw: z.number().finite().min(-5).max(15).optional(),
  qadiRaw: z.number().finite().min(-10).max(30).optional(),
  varcCanonicalRaw: z.number().finite().min(-15).max(45).optional(),
  lrCanonicalRaw: z.number().finite().min(-15).max(45).optional(),
  qadiCanonicalRaw: z.number().finite().min(-30).max(90).optional(),
  varcPercentile: percentile.optional(),
  lrPercentile: percentile.optional(),
  qadiPercentile: percentile.optional(),
  overallPercentile: percentile.optional(),
  varcWeighted20: z.number().finite().min(0).max(20).optional(),
  lrWeighted30: z.number().finite().min(0).max(30).optional(),
  qadiWeighted20: z.number().finite().min(0).max(20).optional(),
  testWeighted40: z.number().finite().min(0).max(40).optional(),
  piPerformancePercent: percent.optional(),
  piWeightedScore: z.number().finite().min(0).max(40).optional(),
  sopReady: z.boolean().optional(),
  class10DocumentReady: z.boolean().optional(),
  class12DocumentReady: z.boolean().optional(),
  categoryCertificateReady: z.boolean().optional(),
  pwdCertificateReady: z.boolean().optional(),
  udidReady: z.boolean().optional(),
  reference1Ready: z.boolean().optional(),
  reference2Ready: z.boolean().optional(),
}).superRefine((candidate, context) => {
  if (new Set(candidate.targetProgrammes).size !== candidate.targetProgrammes.length) {
    context.addIssue({ code: "custom", path: ["targetProgrammes"], message: "Programme selections must be unique." });
  }
  if (candidate.targetProgrammes.length === 2) {
    if (!candidate.firstPreference || !candidate.secondPreference) {
      context.addIssue({ code: "custom", path: ["firstPreference"], message: "Rank both programme preferences when applying to both." });
    } else if (candidate.firstPreference === candidate.secondPreference) {
      context.addIssue({ code: "custom", path: ["secondPreference"], message: "First and second preference must be different." });
    }
  }
  for (const key of [candidate.firstPreference, candidate.secondPreference]) {
    if (key && !candidate.targetProgrammes.includes(key)) {
      context.addIssue({ code: "custom", path: ["targetProgrammes"], message: "Preferences must be selected target programmes." });
    }
  }

  const sections = [
    { key: "VARC", prefix: "varc", questions: 15 },
    { key: "LR", prefix: "lr", questions: 15 },
    { key: "QADI", prefix: "qadi", questions: 30 },
  ] as const;
  for (const section of sections) {
    const correct = candidate[`${section.prefix}Correct`];
    const wrong = candidate[`${section.prefix}Wrong`];
    const unattempted = candidate[`${section.prefix}Unattempted`];
    const supplied = [correct, wrong, unattempted].filter((value) => value != null).length;
    if (supplied > 0 && supplied < 3) {
      context.addIssue({ code: "custom", path: [`${section.prefix}Correct`], message: `${section.key} correct and wrong counts must be supplied together.` });
      continue;
    }
    if (supplied === 3) {
      if (correct! + wrong! + unattempted! !== section.questions) {
        context.addIssue({ code: "custom", path: [`${section.prefix}Unattempted`], message: `${section.key} correct + wrong + unattempted must equal ${section.questions}.` });
      }
      const calculatedUnit = correct! - wrong! / 3;
      const calculatedCanonical = 3 * correct! - wrong!;
      const suppliedUnit = candidate[`${section.prefix}Raw`];
      const suppliedCanonical = candidate[`${section.prefix}CanonicalRaw`];
      if (suppliedUnit != null && Math.abs(suppliedUnit - calculatedUnit) > SCORE_TOLERANCE) {
        context.addIssue({ code: "custom", path: [`${section.prefix}Raw`], message: `${section.key} raw score does not match supplied attempts.` });
      }
      if (suppliedCanonical != null && Math.abs(suppliedCanonical - calculatedCanonical) > SCORE_TOLERANCE) {
        context.addIssue({ code: "custom", path: [`${section.prefix}CanonicalRaw`], message: `${section.key} canonical raw score does not match supplied attempts.` });
      }
    }
    const hasRaw = candidate[`${section.prefix}Raw`] != null || candidate[`${section.prefix}CanonicalRaw`] != null;
    if (supplied === 0 && !hasRaw) {
      context.addIssue({ code: "custom", path: [`${section.prefix}Correct`], message: `Supply ${section.key} attempts or a raw score.` });
    }
  }
});

export const iimbUgPredictRequestSchema = z.object({
  candidate: iimbUgCandidateSchema,
  calculationMode: z.enum(["EXACT", "PLANNING"]).default("PLANNING"),
  targetFinalComposite: percent.default(70),
  testWeightingStrategy: z.enum(["DIRECT_OFFICIAL_WEIGHTED", "LINEAR_RAW_PLANNING", "IIMB_STYLE_STANDARDIZATION", "DATA_REQUIRED"]).optional(),
  academicWeightingStrategy: z.enum(["IIMB_STYLE_STANDARDIZATION", "LINEAR_PLANNING", "DATA_REQUIRED"]).optional(),
  finalTestStrategy: z.enum(["DIRECT_OFFICIAL_40", "TOTAL_RAW_LINEAR", "RESCALE_PREPI_TEST", "CUSTOM_RUNTIME", "DATA_REQUIRED"]).optional(),
});

const meanSdSchema = z.object({
  mean: z.number().finite(),
  sd: z.number().finite().positive(),
  population: z.string().optional(),
});

export const iimbUgRuntimeSchema = z.object({
  version: z.string().min(1).optional(),
  class10OverallStats: meanSdSchema.optional(),
  class10MathStats: meanSdSchema.optional(),
  testStats: z.object({ VARC: meanSdSchema.optional(), LR: meanSdSchema.optional(), QADI: meanSdSchema.optional() }).optional(),
  currentFirstShortlist: z.record(z.string(), z.object({
    varcMinimum: percentile.optional(),
    lrMinimum: percentile.optional(),
    qadiMinimum: percentile.optional(),
    aggregateMinimum: z.number().finite().optional(),
  })).optional(),
  callBenchmark: z.record(z.string(), percent).optional(),
  finalBenchmark: z.record(z.string(), percent).optional(),
  programmeFinalBenchmark: z.record(z.string(), z.record(z.string(), percent)).optional(),
  genderDiversityEligible: z.array(z.enum(["MALE", "FEMALE", "TRANSGENDER", "NON_BINARY", "OTHER", "PREFER_NOT_TO_SAY"])).optional(),
  customFinalTestScore: z.number().finite().min(0).max(40).optional(),
  sourceType: sourceType.optional(),
  sourceLabel: z.string().min(1).optional(),
  observedAt: z.string().optional(),
}).passthrough();

function isPolicyConfig(value: unknown): value is IimbUgPolicyConfig {
  if (!value || typeof value !== "object") return false;
  const policy = value as Partial<IimbUgPolicyConfig>;
  if (!policy.policyId || !policy.version || !policy.prePi || !policy.postPi || !policy.exam) return false;
  const pre = policy.prePi.weights;
  const post = policy.postPi.weights;
  const sections = policy.exam.sections;
  return pre.test + pre.class10Overall + pre.class10Math + pre.gender === 100
    && pre.testSections.VARC + pre.testSections.LR + pre.testSections.QADI === pre.test
    && post.class10Overall + post.class10Math + post.test + post.pi === 100
    && sections.VARC.questions + sections.LR.questions + sections.QADI.questions === policy.exam.totalQuestions;
}

export const iimbUgPolicySchema = z.custom<IimbUgPolicyConfig>(isPolicyConfig, {
  message: "Policy must include valid identifiers and internally consistent exam, pre-PI and post-PI totals.",
});

export type ValidatedIimbUgPredictRequest = z.infer<typeof iimbUgPredictRequestSchema>;
