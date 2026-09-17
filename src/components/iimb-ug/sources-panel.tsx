import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

export function SourcesPanel({ result }: { result: IimbUgPredictionResult }) {
  return (
    <section className="ug-panel" aria-labelledby="ug-sources-heading">
      <div className="ug-panel-heading"><div><span>02 · Provenance</span><h2 id="ug-sources-heading">Assumptions & sources</h2></div><IimbUgSourceBadge source="OFFICIAL_CURRENT" /></div>
      <div className="ug-assumption-grid">
        <div><h3>What is published</h3><ul><li>The category-wise QADI and aggregate values are from the UG Test 2025 first shortlist.</li><li>A positive score in each of the three test sections is also required.</li></ul></div>
        <div><h3>How to use the estimate</h3><ul><li>The 2027 interview-call cutoffs and test-score normalization are unavailable.</li><li>The category’s estimated total uses an assumed 15% buffer; your profile points are subtracted to show the exam gap. It is a planning estimate, not a guaranteed safe score.</li></ul></div>
      </div>
      <div className="ug-source-list">{result.sources.map((source) => <article key={source.id}><div><IimbUgSourceBadge source={source.sourceType} /><span>Verified {source.verifiedAt}</span></div><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.notes ?? `Supports: ${source.supports.join(", ")}.`}</p></article>)}</div>
      <div className="ug-disclaimer"><p>This is an independent cutoff guide and is not affiliated with or endorsed by the Indian Institute of Management Bangalore.</p><p>IIM Bangalore may modify eligibility conditions, examination rules, standardisation procedures, shortlist thresholds and reservation implementation.</p><p>Historical first-shortlist benchmarks do not guarantee an interview call.</p></div>
    </section>
  );
}
