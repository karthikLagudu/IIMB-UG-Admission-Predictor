import { ArrowRight, GraduationCap } from "lucide-react";
import type { IimbUgPolicyConfig, IimbUgPredictionResult, Programme } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

function programmeName(programme: Programme, policy: IimbUgPolicyConfig) {
  return policy.programmes[programme].displayName;
}

export function ProgrammePreference({ result, policy }: { result: IimbUgPredictionResult; policy: IimbUgPolicyConfig }) {
  const preference = result.programmePreference;
  const ordered = [preference.preference1, preference.preference2].filter(Boolean) as Programme[];
  return (
    <section className="ug-panel" aria-labelledby="ug-programme-heading">
      <div className="ug-panel-heading"><div><span>08 · Programme allocation</span><h2 id="ug-programme-heading">Programme preference</h2></div><IimbUgSourceBadge source={preference.allocationStatus === "EVALUATED" ? "ADMIN_CONFIGURED" : "DATA_REQUIRED"} /></div>
      <div className="ug-programme-flow">
        {(ordered.length ? ordered : preference.targetProgrammes).map((programme, index) => <div key={programme}>{index > 0 && <ArrowRight aria-hidden="true" />}<article><GraduationCap aria-hidden="true" /><span>{ordered.length ? `Preference ${index + 1}` : "Target programme"}</span><strong>{programmeName(programme, policy)}</strong><small>{policy.programmes[programme].durationYears} years · {policy.programmes[programme].intake} published seats</small></article></div>)}
      </div>
      <p className="ug-caution"><strong>{preference.allocationStatus.replaceAll("_", " ")}.</strong> {preference.explanation}</p>
    </section>
  );
}
