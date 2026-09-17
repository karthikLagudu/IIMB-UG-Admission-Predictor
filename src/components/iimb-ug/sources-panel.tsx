import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

export function SourcesPanel({ result }: { result: IimbUgPredictionResult }) {
  return (
    <section className="ug-panel" aria-labelledby="ug-sources-heading">
      <div className="ug-panel-heading"><div><span>02 · Provenance</span><h2 id="ug-sources-heading">Assumptions & sources</h2></div><IimbUgSourceBadge source="OFFICIAL_CURRENT" /></div>
      <div className="ug-assumption-grid">
        <div><h3>What the percentile means</h3><ul><li>The displayed QADI percentile is the published previous-cycle first-shortlist minimum for your category.</li><li>The same category cutoff applies regardless of academic profile; academics matter in the later Pre-PI ranking.</li></ul></div>
        <div><h3>What is still unknown</h3><ul><li>The 2027 category-wise interview-call percentile has not been published.</li><li>A QADI percentile alone cannot establish whether you will receive an interview call.</li></ul></div>
      </div>
      <div className="ug-source-list">{result.sources.filter((source) => source.id === "iimb-ug-2027-procedure" || source.id === "iimb-ug-2027-faq" || source.id === "iimb-ug-2027-dates").map((source) => <article key={source.id}><div><IimbUgSourceBadge source={source.sourceType} /><span>Verified {source.verifiedAt}</span></div><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.id === "iimb-ug-2027-procedure" ? "Source for the historical category-wise QADI percentile table and current eligibility rules." : source.notes ?? `Supports: ${source.supports.join(", ")}.`}</p></article>)}</div>
      <div className="ug-disclaimer"><p>This is an independent category-cutoff guide and is not affiliated with or endorsed by the Indian Institute of Management Bangalore.</p><p>IIM Bangalore may modify eligibility conditions, examination rules, shortlist thresholds and reservation implementation.</p><p>Meeting a historical first-shortlist percentile does not guarantee an interview call.</p></div>
    </section>
  );
}
