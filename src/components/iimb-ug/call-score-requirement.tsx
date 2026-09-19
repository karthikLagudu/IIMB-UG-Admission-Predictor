import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import {
  SAFE_SCORE_BUFFER_RATE,
  estimateCategoryCallRequirement,
  estimateExpectedThisYearRawCutoff,
} from "@/lib/iimb-ug/2027_31/call-score-estimate";
import { IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";
import { IimbUgSourceBadge } from "./source-badge";

const RAW_SCORE_CATEGORIES = ["GENERAL", "NC_OBC", "EWS", "SC", "ST", "PWD"] as const;

function formatScore(value: number) {
  return value.toFixed(2).replace(/\.00$/, "");
}

function formatCategory(category: IimbUgPredictionResult["historicalShortlist"]["resolvedCategory"]) {
  return category === "NC_OBC" ? "NC-OBC" : category === "PWD" ? "PwD" : category === "GENERAL" ? "General" : category;
}

export function CallScoreRequirement({ result }: { result: IimbUgPredictionResult }) {
  const historical = result.historicalShortlist;
  const benchmark = historical.benchmark;
  const { prePi } = result;
  const profilePoints = prePi.prePi == null || prePi.test70 == null ? null : prePi.prePi - prePi.test70;
  const overallPoints = prePi.components.find((component) => component.key === "prepi-class10Overall")?.weightedValue;
  const mathPoints = prePi.components.find((component) => component.key === "prepi-class10Math")?.weightedValue;
  const diversityPoints = prePi.components.find((component) => component.key === "prepi-gender")?.weightedValue;
  const estimate = profilePoints == null ? null : estimateCategoryCallRequirement(benchmark.aggregateCanonicalScoreFloor, profilePoints);

  return (
    <section className="ug-panel ug-call-score-panel" aria-labelledby="ug-call-score-heading">
      <div className="ug-panel-heading">
        <div><span>30% profile · 70% UG Test</span><h2 id="ug-call-score-heading">Your profile and estimated exam target</h2></div>
        <IimbUgSourceBadge source="OFFICIAL_HISTORICAL" />
      </div>

      <div className="ug-call-score-notice">
        <strong>IIM Bangalore has not published a 2027 category-wise interview-call cutoff.</strong>
        <p>IIMB publishes the 30-point profile and 70-point test weights, but not the 2027 Pre-PI score needed for a call. The category total below is a planning estimate anchored to the previous-cycle first-shortlist benchmark, not an official cutoff or guarantee.</p>
      </div>

      {estimate != null && result.eligibility.status !== "INELIGIBLE" && (
        <div className="ug-call-estimate">
          <div className="ug-call-estimate-heading"><span>Estimated score target · {formatCategory(historical.resolvedCategory)}</span><IimbUgSourceBadge source="MODEL_ASSUMPTION" /></div>
          <div className="ug-call-estimate-metrics">
            <div><span>Test score to aim for</span><strong>{estimate.reachable ? formatScore(estimate.examTarget180) : "Above 180"}<small> / 180</small></strong></div>
            <div className="ug-call-estimate-primary"><span>Safe Score</span><strong>{formatScore(estimate.safeScore180)}<small> / 180</small></strong></div>
          </div>
          <div className="ug-this-year-target">
            <div><span>This Year&apos;s Estimated Total Target · {formatCategory(historical.resolvedCategory)}</span><strong>{formatScore(estimate.thisYearCategoryTarget100)}<small> / 100</small></strong><em>This Year&apos;s Estimated Cut off</em></div>
            <p>The Safe Score above adds {formatScore(SAFE_SCORE_BUFFER_RATE * 100)}% to the test score to aim for. Both values are planning estimates, not official cutoffs or guarantees.</p>
          </div>
          <details className="ug-raw-cutoff-dropdown">
            <summary>View last and expected raw-score cutoffs for all categories</summary>
            <div className="ug-raw-cutoff-table-wrap">
              <table>
                <thead><tr><th>Category</th><th>Last raw-score cutoff</th><th>This year&apos;s expected raw-score cutoff</th></tr></thead>
                <tbody>
                  {RAW_SCORE_CATEGORIES.map((category) => {
                    const lastRawCutoff = IIMB_UG_2027_POLICY.historical.thresholds[category].aggregateCanonicalScoreFloor;
                    return (
                      <tr key={category} className={category === historical.resolvedCategory ? "is-selected" : undefined}>
                        <th>{formatCategory(category)}</th>
                        <td>{lastRawCutoff} / 180</td>
                        <td>{estimateExpectedThisYearRawCutoff(lastRawCutoff)} / 180</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p>This year&apos;s expected cutoff is calculated as the last raw-score cutoff × 1.125, rounded to the nearest whole number.</p>
          </details>
          <p>{estimate.reachable ? `Based on the selected profile and ${formatCategory(historical.resolvedCategory)} category, aim for approximately ${formatScore(estimate.examTarget180)}/180 on the test.` : "The estimated category target cannot be reached with the test maximum for this profile."} This is a planning estimate, not a guaranteed interview-call score.</p>
        </div>
      )}

      {result.eligibility.status === "INELIGIBLE" && (
        <div className="ug-call-score-blocked"><strong>Eligibility requirements are not met.</strong><span>Meeting a historical cutoff cannot compensate for failed eligibility. Review the eligibility panel below.</span></div>
      )}

      {profilePoints != null && (
        <>
          <div className="ug-profile-score-hero">
            <div><span>Your estimated academic/profile contribution</span></div>
            <strong>{formatScore(profilePoints)} <small>/ 30</small></strong>
            <p>Class X overall, Class X Mathematics and diversity contribute to the later Pre-PI ranking. This does not change the published first-shortlist thresholds for your category.</p>
          </div>
          <div className="ug-call-score-baseline">
            <div><span>Class X overall</span><strong>{overallPoints == null ? "Required" : `${formatScore(overallPoints)} / 15`}</strong></div>
            <div><span>Class X Mathematics</span><strong>{mathPoints == null ? "Required" : `${formatScore(mathPoints)} / 10`}</strong></div>
            <div><span>Diversity contribution</span><strong>{diversityPoints == null ? "Required" : `${formatScore(diversityPoints)} / 5`}</strong></div>
          </div>
        </>
      )}

    </section>
  );
}
