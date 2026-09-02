import type { AcademicCategory, IimbAcademicDiscipline, IimcAcademicProfile, ProfessionalQualification } from "@/types/iima";

export const ACADEMIC_CATEGORY_LABELS: Record<AcademicCategory, string> = {
  AC_1_PART_I: "AC-1 Part I — MBBS / MD (USA)",
  AC_1_PART_II: "AC-1 Part II — BAMS / BDS / BHMS",
  AC_2: "AC-2 — CA / CMA / CS / FIAI",
  AC_3: "AC-3 — Commerce / Economics / Management",
  AC_4: "AC-4 — Engineering / Science / Agriculture",
  AC_5: "AC-5 — Arts / Humanities / Law / Design",
  AC_6: "AC-6 — Other disciplines",
};

export const SMALL_AC_CATEGORIES: AcademicCategory[] = ["AC_1_PART_I", "AC_2", "AC_6"];

export interface DegreeOption {
  value: string;
  label: string;
  academicCategory: AcademicCategory;
  professionalQualification?: ProfessionalQualification;
}

export const DEGREE_OPTIONS: DegreeOption[] = [
  { value: "MBBS", label: "MBBS", academicCategory: "AC_1_PART_I" },
  { value: "MD (USA)", label: "MD (USA)", academicCategory: "AC_1_PART_I" },
  { value: "BAMS", label: "BAMS — Ayurvedic Medicine", academicCategory: "AC_1_PART_II" },
  { value: "BDS", label: "BDS — Dental Surgery", academicCategory: "AC_1_PART_II" },
  { value: "BHMS", label: "BHMS — Homeopathic Medicine", academicCategory: "AC_1_PART_II" },
  { value: "Chartered Accountancy", label: "Chartered Accountancy (CA)", academicCategory: "AC_2", professionalQualification: "CA" },
  { value: "Cost and Management Accountancy", label: "Cost and Management Accountancy (CMA)", academicCategory: "AC_2", professionalQualification: "CMA" },
  { value: "ICWA", label: "ICWA", academicCategory: "AC_2", professionalQualification: "ICWA" },
  { value: "Company Secretary", label: "Company Secretary (CS)", academicCategory: "AC_2", professionalQualification: "CS" },
  { value: "FIAI", label: "Fellow of the Institute of Actuaries of India (FIAI)", academicCategory: "AC_2", professionalQualification: "FIAI" },
  { value: "Bachelor of Commerce", label: "B.Com — Commerce", academicCategory: "AC_3" },
  { value: "Bachelor of Business Administration", label: "BBA — Business Administration", academicCategory: "AC_3" },
  { value: "Bachelor of Business Management", label: "BBM — Business Management", academicCategory: "AC_3" },
  { value: "Bachelor of Management Studies", label: "BMS — Management Studies", academicCategory: "AC_3" },
  { value: "Bachelor of Economics", label: "BA / BSc — Economics", academicCategory: "AC_3" },
  { value: "Bachelor of Finance Banking or Accounting", label: "Finance / Banking / Accounting degree", academicCategory: "AC_3" },
  { value: "B.Tech Computer Science", label: "B.E. / B.Tech — Computer Science / IT", academicCategory: "AC_4" },
  { value: "B.Tech Electronics or Electrical", label: "B.E. / B.Tech — Electronics / Electrical", academicCategory: "AC_4" },
  { value: "B.Tech Mechanical Civil or Chemical", label: "B.E. / B.Tech — Mechanical / Civil / Chemical", academicCategory: "AC_4" },
  { value: "Other Engineering or Technology degree", label: "Other Engineering / Technology degree", academicCategory: "AC_4" },
  { value: "B.Sc Mathematics Statistics or Computer Science", label: "B.Sc — Mathematics / Statistics / Computer Science", academicCategory: "AC_4" },
  { value: "B.Sc Physical or Life Sciences", label: "B.Sc — Physical / Life Sciences", academicCategory: "AC_4" },
  { value: "Bachelor of Computer Applications", label: "BCA — Computer Applications", academicCategory: "AC_4" },
  { value: "Bachelor of Pharmacy", label: "B.Pharm — Pharmacy", academicCategory: "AC_4" },
  { value: "Agriculture Forestry Dairy or Fisheries degree", label: "Agriculture / Forestry / Dairy / Fisheries degree", academicCategory: "AC_4" },
  { value: "Bachelor of Arts or Humanities", label: "BA — Arts / Humanities / Social Sciences", academicCategory: "AC_5" },
  { value: "Bachelor of Laws", label: "LLB / integrated Law degree", academicCategory: "AC_5" },
  { value: "Bachelor of Design or Fine Arts", label: "B.Des / BFA — Design / Fine Arts", academicCategory: "AC_5" },
  { value: "Journalism or Mass Communication degree", label: "Journalism / Mass Communication degree", academicCategory: "AC_5" },
  { value: "Other discipline not listed", label: "Other discipline / qualification not listed", academicCategory: "AC_6" },
];

export interface InstituteAcademicClassification {
  academicCategory: AcademicCategory;
  iimbAcademicDiscipline: IimbAcademicDiscipline;
  iimcAcademicProfile: IimcAcademicProfile;
}

export function classifyDegreeForInstitutes(option: DegreeOption): InstituteAcademicClassification {
  const engineeringDegree = option.value.startsWith("B.Tech") || option.value === "Other Engineering or Technology degree";
  const iimbAcademicDiscipline: IimbAcademicDiscipline = engineeringDegree
    ? "ENGINEERING_TECHNOLOGY"
    : option.academicCategory === "AC_1_PART_I" || option.academicCategory === "AC_1_PART_II" || option.academicCategory === "AC_4"
      ? "SCIENCE"
      : option.academicCategory === "AC_2" || option.academicCategory === "AC_3"
        ? "COMMERCE"
        : option.academicCategory === "AC_5"
          ? "ARTS_HUMANITIES"
          : "OTHER";

  return {
    academicCategory: option.academicCategory,
    iimbAcademicDiscipline,
    iimcAcademicProfile: option.academicCategory === "AC_2" ? "8" : engineeringDegree ? "1" : "2",
  };
}

export function isSmallAcademicCategory(category: AcademicCategory): boolean {
  return SMALL_AC_CATEGORIES.includes(category);
}
