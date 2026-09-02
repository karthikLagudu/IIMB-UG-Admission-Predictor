import type { IimbUgPredictionResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

function score(value: number | null) {
  return value == null ? "Data required" : value.toFixed(2);
}

export function ExamScorePanel({ result }: { result: IimbUgPredictionResult }) {
  const sections = [result.exam.varc, result.exam.lr, result.exam.qadi];
  const totalMaximum = sections.reduce((sum, section) => sum + section.maxCanonical, 0);
  return (
    <section className="ug-panel" aria-labelledby="ug-exam-heading">
      <div className="ug-panel-heading"><div><span>02 · Performance</span><h2 id="ug-exam-heading">UG Test score</h2></div><IimbUgSourceBadge source="DERIVED" /></div>
      <div className="ug-table-wrap">
        <table className="ug-table ug-exam-table">
          <thead><tr><th>Section</th><th>Correct</th><th>Wrong</th><th>Unit raw</th><th>Canonical</th><th>Max</th><th>Status</th></tr></thead>
          <tbody>
            {sections.map((section) => <tr key={section.key}><th>{section.key}</th><td>{section.correct ?? "—"}</td><td>{section.wrong ?? "—"}</td><td>{score(section.rawUnit)}</td><td>{score(section.rawCanonical)}</td><td>{section.maxCanonical}</td><td><strong className={section.positive ? "ug-pass" : "ug-fail"}>{section.positive == null ? "DATA REQUIRED" : section.positive ? "PASS" : "FAIL"}</strong></td></tr>)}
            <tr className="ug-total-row"><th>Total</th><td>—</td><td>—</td><td>{score(result.exam.totalUnit)}</td><td>{score(result.exam.totalCanonical)}</td><td>{totalMaximum}</td><td>{result.exam.positiveGate == null ? "DATA REQUIRED" : result.exam.positiveGate ? "ALL POSITIVE" : "SECTION GATE FAILED"}</td></tr>
          </tbody>
        </table>
      </div>
      <p className="ug-panel-note">Canonical +3/−1 is exactly three times the confirmed +1/−⅓ unit scale. Each section must be strictly positive; zero fails.</p>
    </section>
  );
}
