import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

const OUTLOOK_LABEL: Record<IimbUgPredictionResult["callOutlook"]["label"], string> = {
  INELIGIBLE: "Not eligible under the primary current-cycle rule",
  SECTION_GATE_FAILED: "Sectional gate failed",
  BELOW_HISTORICAL_FIRST_SHORTLIST: "Below the previous first-shortlist benchmark",
  UNLIKELY_ESTIMATE: "Unlikely planning estimate",
  MEETS_HISTORICAL_FIRST_SHORTLIST: "Meets the previous benchmark",
  CURRENT_THRESHOLD_UNKNOWN: "Potentially competitive; exact current threshold unavailable",
  BORDERLINE_ESTIMATE: "Borderline planning estimate",
  COMPETITIVE_ESTIMATE: "Competitive planning estimate",
  STRONG_ESTIMATE: "Strong planning estimate",
  DATA_INSUFFICIENT: "More data required",
};

function interviewCallEstimate(result: IimbUgPredictionResult) {
  switch (result.callOutlook.label) {
    case "INELIGIBLE":
      return "NO — eligibility requirements not met";
    case "SECTION_GATE_FAILED":
      return "NO — sectional gate not met";
    case "BELOW_HISTORICAL_FIRST_SHORTLIST":
      return "UNLIKELY — below the previous benchmark";
    case "UNLIKELY_ESTIMATE":
      return "UNLIKELY — planning score is below 60";
    case "MEETS_HISTORICAL_FIRST_SHORTLIST":
      return "LIKELY — based on the previous benchmark";
    case "CURRENT_THRESHOLD_UNKNOWN":
      return result.historicalShortlist.status === "PASS"
        ? "POSSIBLE — previous benchmark cleared"
        : "POSSIBLE — based on available planning data";
    case "BORDERLINE_ESTIMATE":
      return "BORDERLINE — call is uncertain";
    case "COMPETITIVE_ESTIMATE":
      return "LIKELY — based on the planning estimate";
    case "STRONG_ESTIMATE":
      return "LIKELY — strong planning estimate";
    case "DATA_INSUFFICIENT":
      return "MORE DETAILS NEEDED — complete the required fields";
  }
}

function interviewCallTone(result: IimbUgPredictionResult) {
  switch (result.callOutlook.label) {
    case "MEETS_HISTORICAL_FIRST_SHORTLIST":
    case "COMPETITIVE_ESTIMATE":
    case "STRONG_ESTIMATE":
      return "positive";
    case "CURRENT_THRESHOLD_UNKNOWN":
    case "BORDERLINE_ESTIMATE":
      return "caution";
    case "INELIGIBLE":
    case "SECTION_GATE_FAILED":
    case "BELOW_HISTORICAL_FIRST_SHORTLIST":
    case "UNLIKELY_ESTIMATE":
      return "negative";
    case "DATA_INSUFFICIENT":
      return "neutral";
  }
}

function prePiRange(result: IimbUgPredictionResult) {
  if (result.prePi.minimum == null) return "Data required";
  return result.prePi.maximum !== result.prePi.minimum && result.prePi.maximum != null
    ? `${result.prePi.minimum.toFixed(2)}–${result.prePi.maximum.toFixed(2)}`
    : result.prePi.minimum.toFixed(2);
}

export function CallOutlookPanel({ result }: { result: IimbUgPredictionResult }) {
  return (
    <section className="ug-panel ug-outlook-panel" aria-labelledby="ug-outlook-heading">
      <div className="ug-panel-heading"><div><span>Result highlight</span><h2 id="ug-outlook-heading">Will the student get an interview call?</h2></div><IimbUgSourceBadge source={result.callOutlook.benchmark == null ? "DATA_REQUIRED" : "ADMIN_CONFIGURED"} /></div>
      <div className="ug-outlook-grid">
        <article><span>Current 2027 PI cutoff</span><strong>{result.callOutlook.benchmark == null ? "Not yet available" : result.callOutlook.benchmark.toFixed(2)}</strong></article>
        <article><span>Previous first-shortlist</span><strong>{result.historicalShortlist.status === "PASS" ? "Cleared" : result.historicalShortlist.status === "FAIL" ? "Not cleared" : "Data required"}</strong></article>
        <article><span>Pre-PI estimate</span><strong>{prePiRange(result)}</strong></article>
      </div>
      <div className={`ug-outlook-callout ${interviewCallTone(result)}`}><span>Interview-call estimate</span><strong>{interviewCallEstimate(result)}</strong><p>{OUTLOOK_LABEL[result.callOutlook.label]}. {result.callOutlook.explanation}</p></div>
      <p className="ug-no-probability">No admission probability is shown: {result.probability.explanation}</p>
    </section>
  );
}
