import type { InstituteKey } from "@/types/institutes";

export type NonIimaInstituteKey = Exclude<InstituteKey, "IIMA">;

export interface HistoricalCatScreen {
  category: "General";
  overall: number | null;
  varc: number | null;
  dilr: number | null;
  qa: number | null;
}

export interface InstituteHistoricalCycle {
  batch: string;
  catYear: number;
  recordLabel: string;
  officialUrl?: string;
  catScreen?: HistoricalCatScreen;
  note: string;
  noPriorCycle?: boolean;
}

export interface InstituteHistoricalReference {
  recordLabel: string;
  boundaryLabel: string;
  studentScoreLabel: string;
  cycles: InstituteHistoricalCycle[];
}

const CAP_2024_SOURCE = "https://iimranchi.ac.in/media/2024/04/MBA_2024-26.pdf";
const CAP_2024_GENERAL = catScreen(94, 73, 73, 73);
const UNPUBLISHED_BOUNDARY = "The official policy gives screening rules, but not the final category-wise composite score of the last candidate called for interview.";
const NO_COMPARABLE_RECORD = "No comparable fixed interview-call composite boundary is available in the configured official record for this cycle.";

const SOURCES = {
  IIMB_2025: "https://www.iimb.ac.in/admissions/pgp-admissions/admission-process",
  IIMB_2024: "https://www.iimb.ac.in/sites/default/files/inline-files/PGP-Admission-process-2024.pdf",
  IIMC_2024: "https://application.iimcal.ac.in/node/494",
  IIMI_2024: "https://iimidr.ac.in/wp-content/uploads/2024/08/Admissions-Procedure-PGP-2024-26-Batch-3.pdf",
  IIMK_2024: "https://iimk.ac.in/academic-programmes/pgp/eligibility-pgp-adm",
  IIML_2024: "https://www.iiml.ac.in/sites/default/files/upload/news/1469691026IIML%20Admission%20Policy%202024-26_CAT-2023.pdf",
  IIMROHTAK_2025: "https://www.iimrohtak.ac.in/panel/assets/images/prospectus/17038426332257.pdf",
  IIMSHILLONG_2024: "https://www.iimshillong.ac.in/wp-content/uploads/2023/11/PGP-2024-26-Admission-Process.pdf",
  IIMG_FIRST: "https://www.iimg.ac.in/admission-process/",
  IIMKASHIPUR_REPORT: "https://www.iimkashipur.ac.in/uploads/rti/176760553061.pdf",
} as const;

