import { CheckCircle2, CircleAlert, Clock3, XCircle } from "lucide-react";
import type { IimbUgPredictionResult, RuleResult } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

function icon(status: RuleResult["status"]) {
  if (status === "PASS") return <CheckCircle2 aria-hidden="true" />;
  if (status === "FAIL") return <XCircle aria-hidden="true" />;
  if (status === "PROVISIONAL") return <Clock3 aria-hidden="true" />;
  return <CircleAlert aria-hidden="true" />;
}

export function EligibilityPanel({ result }: { result: IimbUgPredictionResult }) {
  const rules = [
    result.eligibility.age,
    ...result.eligibility.academics.primaryRules,
    result.eligibility.class12,
  ];
  return (
    <section className="ug-panel" aria-labelledby="ug-eligibility-heading">
      <div className="ug-panel-heading">
        <div><span>01 · Rules</span><h2 id="ug-eligibility-heading">Academic eligibility</h2></div>
        <strong className={`ug-status-pill status-${result.eligibility.status.toLowerCase()}`}>{result.eligibility.status.replaceAll("_", " ")}</strong>
      </div>
      <div className="ug-rule-grid">
        {rules.map((rule) => (
          <article className={`ug-rule-card rule-${rule.status.toLowerCase()}`} key={rule.key}>
            {icon(rule.status)}
            <div><span>{rule.label}</span><strong>{rule.status.replaceAll("_", " ")}</strong><small>{rule.explanation}</small></div>
          </article>
        ))}
      </div>
      <div className="ug-conflict-note">
        <IimbUgSourceBadge source="SOURCE_CONFLICT" />
        <p>{result.eligibility.academics.explanation}</p>
        <p><strong>Formal procedure:</strong> {result.eligibility.academics.primaryEligibility ? "Pass" : "Fail"} · <strong>FAQ interpretation:</strong> {result.eligibility.academics.alternateEligibility == null ? "Data required" : result.eligibility.academics.alternateEligibility ? "Pass" : "Fail"}</p>
      </div>
    </section>
  );
}
