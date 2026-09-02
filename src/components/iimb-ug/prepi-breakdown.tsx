import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { FormulaDrawer } from "./formula-drawer";
import { IimbUgSourceBadge } from "./source-badge";

function value(value: number | null | undefined) {
  return value == null ? "Data required" : value.toFixed(2);
}

export function PrePiBreakdown({ result }: { result: IimbUgPredictionResult }) {
  const range = result.prePi.minimum == null
    ? "Data required"
    : result.prePi.maximum != null && result.prePi.maximum !== result.prePi.minimum
      ? `${result.prePi.minimum.toFixed(2)}–${result.prePi.maximum.toFixed(2)}`
      : result.prePi.minimum.toFixed(2);
  return (
    <section className="ug-panel" aria-labelledby="ug-prepi-heading">
      <div className="ug-panel-heading"><div><span>04 · Planning model</span><h2 id="ug-prepi-heading">Pre-PI analysis</h2></div><IimbUgSourceBadge source={result.prePi.status === "CALCULATED" ? "ADMIN_CONFIGURED" : result.prePi.status === "DATA_REQUIRED" ? "DATA_REQUIRED" : "MODEL_ASSUMPTION"} /></div>
      <div className="ug-score-list">
        {result.prePi.components.map((component) => (
          <article key={component.key}>
            <div><span>{component.label}</span><strong>{value(component.weightedValue)} <small>/ {component.maxScore}</small></strong></div>
            <IimbUgSourceBadge source={component.sourceType} />
            <FormulaDrawer component={component} />
          </article>
        ))}
      </div>
      <div className="ug-total-score"><div><span>Estimated Pre-PI</span><strong>{range} <small>/ 100</small></strong></div><span>{result.prePi.strategy.replaceAll("_", " ")}</span></div>
      <p className="ug-panel-note">Estimated components are planning aids. IIMB has published weights, but not the complete UG raw-to-weighted transformation or current qualifying-pool statistics.</p>
    </section>
  );
}
