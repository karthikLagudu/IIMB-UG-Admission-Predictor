import type {
  CandidateInput,
  IimaPolicyConfig,
  IimaPredictionResult,
  PredictionDiagnostics,
  PredictionInsight,
} from "@/types/iima";

const signed = (value: number, digits = 2) => `${value >= 0 ? "+" : ""}${value.toFixed(digits)}`;

function insight(
  title: string,
  detail: string,
  metric: string,
  importance: PredictionInsight["importance"],
): PredictionInsight {
  return { title, detail, metric, importance };
}

export function buildPredictionDiagnostics(
  candidate: CandidateInput,
  result: IimaPredictionResult,
  policy: IimaPolicyConfig,
): PredictionDiagnostics {
  const strengths: PredictionInsight[] = [];
  const gaps: PredictionInsight[] = [];
  const nextSteps: string[] = [];

  const bachelorMargin = candidate.bachelorPercent - result.basicEligibility.bachelorRequired;
  if (result.basicEligibility.bachelorPass) {
    strengths.push(insight(
      "Bachelor eligibility",
      `Bachelor marks clear the applicable ${result.basicEligibility.bachelorRequired}% minimum by ${bachelorMargin.toFixed(2)} percentage points.`,
      signed(bachelorMargin) + " pp",
      bachelorMargin >= 10 ? "HIGH" : "MEDIUM",
    ));
  } else {
    gaps.push(insight(
      "Bachelor eligibility deficit",
      `Bachelor marks are below the applicable ${result.basicEligibility.bachelorRequired}% minimum. This is a hard gate.`,
      signed(bachelorMargin) + " pp",
      "HIGH",
    ));
  }

  if (result.basicEligibility.agePass === false) {
    gaps.push(insight("Minimum age not met", `The candidate must be at least ${policy.minimumAge} on ${policy.ageCutoffDate}.`, `${result.basicEligibility.ageAtCutoff ?? "—"} years`, "HIGH"));
  }
  if (result.basicEligibility.degreeDurationPass === false) {
    gaps.push(insight("Degree duration not met", `The configured minimum degree duration is ${policy.minimumDegreeDurationYears} years after 10+2.`, `${candidate.degreeDurationYears ?? "—"} years`, "HIGH"));
  }

  const cat = result.catEligibility;
  if (cat) {
    const catChecks = [
      ["Overall CAT", candidate.catOverallPercentile, cat.cutoff.overall, cat.overallPass],
      ["VARC", candidate.catVarcPercentile, cat.cutoff.varc, cat.varcPass],
      ["DILR", candidate.catDilrPercentile, cat.cutoff.dilr, cat.dilrPass],
      ["QA", candidate.catQaPercentile, cat.cutoff.qa, cat.qaPass],
    ] as const;
    const failedCatChecks = catChecks.filter(([, , , passed]) => !passed);
    if (failedCatChecks.length === 0) {
      const strongest = catChecks
        .map(([label, actual, required]) => ({ label, margin: actual - required }))
        .sort((a, b) => b.margin - a.margin)[0];
      strengths.push(insight(
        "CAT screen fully cleared",
        `${strongest.label} has the largest cushion. Every overall and sectional threshold is satisfied independently.`,
        `${strongest.label} ${signed(strongest.margin)} pp`,
        "HIGH",
      ));
    } else {
      for (const [label, actual, required] of failedCatChecks) {
        const deficit = actual - required;
        gaps.push(insight(
          `${label} cutoff deficit`,
          `${label} is ${actual.toFixed(2)} against the required ${required.toFixed(2)}. No other CAT section can compensate for this hard-gate failure.`,
          signed(deficit) + " pp",
          "HIGH",
        ));
      }
    }
    if (!cat.positiveRawScoresPass) {
      gaps.push(insight("Positive raw-score gate", "Every CAT section must have a raw score above zero.", "Failed", "HIGH"));
    }
  }

  if (result.academicConsistency) {
    const academicMargin = result.academicConsistency.average - (result.academicConsistency.required ?? 0);
    const target = result.academicConsistency.passed ? strengths : gaps;
    target.push(insight(
      result.academicConsistency.passed ? "Academic consistency" : "Academic-consistency deficit",
      `The Class 10/12 average is ${result.academicConsistency.average.toFixed(2)}% against ${result.academicConsistency.required?.toFixed(2)}%.`,
      signed(academicMargin) + " pp",
      result.academicConsistency.passed ? (academicMargin >= 8 ? "HIGH" : "MEDIUM") : "HIGH",
    ));
  }

  if (result.applicationRating) {
    const ratingParts = [
      { label: "Class 10", value: result.applicationRating.class10, max: 10 },
      { label: "Class 12", value: result.applicationRating.class12, max: 10 },
      { label: "Bachelor/professional", value: result.applicationRating.bachelor, max: 10 },
      { label: "Work experience", value: result.applicationRating.workExperience, max: 5 },
      { label: "Gender diversity", value: result.applicationRating.gender, max: 3 },
    ];
    const strongestRating = ratingParts.sort((a, b) => (b.value / b.max) - (a.value / a.max))[0];
    strengths.push(insight(
      "Strongest Application Rating component",
      `${strongestRating.label} contributes ${strongestRating.value.toFixed(1)} out of ${strongestRating.max}. Total AR is ${result.applicationRating.total.toFixed(1)}/${policy.arNormalizationDenominator}.`,
      `${strongestRating.value.toFixed(1)}/${strongestRating.max}`,
      "MEDIUM",
    ));
  }

  if (result.stage1) {
    const graduationCriterion = result.stage1.route === "ACRC" ? result.stage1.c3 : result.stage1.c6;
    if (graduationCriterion.available && graduationCriterion.required != null) {
      const graduationMargin = graduationCriterion.actual - graduationCriterion.required;
      if (graduationCriterion.passed) {
        strengths.push(insight(
          "Graduation filter cleared",
          `Graduation marks are ${graduationCriterion.actual.toFixed(2)}% against the observed ${graduationCriterion.required.toFixed(2)}% route boundary.`,
          signed(graduationMargin) + " pp",
          "MEDIUM",
        ));
      } else if (!result.callPrediction) {
        gaps.push(insight(
          "Graduation-filter deficit",
          `Graduation marks are ${graduationCriterion.actual.toFixed(2)}% against the observed ${graduationCriterion.required.toFixed(2)}% route boundary.`,
          signed(graduationMargin) + " pp",
          "HIGH",
        ));
      }
    }
    if (result.stage1.threshold != null) {
      const stage1Margin = result.stage1.compositeScore - result.stage1.threshold;
      if (stage1Margin >= 0) {
        strengths.push(insight(
          result.stage1.predictedShortlist ? "Stage 1 score cushion" : "Stage 1 score boundary cleared",
          `Composite Score is ${result.stage1.compositeScore.toFixed(6)} against the observed ${result.stage1.threshold.toFixed(6)} route boundary.`,
          signed(stage1Margin, 6),
          stage1Margin >= 0.03 ? "HIGH" : "MEDIUM",
        ));
      } else if (!result.callPrediction) {
        gaps.push(insight(
          "Stage 1 score deficit",
          `Composite Score is ${result.stage1.compositeScore.toFixed(6)} against the observed ${result.stage1.threshold.toFixed(6)} route boundary.`,
          signed(stage1Margin, 6),
          "HIGH",
        ));
      }
    }
  }

  if (result.stage2) {
    if (result.stage2.margin >= 0) {
      strengths.push(insight("Stage 2 score cushion", `Composite Score clears the category Stage 2 boundary of ${result.stage2.threshold.toFixed(6)}.`, signed(result.stage2.margin, 6), result.stage2.margin >= 0.03 ? "HIGH" : "MEDIUM"));
    } else {
      gaps.push(insight("Stage 2 score deficit", `Composite Score is below the category Stage 2 boundary of ${result.stage2.threshold.toFixed(6)}.`, signed(result.stage2.margin, 6), "HIGH"));
    }
  }

  if (result.callPrediction) {
    strengths.unshift(insight(
      "Interview call route qualified",
      `The profile clears all required conditions through ${result.callRoute === "STAGE_1" ? "Stage 1" : "Stage 2"}. Stage 2 is not an additional requirement after a Stage 1 selection.`,
      result.callRoute === "STAGE_1" ? "Stage 1" : "Stage 2",
      "HIGH",
    ));
    nextSteps.push("Focus on AWT and PI preparation; PI carries 50% and AWT carries 10% of the official final composite score.");
    nextSteps.push("Treat the predicted call as evidence-based planning, not an official call letter or admission guarantee.");
  } else {
    if (result.requiredCatScaledScore) {
      if (result.requiredCatScaledScore.achievable && result.requiredCatScaledScore.gap < 0) {
        nextSteps.push(`At the current AR, the Stage 2 score equation requires approximately ${result.requiredCatScaledScore.required.toFixed(2)} CAT scaled points—${Math.abs(result.requiredCatScaledScore.gap).toFixed(2)} above the current score.`);
      } else if (!result.requiredCatScaledScore.achievable) {
        nextSteps.push("The Stage 2 CAT requirement exceeds the configured maximum scaled score at the current AR, so CAT alone cannot close the gap.");
      }
    }
    if (result.status === "NOT_ELIGIBLE") {
      nextSteps.push("Resolve every failed basic-eligibility condition first; CAT and shortlist scores are not evaluated until all basic gates are met.");
    } else if (result.status === "CAT_CUTOFF_FAILED") {
      nextSteps.push("Clear every failed overall/sectional percentile and positive raw-score condition first; later-stage strengths cannot override these gates.");
    } else if (result.status === "ACADEMIC_GATE_FAILED") {
      nextSteps.push("The academic-consistency gate is the binding constraint; a higher shortlist CS does not override it.");
    } else {
      nextSteps.push("Review the Stage 1 graduation filter and Stage 2 CS deficit separately to identify the binding constraint.");
    }
  }

  return { strengths, gaps, nextSteps };
}
