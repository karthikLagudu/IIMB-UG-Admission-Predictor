import { describe, expect, it } from "vitest";
import { evaluateC2, evaluateC3, evaluateC4, evaluateC5, evaluateC6 } from "@/lib/iima/c1-c6";
import { IIMA_CAT_2025_POLICY, SAMPLE_CANDIDATE } from "@/lib/iima";

describe("academic criteria", () => {
  it.each([
    ["SCIENCE", "GENERAL", false, 80],
    ["SCIENCE", "NC_OBC", false, 75],
    ["COMMERCE", "SC", false, 67],
    ["ARTS_HUMANITIES", "ST", false, 59],
    ["COMMERCE", "GENERAL", true, 67],
    ["SCIENCE", "ST", true, 65],
  ] as const)("uses the right C2 floor for %s %s PwD=%s", (stream, category, pwd, floor) => {
    const result = evaluateC2(
      {
        ...SAMPLE_CANDIDATE,
        class12Stream: stream,
        category,
        pwd,
        class10Percent: floor,
        class12Percent: floor,
      },
      IIMA_CAT_2025_POLICY,
    );
    expect(result.required).toBe(floor);
    expect(result.passed).toBe(true);
  });

  it("uses observed C3 values without rounding", () => {
    expect(
      evaluateC3(
        { ...SAMPLE_CANDIDATE, academicCategory: "AC_4", bachelorPercent: 84.899999 },
        IIMA_CAT_2025_POLICY,
      ).passed,
    ).toBe(false);
    expect(
      evaluateC3(
        { ...SAMPLE_CANDIDATE, academicCategory: "AC_4", bachelorPercent: 84.9 },
        IIMA_CAT_2025_POLICY,
      ).passed,
    ).toBe(true);
  });

  it("implements fixed C4/C5 and observed C6 for small AC routes", () => {
    const candidate = {
      ...SAMPLE_CANDIDATE,
      academicCategory: "AC_2" as const,
      bachelorPercent: 62.5,
      class10Percent: 77,
      class12Percent: 77,
      class12Stream: "COMMERCE" as const,
    };
    expect(evaluateC4(candidate)).toBe(true);
    expect(evaluateC5(candidate, IIMA_CAT_2025_POLICY).passed).toBe(true);
    expect(evaluateC6(candidate, IIMA_CAT_2025_POLICY).passed).toBe(true);
  });
});
