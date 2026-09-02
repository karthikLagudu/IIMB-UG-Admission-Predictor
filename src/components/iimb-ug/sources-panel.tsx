import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

export function SourcesPanel({ result }: { result: IimbUgPredictionResult }) {
  return (
    <section className="ug-panel" aria-labelledby="ug-sources-heading">
      <div className="ug-panel-heading"><div><span>10 · Provenance</span><h2 id="ug-sources-heading">Assumptions & sources</h2></div><IimbUgSourceBadge source="OFFICIAL_CURRENT" /></div>
      <div className="ug-assumption-grid">
        <div><h3>Assumptions and known gaps</h3><ul>{result.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}</ul></div>
        <div><h3>Warnings for this result</h3><ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></div>
      </div>
      <div className="ug-source-list">{result.sources.map((source) => <article key={source.id}><div><IimbUgSourceBadge source={source.sourceType} /><span>Verified {source.verifiedAt}</span></div><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.notes ?? `Supports: ${source.supports.join(", ")}.`}</p></article>)}</div>
      <div className="ug-disclaimer"><p>This is an independent admission-planning tool and is not affiliated with or endorsed by the Indian Institute of Management Bangalore.</p><p>IIM Bangalore may modify eligibility conditions, examination rules, standardisation procedures, shortlist thresholds, reservation implementation, programme allocation and final admission criteria.</p><p>Historical benchmarks and planning estimates do not guarantee an interview or admission.</p></div>
    </section>
  );
}
