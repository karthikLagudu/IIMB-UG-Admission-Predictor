import { describe, expect, it } from "vitest";
import { classifyDegreeForInstitutes, DEGREE_OPTIONS } from "@/lib/iima";

describe("degree dropdown mappings", () => {
  it("provides at least one selectable qualification for every academic category", () => {
    expect(new Set(DEGREE_OPTIONS.map((option) => option.academicCategory))).toEqual(
      new Set(["AC_1_PART_I", "AC_1_PART_II", "AC_2", "AC_3", "AC_4", "AC_5", "AC_6"]),
    );
  });

  it("uses unique dropdown values", () => {
    expect(new Set(DEGREE_OPTIONS.map((option) => option.value)).size).toBe(DEGREE_OPTIONS.length);
  });

  it("maps the sample B.Tech qualification to AC-4", () => {
    expect(DEGREE_OPTIONS.find((option) => option.value === "B.Tech Computer Science")?.academicCategory).toBe("AC_4");
  });

  it("uses one degree selection to classify the candidate for IIMA, IIMB and IIMC", () => {
    const engineering = DEGREE_OPTIONS.find((option) => option.value === "B.Tech Computer Science");
    const commerce = DEGREE_OPTIONS.find((option) => option.value === "Bachelor of Commerce");

    expect(engineering && classifyDegreeForInstitutes(engineering)).toEqual({
      academicCategory: "AC_4",
      iimbAcademicDiscipline: "ENGINEERING_TECHNOLOGY",
      iimcAcademicProfile: "1",
    });
    expect(commerce && classifyDegreeForInstitutes(commerce)).toEqual({
      academicCategory: "AC_3",
      iimbAcademicDiscipline: "COMMERCE",
      iimcAcademicProfile: "2",
    });
  });
});
