import type { IimbUgSourceType } from "@/types/iimb-ug";

const LABELS: Record<IimbUgSourceType, string> = {
  OFFICIAL_CURRENT: "Official · current",
  OFFICIAL_HISTORICAL: "Official · historical",
  OFFICIAL_ANALOGUE: "Official analogue",
  DERIVED: "Derived",
  MODEL_ASSUMPTION: "Planning estimate",
  THIRD_PARTY_REPORTED: "Third-party reported",
  USER_INPUT: "Your input",
  ADMIN_CONFIGURED: "Admin configured",
  SOURCE_CONFLICT: "Source conflict",
  DATA_REQUIRED: "Data required",
};

export function IimbUgSourceBadge({ source }: { source: IimbUgSourceType }) {
  return <span className={`ug-source-badge ug-source-${source.toLowerCase()}`}>{LABELS[source]}</span>;
}
