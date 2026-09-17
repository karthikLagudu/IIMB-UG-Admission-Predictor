import type { Metadata } from "next";
import { BarChart3, BookOpenCheck, Calculator, ShieldCheck } from "lucide-react";
import { IimbUgWorkbench } from "@/components/iimb-ug/iimb-ug-workbench";

const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
const socialImage = configuredSiteUrl
  ? `${configuredSiteUrl.replace(/\/$/, "")}/og.png`
  : undefined;

export const metadata: Metadata = {
  title: "IIM Bangalore UG Category Cutoff Guide · 2027–31",
  description: "Check eligibility and see the previous-cycle first-shortlist thresholds for your category.",
  openGraph: {
    title: "IIM Bangalore UG Category Cutoff Guide",
    description: "Data Sciences & Economics · 2027–31 · Historical category-wise shortlist thresholds.",
    type: "website",
    ...(socialImage ? { images: [{ url: socialImage, width: 1200, height: 630, alt: "IIM Bangalore UG Admission Predictor" }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "IIM Bangalore UG Category Cutoff Guide",
    description: "Data Sciences & Economics · 2027–31 · Historical category-wise shortlist thresholds.",
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
            <h1><span>IIM Bangalore UG</span>{" "}<span className="ug-gradient-title">Category Cutoff Guide</span></h1>
            <h2>B.Sc. (Hons) Data Sciences &amp; Economics</h2>
            <p>Check eligibility, view your category’s previous-cycle first-shortlist thresholds, and understand how your academic profile contributes to later ranking. The 2027 interview-call cutoff is not published.</p>
          </div>
        </div>
      </section>
      <section className="ug-trust-strip" aria-label="Predictor capabilities">
        <div className="shell"><article><ShieldCheck aria-hidden="true" /><div><strong>Eligibility gates</strong><span>Age and academics</span></div></article><article><Calculator aria-hidden="true" /><div><strong>Category cutoff</strong><span>QADI and aggregate</span></div></article><article><BarChart3 aria-hidden="true" /><div><strong>Clear limits</strong><span>No invented call score</span></div></article><article><BookOpenCheck aria-hidden="true" /><div><strong>Source provenance</strong><span>Current vs historical</span></div></article></div>
      </section>
      <section className="ug-workspace-section"><div className="shell"><IimbUgWorkbench /></div></section>
    </div>
  );
}
