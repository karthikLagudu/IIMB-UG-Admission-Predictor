import { PolicyAdmin } from "@/components/admin/policy-admin";
import { IIMA_CAT_2025_POLICY } from "@/lib/iima/constants";

export default function AdminPage() {
  return (
    <>
      <section className="page-hero"><div className="shell"><p className="eyebrow">Policy administration</p><h1 className="page-title">Versioned configuration</h1><p>Update cut-offs, rating tables, AC mappings, observed shortlist boundaries, benchmarks and model parameters without changing historical predictions.</p></div></section>
      <section className="content-section"><div className="shell"><PolicyAdmin defaultPolicy={IIMA_CAT_2025_POLICY} /></div></section>
    </>
  );
}
