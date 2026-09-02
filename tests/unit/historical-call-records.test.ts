import { describe, expect, it } from "vitest";
import {
  IIMA_HISTORICAL_STAGE2_CALL_RECORDS,
  iimaHistoricalCallCategory,
  iimaHistoricalCallCategoryLabel,
  iimaHistoricalCallThreshold,
} from "@/lib/iima/historical-call-records";

describe("IIMA historical Stage-2 interview-call records", () => {
  it("returns the official General thresholds for both recorded cycles", () => {
    const candidate = { category: "GENERAL" as const, pwd: false };

    expect(iimaHistoricalCallThreshold(IIMA_HISTORICAL_STAGE2_CALL_RECORDS[0], candidate)).toBe(0.659095);
    expect(iimaHistoricalCallThreshold(IIMA_HISTORICAL_STAGE2_CALL_RECORDS[1], candidate)).toBe(0.610507);
  });

  it("uses the category-specific PwD record", () => {
    const candidate = { category: "NC_OBC" as const, pwd: true };

    expect(iimaHistoricalCallCategory(candidate)).toBe("PWD_NC_OBC");
    expect(iimaHistoricalCallCategoryLabel(candidate)).toBe("PwD · NC-OBC");
    expect(iimaHistoricalCallThreshold(IIMA_HISTORICAL_STAGE2_CALL_RECORDS[0], candidate)).toBe(0.323581);
  });
});