export const INSTITUTE_HISTORICAL_REFERENCES: Record<NonIimaInstituteKey, InstituteHistoricalReference> = {
  IIMB: reference("Previous PGP interview-shortlist records", "Current pre-PI estimate", [
    cycle("PGP 2025-27", 2024, "First-shortlist policy", SOURCES.IIMB_2025, catScreen(85, 80, 75, 75)),
    cycle("PGP 2024-26", 2023, "First-shortlist policy", SOURCES.IIMB_2024, catScreen(85, 80, 80, 80)),
    unavailableCycle("PGP 2023-25", 2022),
  ]),
  IIMC: reference("Previous MBA interview-shortlist records", "Current Stage-II CS", [
    unavailableCycle("MBA 2025-27", 2024),
    cycle("MBA 2024-26", 2023, "Stage-I CAT screen", SOURCES.IIMC_2024, catScreen(85, 80, 80, 75)),
    unavailableCycle("MBA 2023-25", 2022),
  ]),
  IIMBG: capReference("MBA"),
  IIMG: reference("Institute admission history", "Current direct-merit score", [
    {
      batch: "MBA 2026-28",
      catYear: 2025,
      recordLabel: "Inaugural admission cycle",
      officialUrl: SOURCES.IIMG_FIRST,
      note: "IIM Guwahati was inaugurated in 2026, so there are no earlier IIM Guwahati MBA admission cycles to compare.",
      noPriorCycle: true,
    },
  ]),
  IIMI: reference("Previous PGP interview-shortlist records", "Current shortlist score", [
    unavailableCycle("PGP 2025-27", 2024),
    cycle("PGP 2024-26", 2023, "Stage-I CAT screen", SOURCES.IIMI_2024, catScreen(90, 80, 80, 80)),
    unavailableCycle("PGP 2023-25", 2022),
  ]),
  IIMJ: capReference("MBA"),
  IIMKASHIPUR: reference("Previous MBA admission records", "Current shortlist score", [
    unavailableCycle("MBA 2025-27", 2024),
    {
      ...cycle("MBA 2024-26", 2023, "CAP screen and admitted-batch record", SOURCES.IIMKASHIPUR_REPORT, CAP_2024_GENERAL),
      note: "CAP 2024 used the published CAT screen. IIM Kashipur's annual report also records a 94.00 minimum CAT percentile among admitted General-category students; this is an admitted-batch statistic, not an interview-call composite cutoff.",
    },
    unavailableCycle("MBA 2023-25", 2022),
  ]),
  IIMK: reference("Previous PGP interview-shortlist records", "Current shortlist score", [
    unavailableCycle("PGP 2025-27", 2024),
    cycle("PGP 2024-26", 2023, "Minimum eligibility screen", SOURCES.IIMK_2024, catScreen(85, 75, 75, 75)),
    unavailableCycle("PGP 2023-25", 2022),
  ]),
  IIML: reference("Previous MBA interview-shortlist records", "Current shortlist score", [
    unavailableCycle("MBA 2025-27", 2024),
    cycle("MBA 2024-26", 2023, "WAT-PI eligibility screen", SOURCES.IIML_2024, catScreen(90, 85, 85, 85)),
    unavailableCycle("MBA 2023-25", 2022),
  ]),
  IIMM: standardReference("MBA"),
  IIMN: capReference("MBA"),
  IIMRAIPUR: capReference("MBA"),
  IIMRANCHI: capReference("MBA"),
  IIMROHTAK: reference("Previous PGP interview-registration records", "Current shortlist score", [
    cycle("PGP 2025-27", 2024, "PI registration eligibility screen", SOURCES.IIMROHTAK_2025, catScreen(97, null, null, null)),
    unavailableCycle("PGP 2024-26", 2023),
    unavailableCycle("PGP 2023-25", 2022),
  ]),
  IIMSAMBALPUR: capReference("MBA"),
  IIMSHILLONG: reference("Previous PGP interview-shortlist records", "Current shortlist score", [
    unavailableCycle("PGP 2025-27", 2024),
    cycle("PGP 2024-26", 2023, "PI preliminary screen", SOURCES.IIMSHILLONG_2024, catScreen(null, 75, 75, 75)),
    unavailableCycle("PGP 2023-25", 2022),
  ]),
  IIMSIRMAUR: capReference("MBA"),
  IIMTRICHY: capReference("PGPM"),
  IIMUDAIPUR: capReference("MBA"),
  IIMV: standardReference("PGP"),
};

function reference(recordLabel: string, studentScoreLabel: string, cycles: InstituteHistoricalCycle[]): InstituteHistoricalReference {
  return { recordLabel, boundaryLabel: "Interview-call composite boundary", studentScoreLabel, cycles };
}

function catScreen(overall: number | null, varc: number | null, dilr: number | null, qa: number | null): HistoricalCatScreen {
  return { category: "General", overall, varc, dilr, qa };
}

function cycle(batch: string, catYear: number, recordLabel: string, officialUrl: string, screen: HistoricalCatScreen): InstituteHistoricalCycle {
  return { batch, catYear, recordLabel, officialUrl, catScreen: screen, note: UNPUBLISHED_BOUNDARY };
}

function unavailableCycle(batch: string, catYear: number): InstituteHistoricalCycle {
  return { batch, catYear, recordLabel: "Official admission cycle", note: NO_COMPARABLE_RECORD };
}

function standardReference(programme: string): InstituteHistoricalReference {
  return reference(`Previous ${programme} admission records`, "Current shortlist score", [
    unavailableCycle(`${programme} 2025-27`, 2024),
    unavailableCycle(`${programme} 2024-26`, 2023),
    unavailableCycle(`${programme} 2023-25`, 2022),
  ]);
}

function capReference(programme: string): InstituteHistoricalReference {
  return reference(`Previous ${programme} admission and CAP records`, "Current shortlist score", [
    unavailableCycle(`${programme} 2025-27`, 2024),
    cycle(`${programme} 2024-26`, 2023, "CAP 2024 first screen", CAP_2024_SOURCE, CAP_2024_GENERAL),
    unavailableCycle(`${programme} 2023-25`, 2022),
  ]);
}

export function instituteHistoricalReference(institute: NonIimaInstituteKey): InstituteHistoricalReference {
  return INSTITUTE_HISTORICAL_REFERENCES[institute];
}
