import type { Metadata } from "next";
import { IimbUgPolicyAdmin } from "@/components/iimb-ug/policy-admin";
import { EMPTY_IIMB_UG_RUNTIME_DATA, IIMB_UG_2027_POLICY } from "@/lib/iimb-ug/2027_31/policy";

export const metadata: Metadata = { title: "IIMB UG Policy Administration" };

export default function IimbUgAdminPage() {
  return (
    <div className="ug-admin-page">
      <section className="page-hero"><div className="shell"><p className="eyebrow">IIM Bangalore undergraduate policy administration</p><h1 className="page-title">Versioned rules and runtime data</h1><p>Publish new policy and observation snapshots without rewriting prior prediction results. Unknown values remain null or absent.</p></div></section>
      <section className="content-section"><div className="shell"><IimbUgPolicyAdmin defaultPolicy={IIMB_UG_2027_POLICY} defaultRuntime={EMPTY_IIMB_UG_RUNTIME_DATA} /></div></section>
    </div>
  );
}
