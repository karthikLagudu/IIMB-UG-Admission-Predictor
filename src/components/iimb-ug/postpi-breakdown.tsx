"use client";

import { useMemo, useState } from "react";
import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { FormulaDrawer } from "./formula-drawer";
import { IimbUgSourceBadge } from "./source-badge";

function fixed(value: number | null | undefined) {
  return value == null ? "Data required" : value.toFixed(2);
}

export function PostPiBreakdown({ result }: { result: IimbUgPredictionResult }) {
  const [piPercent, setPiPercent] = useState(result.postPi.selectedPiPercent);
  const piMax = result.postPi.components.find((component) => component.key === "PI")?.maxScore
    ?? Math.max(...result.postPi.scenarios.map((scenario) => scenario.piWeightedScore));
  const piWeighted = piPercent / 100 * piMax;
  const finalRange = useMemo(() => ({
    minimum: result.postPi.fixedMinimum == null ? null : result.postPi.fixedMinimum + piWeighted,
    maximum: result.postPi.fixedMaximum == null ? null : result.postPi.fixedMaximum + piWeighted,
  }), [piWeighted, result.postPi.fixedMaximum, result.postPi.fixedMinimum]);

  return (
    <section className="ug-panel" aria-labelledby="ug-final-heading">
      <div className="ug-panel-heading"><div><span>06 · Scenario planning</span><h2 id="ug-final-heading">Final score simulator</h2></div><IimbUgSourceBadge source="MODEL_ASSUMPTION" /></div>
      <div className="ug-pi-slider">
        <div><label htmlFor="ug-pi-performance">PI performance scenario</label><output htmlFor="ug-pi-performance">{piPercent}% · {piWeighted.toFixed(2)} / {piMax}</output></div>
        <input id="ug-pi-performance" type="range" min="0" max="100" step="1" value={piPercent} onChange={(event) => setPiPercent(Number(event.target.value))} />
        <div className="ug-preset-row" aria-label="PI scenario presets">
          {[40, 50, 60, 70, 80, 90, 100].map((preset) => <button className={preset === piPercent ? "active" : ""} type="button" key={preset} onClick={() => setPiPercent(preset)}>{preset}%</button>)}
        </div>
      </div>
      <div className="ug-score-list ug-final-list">
        {result.postPi.components.filter((component) => component.key !== "PI").map((component) => (
          <article key={component.key}><div><span>{component.label}</span><strong>{fixed(component.weightedValue)} <small>/ {component.maxScore}</small></strong></div><IimbUgSourceBadge source={component.sourceType} /><FormulaDrawer component={component} /></article>
        ))}
        <article><div><span>Personal Interview</span><strong>{piWeighted.toFixed(2)} <small>/ {piMax}</small></strong></div><IimbUgSourceBadge source="USER_INPUT" /></article>
      </div>
      <div className="ug-total-score"><div><span>Final composite</span><strong>{finalRange.minimum == null ? "Data required" : finalRange.maximum != null && finalRange.maximum !== finalRange.minimum ? `${finalRange.minimum.toFixed(2)}–${finalRange.maximum.toFixed(2)}` : finalRange.minimum.toFixed(2)} <small>/ 100</small></strong></div><span>Updates instantly</span></div>
      <h3 className="ug-subheading">PI scenarios</h3>
      <div className="ug-table-wrap"><table className="ug-table"><thead><tr><th>PI performance</th><th>PI / 40</th><th>Final composite</th></tr></thead><tbody>{result.postPi.scenarios.map((scenario) => <tr key={scenario.piPerformancePercent}><th>{scenario.piPerformancePercent}%</th><td>{scenario.piWeightedScore.toFixed(2)}</td><td>{scenario.finalCompositeMinimum == null ? "Data required" : scenario.finalCompositeMaximum !== scenario.finalCompositeMinimum && scenario.finalCompositeMaximum != null ? `${scenario.finalCompositeMinimum.toFixed(2)}–${scenario.finalCompositeMaximum.toFixed(2)}` : scenario.finalCompositeMinimum.toFixed(2)}</td></tr>)}</tbody></table></div>
      <div className="ug-required-pi">
        <div><span>Required PI weighted score</span><strong>{fixed(result.requiredPi.requiredWeightedScore)} / {piMax}</strong></div>
        <div><span>Required PI percentage</span><strong>{fixed(result.requiredPi.requiredPercent)}%</strong></div>
        <div><span>Status</span><strong>{result.requiredPi.status.replaceAll("_", " ")}</strong></div>
        <p>{result.requiredPi.explanation}</p>
      </div>
    </section>
  );
}
