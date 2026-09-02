import { TrendingUp } from "lucide-react";
import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

export function SensitivityAnalysis({ result }: { result: IimbUgPredictionResult }) {
  const ranked = [...result.sensitivity].sort((a, b) => b.prePiIncrease - a.prePiIncrease);
  return (
    <section className="ug-panel" aria-labelledby="ug-sensitivity-heading">
      <div className="ug-panel-heading"><div><span>07 · Optimisation</span><h2 id="ug-sensitivity-heading">Where can your Pre-PI score improve most?</h2></div><IimbUgSourceBadge source="DERIVED" /></div>
      <div className="ug-sensitivity-grid">{ranked.map((item, index) => <article key={item.section}>{index === 0 && <span className="ug-leverage-label"><TrendingUp size={14} aria-hidden="true" /> Highest leverage</span>}<strong>{item.section}</strong><b>+{item.prePiIncrease.toFixed(3)}</b><small>Pre-PI points per +{item.unitRawIncrease} canonical raw mark</small><p>{item.explanation}</p></article>)}</div>
      <p className="ug-panel-note">This compares score leverage in the transparent planning model. It is not an official marginal admission probability.</p>
    </section>
  );
}
