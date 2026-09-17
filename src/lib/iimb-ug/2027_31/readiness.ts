import type { IimbUgCandidateInput, ReadinessItem } from "@/types/iimb-ug";

function item(
  key: string,
  label: string,
  status: ReadinessItem["status"],
  explanation: string,
): ReadinessItem {
  return { key, label, status, explanation };
}

export function calculateApplicationReadiness(
  candidate: IimbUgCandidateInput,
  eligibility: { agePass: boolean; academicsPass: boolean },
): ReadinessItem[] {
  const certificateRequired = candidate.category !== "GENERAL";
  const class10MarksReady = candidate.class10OverallPercent >= 60 && candidate.class10MathPercent != null && candidate.class10MathPercent >= 60;
  return [
    item("age", "Age eligibility", eligibility.agePass ? "READY" : "VERIFY", eligibility.agePass ? "Age rule passes." : "Age rule must be verified or fails."),
    item("class10Marks", "Class X marks", candidate.class10MathPercent == null ? "VERIFY" : class10MarksReady ? "READY" : "MISSING", candidate.class10MathPercent == null ? "Class X Mathematics marks are required to check the 60% initial academic filter." : class10MarksReady ? "Class X overall and Mathematics both meet the 60% site filter." : "Class X overall or Mathematics is below the 60% site filter."),
    item("math11", "Mathematics XI", candidate.studiedMathClass11 ? "READY" : "MISSING", "Mathematics in Class XI is required."),
    item("math12", "Mathematics XII", candidate.studiedMathClass12 ? "READY" : "MISSING", "Mathematics in Class XII is required."),
    item("class12Status", "Class XII status", candidate.class12Status === "PASSED" ? "READY" : "PENDING", candidate.class12Status === "PASSED" ? "Reported passed." : "Provisional until the final certificate is submitted."),
    item("class10Document", "Class X certificate", candidate.class10DocumentReady ? "READY" : "MISSING", "Class X transcript/certificate is required."),
    item("class12Document", "Class XII document", candidate.class12DocumentReady ? "READY" : candidate.class12Status === "PASSED" ? "MISSING" : "PENDING", "Class XII transcript/certificate is required."),
    item("sop", "Statement of purpose", candidate.sopReady ? "READY" : "MISSING", "A statement of purpose is required."),
    item("categoryCertificate", "Category certificate", !certificateRequired ? "NOT_REQUIRED" : candidate.categoryCertificateReady ? "READY" : "MISSING", certificateRequired ? "A current category certificate is required." : "Not required for General category."),
    item("pwdCertificate", "PwD certificate", !candidate.pwd ? "NOT_REQUIRED" : candidate.pwdCertificateReady ? "READY" : "MISSING", candidate.pwd ? "Relevant disability certificate is required." : "Not required."),
    item("udid", "UDID card", !candidate.pwd ? "NOT_REQUIRED" : candidate.udidReady ? "READY" : "MISSING", candidate.pwd ? "A UDID card is required for PwD applicants." : "Not required."),
    item("reference1", "Reference 1", candidate.reference1Ready ? "READY" : "MISSING", "A teacher reference submitted online is mandatory after Stage I."),
    item("reference2", "Reference 2", candidate.reference2Ready ? "READY" : "MISSING", "A second teacher reference submitted online is mandatory after Stage I."),
  ];
}
