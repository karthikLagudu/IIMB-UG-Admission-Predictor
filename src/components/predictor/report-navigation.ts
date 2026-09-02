export type ReportSection = "quick" | "strengths" | "audit" | "history";

export interface ReportNavigationRequest {
  section: ReportSection;
  requestId: number;
}

export const REPORT_SECTION_IDS: Record<ReportSection, string> = {
  quick: "report-quick-verdict",
  strengths: "report-strengths-gaps",
  audit: "report-detailed-audit",
  history: "report-historical-comparison",
};
