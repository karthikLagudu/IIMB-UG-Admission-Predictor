import type { SourceType } from "@/types/iima";
import { cn, humanize } from "@/lib/utils";

const tone: Record<SourceType, string> = {
  OFFICIAL_POLICY: "source-official",
  OFFICIAL_OBSERVED_RESULT: "source-observed",
  HISTORICAL_RTI: "source-historical",
  MODEL_ASSUMPTION: "source-model",
  USER_INPUT: "source-user",
  CALCULATED: "source-calculated",
};

export function SourceBadge({ source, className }: { source: SourceType; className?: string }) {
  return <span className={cn("source-badge", tone[source], className)}>{humanize(source)}</span>;
}
