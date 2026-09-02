import { z } from "zod";
import { candidateInputSchema, stage1PoolContextSchema } from "./iima";

export const institutePredictRequestSchema = z.object({
  institute: z.enum([
    "ALL", "IIMA", "IIMB", "IIMC", "IIMBG", "IIMG", "IIMI", "IIMJ", "IIMKASHIPUR", "IIMK", "IIML", "IIMM", "IIMN",
    "IIMRAIPUR", "IIMRANCHI", "IIMROHTAK", "IIMSAMBALPUR", "IIMSHILLONG", "IIMSIRMAUR", "IIMTRICHY", "IIMUDAIPUR", "IIMV",
  ]),
  candidate: candidateInputSchema,
  poolContext: stage1PoolContextSchema.optional(),
  useTestModel: z.boolean().optional(),
});

export type ValidatedInstitutePredictRequest = z.infer<typeof institutePredictRequestSchema>;
