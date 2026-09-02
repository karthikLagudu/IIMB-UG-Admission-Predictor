import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

function gate(value: boolean | null) {
  return value == null ? "DATA REQUIRED" : value ? "PASS" : "FAIL";
}

export function HistoricalBenchmark({ result }: { result: IimbUgPredictionResult }) {
  const historical = result.historicalShortlist;
  return (
    <section className="ug-panel ug-history-panel" aria-labelledby="ug-history-heading">
      <div className="ug-panel-heading"><div><span>03 · Context only</span><h2 id="ug-history-heading">Historical cutoff benchmark</h2></div><IimbUgSourceBadge source={historical.sourceType} /></div>
      <div className="ug-benchmark-grid">
        <div className="ug-benchmark-lead"><span>{historical.resolvedCategory.replace("NC_OBC", "NC-OBC")}</span><strong>Previous first-shortlist benchmark</strong><small>UG Test 2025 · batch 2026–30</small></div>
        <dl>
          <div><dt>Positive all sections</dt><dd>{gate(historical.sectionGatePass)}</dd></div>
          <div><dt>QADI percentile</dt><dd>{historical.qadiPercentile?.toFixed(3) ?? "Required"} / {historical.benchmark.qadiPercentileFloor} · {gate(historical.qadiPass)}</dd></div>
          <div><dt>Aggregate canonical</dt><dd>{result.exam.totalCanonical?.toFixed(3) ?? "Required"} / {historical.benchmark.aggregateCanonicalScoreFloor} · {gate(historical.aggregatePass)}</dd></div>
        </dl>
      </div>
      <p className="ug-caution">{historical.explanation} This does not mean the candidate has cleared the 2027 cutoff or secured an interview.</p>
    </section>
  );
}
