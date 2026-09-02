import type { ScoreComponent } from "@/types/iimb-ug";
import { IimbUgSourceBadge } from "./source-badge";

export function FormulaDrawer({ component }: { component: ScoreComponent }) {
  return (
    <details className="ug-formula-drawer">
      <summary>How this was calculated</summary>
      <div>
        {component.rawValue != null && <p><strong>Input:</strong> {component.rawValue.toFixed(4)}</p>}
        {component.formula && <p><strong>Formula:</strong> <code>{component.formula}</code></p>}
        <p><strong>Method:</strong> {component.explanation}</p>
        <IimbUgSourceBadge source={component.sourceType} />
        {component.missingInputs?.length ? <p><strong>Missing:</strong> {component.missingInputs.join(", ")}</p> : null}
      </div>
    </details>
  );
}
