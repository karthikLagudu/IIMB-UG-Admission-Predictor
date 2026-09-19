import assert from "node:assert/strict";
import test from "node:test";

import { calculateAcademicEligibility } from "../src/lib/iimb-ug/2027_31/eligibility.ts";
import { IIMB_UG_2027_POLICY } from "../src/lib/iimb-ug/2027_31/policy.ts";

const candidate = {
  class10OverallPercent: 75,
  class10MathPercent: 60,
  studiedMathClass11: true,
  studiedMathClass12: true,
};

test("Class X Mathematics at exactly 60% passes the site filter", () => {
  const result = calculateAcademicEligibility(candidate, IIMB_UG_2027_POLICY);
  assert.equal(result.primaryEligibility, true);
  assert.equal(result.primaryRules.find((rule) => rule.key === "class10Math")?.status, "PASS");
});

test("Class X Mathematics at 59.99% fails even with strong overall marks", () => {
  const result = calculateAcademicEligibility({ ...candidate, class10MathPercent: 59.99 }, IIMB_UG_2027_POLICY);
  assert.equal(result.primaryEligibility, false);
  assert.equal(result.primaryRules.find((rule) => rule.key === "class10Math")?.status, "FAIL");
  assert.equal(result.alternateEligibility, true);
});

test("Class X overall at 59.99% fails the 60% minimum", () => {
  const result = calculateAcademicEligibility({ ...candidate, class10OverallPercent: 59.99 }, IIMB_UG_2027_POLICY);
  assert.equal(result.primaryEligibility, false);
  assert.equal(result.primaryRules.find((rule) => rule.key === "class10Overall")?.status, "FAIL");
  assert.equal(result.alternateEligibility, false);
  assert.equal(result.alternateRules.find((rule) => rule.key === "class10Overall")?.status, "FAIL");
});

test("Class X overall at 60% passes both checks", () => {
  const result = calculateAcademicEligibility({ ...candidate, class10OverallPercent: 60 }, IIMB_UG_2027_POLICY);
  assert.equal(result.primaryEligibility, true);
  assert.equal(result.alternateEligibility, true);
});

test("Missing Class X Mathematics cannot pass the initial filter", () => {
  const result = calculateAcademicEligibility({ ...candidate, class10MathPercent: undefined }, IIMB_UG_2027_POLICY);
  assert.equal(result.primaryEligibility, false);
  assert.equal(result.primaryRules.find((rule) => rule.key === "class10Math")?.status, "DATA_REQUIRED");
});

test("Mathematics in both Classes XI and XII remains required", () => {
  for (const key of ["studiedMathClass11", "studiedMathClass12"]) {
    const result = calculateAcademicEligibility({ ...candidate, [key]: false }, IIMB_UG_2027_POLICY);
    assert.equal(result.primaryEligibility, false);
  }
});
