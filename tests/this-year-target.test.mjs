import assert from "node:assert/strict";
import test from "node:test";

import { estimateCategoryCallRequirement } from "../src/lib/iimb-ug/2027_31/call-score-estimate.ts";

const categories = [
  ["General", 114, 70.00, 78.75, 152, 160],
  ["NC-OBC", 75, 52.50, 59.07, 101, 107],
  ["EWS", 75, 52.50, 59.07, 101, 107],
  ["SC", 51, 41.61, 46.82, 69, 73],
  ["ST", 50, 41.22, 46.38, 68, 72],
  ["PwD", 60, 45.50, 51.19, 81, 86],
];

for (const [category, historicalFloor, previousYearTarget, expectedThisYearTarget, expectedTestTarget, expectedSafeScore] of categories) {
  test(`${category} uses the revised this-year and test targets`, () => {
    const estimate = estimateCategoryCallRequirement(historicalFloor, 20);
    assert.equal(estimate.previousYearCategoryTarget100, previousYearTarget);
    assert.equal(estimate.thisYearCategoryTarget100, expectedThisYearTarget);
    assert.equal(estimate.examTarget180, expectedTestTarget);
    assert.equal(estimate.safeScore180, expectedSafeScore);
  });
}

test("safe score is capped at the 180-point test maximum", () => {
  const estimate = estimateCategoryCallRequirement(114, 0);
  assert.ok(estimate.examTarget180 > 180);
  assert.equal(estimate.safeScore180, 180);
});
