import { CheckCircle2, CircleAlert, Clock3 } from "lucide-react";
import type { IimbUgPredictionResult } from "@/types/iimb-ug";

export function ReadinessPanel({ result }: { result: IimbUgPredictionResult }) {
  const ready = result.readiness.filter((item) => item.status === "READY" || item.status === "NOT_REQUIRED").length;
  return (
    <section className="ug-panel" aria-labelledby="ug-readiness-heading">
      <div className="ug-panel-heading"><div><span>09 · Checklist</span><h2 id="ug-readiness-heading">Application readiness</h2></div><strong className="ug-readiness-count">{ready} / {result.readiness.length} resolved</strong></div>
      <div className="ug-readiness-list">{result.readiness.map((item) => <article key={item.key} className={`readiness-${item.status.toLowerCase()}`}>{item.status === "READY" || item.status === "NOT_REQUIRED" ? <CheckCircle2 aria-hidden="true" /> : item.status === "PENDING" ? <Clock3 aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}<div><strong>{item.label}</strong><span>{item.status.replaceAll("_", " ")}</span><p>{item.explanation}</p></div></article>)}</div>
    </section>
  );
}
