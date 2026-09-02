import { describe, expect, it } from "vitest";
import { INSTITUTE_HISTORICAL_REFERENCES, instituteHistoricalReference } from "@/lib/institutes/historical-references";

describe("institute historical references", () => {
  it("covers every non-IIMA institute in the predictor", () => {
    expect(Object.keys(INSTITUTE_HISTORICAL_REFERENCES)).toHaveLength(20);
    expect(Object.keys(INSTITUTE_HISTORICAL_REFERENCES)).toEqual(expect.arrayContaining([
      "IIMB", "IIMC", "IIMBG", "IIMG", "IIMI", "IIMJ", "IIMKASHIPUR", "IIMK", "IIML", "IIMM",
      "IIMN", "IIMRAIPUR", "IIMRANCHI", "IIMROHTAK", "IIMSAMBALPUR", "IIMSHILLONG", "IIMSIRMAUR", "IIMTRICHY", "IIMUDAIPUR", "IIMV",
    ]));
  });

  it("provides multi-cycle context and keeps CAT screens separate from call boundaries", () => {
    const bangalore = instituteHistoricalReference("IIMB");
    const lucknow = instituteHistoricalReference("IIML");

    expect(bangalore.cycles).toHaveLength(3);
    expect(bangalore.cycles[0].batch).toBe("PGP 2025-27");
    expect(bangalore.cycles[0].catScreen).toEqual({ category: "General", overall: 85, varc: 80, dilr: 75, qa: 75 });
    expect(lucknow.cycles).toHaveLength(3);
    expect(lucknow.cycles[1].batch).toBe("MBA 2024-26");
    expect(lucknow.cycles[1].catScreen?.overall).toBe(90);
    expect(lucknow.boundaryLabel).toBe("Interview-call composite boundary");
  });

  it("marks IIM Guwahati as an inaugural cycle with no fabricated history", () => {
    const guwahati = instituteHistoricalReference("IIMG");

    expect(guwahati.cycles).toHaveLength(1);
    expect(guwahati.cycles[0].noPriorCycle).toBe(true);
    expect(guwahati.cycles[0].note).toContain("no earlier IIM Guwahati MBA admission cycles");
  });
});
