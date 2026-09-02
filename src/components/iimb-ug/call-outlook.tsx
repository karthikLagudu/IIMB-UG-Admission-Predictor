import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

const OUTLOOK_LABEL: Record<IimbUgPredictionResult["callOutlook"]["label"], string> = {
  INELIGIBLE: "Not eligible under the primary current-cycle rule",
  SECTION_GATE_FAILED: "Sectional gate failed",
  BELOW_HISTORICAL_FIRST_SHORTLIST: "Below the previous first-shortlist benchmark",
  MEETS_HISTORICAL_FIRST_SHORTLIST: "Meets the previous benchmark",
  CURRENT_THRESHOLD_UNKNOWN: "Potentially competitive; exact current threshold unavailable",
  BORDERLINE_ESTIMATE: "Borderline planning estimate",
  COMPETITIVE_ESTIMATE: "Competitive planning estimate",
  STRONG_ESTIMATE: "Strong planning estimate",
  DATA_INSUFFICIENT: "More data required",
};

function prePiRange(result: IimbUgPredictionResult) {
  if (result.prePi.minimum == null) return "Data required";
  return result.prePi.maximum !== result.prePi.minimum && result.prePi.maximum != null
    ? `${result.prePi.minimum.toFixed(2)}–${result.prePi.maximum.toFixed(2)}`
    : result.prePi.minimum.toFixed(2);
}

export function CallOutlookPanel({ result }: { result: IimbUgPredictionResult }) {
  return (
    <section className="ug-panel ug-outlook-panel" aria-labelledby="ug-outlook-heading">
      <div className="ug-panel-heading"><div><span>05 · Interview outlook</span><h2 id="ug-outlook-heading">Where you stand</h2></div><IimbUgSourceBadge source={result.callOutlook.benchmark == null ? "DATA_REQUIRED" : "ADMIN_CONFIGURED"} /></div>
      <div className="ug-outlook-grid">
        <article><span>Current 2027 PI cutoff</span><strong>{result.callOutlook.benchmark == null ? "Not yet available" : result.callOutlook.benchmark.toFixed(2)}</strong></article>
        <article><span>Previous first-shortlist</span><strong>{result.historicalShortlist.status === "PASS" ? "Cleared" : result.historicalShortlist.status === "FAIL" ? "Not cleared" : "Data required"}</strong></article>
        <article><span>Pre-PI estimate</span><strong>{prePiRange(result)}</strong></article>
      </div>
      <div className="ug-outlook-callout"><span>Outlook</span><strong>{OUTLOOK_LABEL[result.callOutlook.label]}</strong><p>{result.callOutlook.explanation}</p></div>
      <p className="ug-no-probability">No admission probability is shown: {result.probability.explanation}</p>
    </section>
  );
}
