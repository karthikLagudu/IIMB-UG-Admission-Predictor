import { describe, expect, it } from "vitest";
import { calculateCatSectionProjection } from "@/lib/iima";

describe("CAT marking scheme", () => {
  it("awards +3 for correct MCQ and TITA answers and deducts only wrong MCQs", () => {
    expect(calculateCatSectionProjection({
      mcqCorrect: 10,
      mcqWrong: 3,
      titaCorrect: 4,
      titaWrong: 2,
    })).toEqual({
      mcqCorrect: 10,
      mcqWrong: 3,
      titaCorrect: 4,
      titaWrong: 2,
      attempted: 19,
      marks: 39,
    });
  });

  it("does not deduct marks for wrong TITA answers", () => {
    expect(calculateCatSectionProjection({
      mcqCorrect: 0,
      mcqWrong: 0,
      titaCorrect: 0,
      titaWrong: 5,
    }).marks).toBe(0);
  });
});
