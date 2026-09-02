import type { CandidateInput, Category } from "@/types/iima";

export type IimaHistoricalCallCategory =
  | Category
  | "PWD_GENERAL"
  | "PWD_EWS"
  | "PWD_NC_OBC"
  | "PWD_SC"
  | "PWD_ST";

export interface IimaHistoricalCallRecord {
  batch: string;
  catYear: number;
  sourceUrl: string;
  thresholds: Record<IimaHistoricalCallCategory, number>;
}

export const IIMA_HISTORICAL_STAGE2_CALL_RECORDS: readonly IimaHistoricalCallRecord[] = [
  {
    batch: "2025-27",
    catYear: 2024,
    sourceUrl: "https://www.iima.ac.in/sites/default/files/2025-01/ShortlistingCriteria_PGP%202025-27%20Batch_Updated%20-%20Jan%2009%2C%202025%20%281%29.pdf",
    thresholds: {
      GENERAL: 0.659095,
      EWS: 0.576825,
      NC_OBC: 0.562360,
      SC: 0.498964,
      ST: 0.435064,
      PWD_GENERAL: 0.491272,
      PWD_EWS: 0.455927,
      PWD_NC_OBC: 0.323581,
      PWD_SC: 0.285709,
      PWD_ST: 0.279694,
    },
  },
  {
    batch: "2024-26",
    catYear: 2023,
    sourceUrl: "https://www.iima.ac.in/sites/default/files/2024-01/ShortlistingCriteria_PGP%202024-26%20Batch.pdf",
    thresholds: {
      GENERAL: 0.610507,
      EWS: 0.557798,
      NC_OBC: 0.524637,
      SC: 0.456321,
      ST: 0.398081,
      PWD_GENERAL: 0.473227,
      PWD_EWS: 0.375293,
      PWD_NC_OBC: 0.345260,
      PWD_SC: 0.278215,
      PWD_ST: 0.328944,
    },
  },
] as const;

export function iimaHistoricalCallCategory(candidate: Pick<CandidateInput, "category" | "pwd">): IimaHistoricalCallCategory {
  return candidate.pwd ? `PWD_${candidate.category}` : candidate.category;
}

export function iimaHistoricalCallThreshold(
  record: IimaHistoricalCallRecord,
  candidate: Pick<CandidateInput, "category" | "pwd">,
): number {
  return record.thresholds[iimaHistoricalCallCategory(candidate)];
}

export function iimaHistoricalCallCategoryLabel(candidate: Pick<CandidateInput, "category" | "pwd">): string {
  const category = candidate.category === "NC_OBC" ? "NC-OBC" : candidate.category === "GENERAL" ? "General" : candidate.category;
  return candidate.pwd ? `PwD · ${category}` : category;
}
