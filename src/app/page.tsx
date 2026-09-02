import type { Metadata } from "next";
import { BarChart3, BookOpenCheck, Calculator, ShieldCheck } from "lucide-react";
import { IimbUgWorkbench } from "@/components/iimb-ug/iimb-ug-workbench";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const socialImage = configuredSiteUrl
  ? `${configuredSiteUrl.replace(/\/$/, "")}/og.png`
  : undefined;

export const metadata: Metadata = {
  title: "IIM Bangalore UG Admission Predictor · 2027–31",
  description: "Check IIM Bangalore undergraduate eligibility and explore source-aware UG Admission Test, Pre-PI, interview, and final-score scenarios.",
  openGraph: {
    title: "IIM Bangalore UG Admission Predictor",
    description: "Data Sciences & Economics · 2027–31 · Source-aware admission planning.",
    type: "website",
    ...(socialImage ? { images: [{ url: socialImage, width: 1200, height: 630, alt: "IIM Bangalore UG Admission Predictor" }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "IIM Bangalore UG Admission Predictor",
    description: "Data Sciences & Economics · 2027–31 · Source-aware admission planning.",
    ...(socialImage ? { images: [socialImage] } : {}),
  },
};

export default function IimbUgPage() {
  return (
    <div className="ug-page">
      <section className="ug-hero">
        <div className="shell">
          <div>
            <div className="ug-brand-kicker">Thinkplus IPMAT intelligence</div>
            <p className="ug-eyebrow">Independent planning tool · Not affiliated with IIM Bangalore</p>
            <h1><span>IIM Bangalore UG</span>{" "}<span className="ug-gradient-title">Admission Predictor</span></h1>
            <h2>B.Sc. (Hons) Data Sciences &amp; Economics</h2>
            <p>Check eligibility, benchmark your UG Admission Test performance, estimate your interview-call position and simulate your final admission score.</p>
          </div>
        </div>
      </section>
      <section className="ug-trust-strip" aria-label="Predictor capabilities">
        <div className="shell"><article><ShieldCheck aria-hidden="true" /><div><strong>Exact gates</strong><span>Age, academics, sections</span></div></article><article><Calculator aria-hidden="true" /><div><strong>Transparent maths</strong><span>Unit and canonical scoring</span></div></article><article><BarChart3 aria-hidden="true" /><div><strong>Scenario ranges</strong><span>No invented probability</span></div></article><article><BookOpenCheck aria-hidden="true" /><div><strong>Source provenance</strong><span>Current vs historical</span></div></article></div>
      </section>
      <section className="ug-workspace-section"><div className="shell"><IimbUgWorkbench /></div></section>
    </div>
  );
}
