import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";
import { IimbUgSourceBadge } from "./source-badge";

const CATEGORY_ORDER = ["GENERAL", "NC_OBC", "EWS", "SC", "ST", "PWD"] as const;

function formatCategory(category: (typeof CATEGORY_ORDER)[number]) {
  if (category === "NC_OBC") return "NC-OBC";
  if (category === "PWD") return "PwD";
  return category === "GENERAL" ? "General" : category;
}

export function CallScoreRequirement({ result }: { result: IimbUgPredictionResult }) {
  const { historicalShortlist, eligibility } = result;
  const selectedCategory = historicalShortlist.resolvedCategory;
  const cutoff = historicalShortlist.benchmark.qadiPercentileFloor;

  return (
    <section className="ug-panel ug-call-score-panel" aria-labelledby="ug-call-score-heading">
      <div className="ug-panel-heading">
        <div>
          <span>Category-wise percentile guide</span>
          <h2 id="ug-call-score-heading">Your previous-cycle QADI percentile cutoff</h2>
        </div>
        <IimbUgSourceBadge source="OFFICIAL_HISTORICAL" />
      </div>

      <div className="ug-call-score-notice">
        <strong>These are previous-cycle first-shortlist cutoffs, not 2027 interview-call cutoffs.</strong>
        <p>IIM Bangalore has not published the percentile needed for a 2027 interview call. Candidates called for interview in the previous cycle scored above the first-shortlist thresholds.</p>
      </div>

      {eligibility.status === "INELIGIBLE" && (
        <div className="ug-call-score-blocked">
          <strong>Eligibility requirements are not met.</strong>
          <span>Meeting a percentile cutoff cannot compensate for failed eligibility. Review the eligibility panel below.</span>
        </div>
      )}

      <div className="ug-percentile-hero">
        <span>{formatCategory(selectedCategory)} · previous-cycle QADI cutoff</span>
        <strong>{cutoff}<small>th percentile</small></strong>
        <p>This is the Section 3 (QADI) minimum for your category in the UG Test 2025 first shortlist. PwD uses the PwD row when selected.</p>
      </div>

      <div className="ug-percentile-table-wrap">
        <h3>QADI cutoff by category</h3>
        <table className="ug-percentile-table">
          <thead><tr><th scope="col">Category</th><th scope="col">Previous-cycle QADI cutoff</th></tr></thead>
          <tbody>
            {CATEGORY_ORDER.map((category) => (
              <tr key={category} className={category === selectedCategory ? "selected" : undefined}>
                <th scope="row">{formatCategory(category)}{category === selectedCategory ? " · Your category" : ""}</th>
                <td>{IIMB_UG_2027_POLICY.historical.thresholds[category].qadiPercentileFloor}th percentile</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="ug-call-section-warning">A positive score in VARC, LR and QADI is also required for first-shortlist consideration. The QADI percentile alone does not qualify a candidate for an interview.</p>
      <p className="ug-panel-note">Your academic profile contributes to the later Pre-PI ranking, but the published first-shortlist QADI percentile is category-specific, not personalized by Class X marks. No reliable overall or interview-call percentile can be calculated from the currently published data, so this page does not invent one or display raw-score targets.</p>
    </section>
  );
}
