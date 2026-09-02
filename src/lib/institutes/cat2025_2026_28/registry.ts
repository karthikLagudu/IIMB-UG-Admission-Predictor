import type { CandidateInput } from "@/types/iima";
import type { InstituteKey, InstitutePredictionResult } from "@/types/institutes";
import { IIMB_TEST_RUNTIME_DATA, predictIimbAdmission } from "@/lib/institutes/iimb/cat2025_2026_28";
import { IIMC_TEST_CYCLE_DATA, predictIimcAdmission } from "@/lib/institutes/iimc/cat2025_2026_28";
import { IIMBG_ENGINE, IIMBG_TEST_RUNTIME } from "./iimbg";
import { IIMG_ENGINE, IIMG_TEST_RUNTIME } from "./iimg";
import { IIMI_ENGINE, IIMI_TEST_RUNTIME } from "./iimi";
import { IIMJ_ENGINE, IIMJ_TEST_RUNTIME } from "./iimj";
import { IIMKASHIPUR_ENGINE, IIMKASHIPUR_TEST_RUNTIME } from "./iimkashipur";
import { IIMK_ENGINE, IIMK_TEST_RUNTIME } from "./iimk";
import { IIML_ENGINE, IIML_TEST_RUNTIME } from "./iiml";
import { IIMM_ENGINE, IIMM_TEST_RUNTIME } from "./iimm";
import { IIMN_ENGINE, IIMN_TEST_RUNTIME } from "./iimn";
import { IIMRAIPUR_ENGINE, IIMRAIPUR_TEST_RUNTIME } from "./iimraipur";
import { IIMRANCHI_ENGINE, IIMRANCHI_TEST_RUNTIME } from "./iimranchi";
import { IIMROHTAK_ENGINE, IIMROHTAK_TEST_RUNTIME } from "./iimrohtak";
import { IIMSAMBALPUR_ENGINE, IIMSAMBALPUR_TEST_RUNTIME } from "./iimsambalpur";
import { IIMSHILLONG_ENGINE, IIMSHILLONG_TEST_RUNTIME } from "./iimshillong";
import { IIMSIRMAUR_ENGINE, IIMSIRMAUR_TEST_RUNTIME } from "./iimsirmaur";
import { IIMTRICHY_ENGINE, IIMTRICHY_TEST_RUNTIME } from "./iimtrichy";
import { IIMUDAIPUR_ENGINE, IIMUDAIPUR_TEST_RUNTIME } from "./iimudaipur";
import { IIMV_ENGINE, IIMV_TEST_RUNTIME } from "./iimv";

export const ALL_INSTITUTE_KEYS: InstituteKey[] = [
  "IIMA", "IIMB", "IIMBG", "IIMC", "IIMG", "IIMI", "IIMJ", "IIMKASHIPUR", "IIMK", "IIML", "IIMM", "IIMN",
  "IIMRAIPUR", "IIMRANCHI", "IIMROHTAK", "IIMSAMBALPUR", "IIMSHILLONG", "IIMSIRMAUR", "IIMTRICHY", "IIMUDAIPUR", "IIMV",
];

export const NON_IIMA_INSTITUTE_KEYS = ALL_INSTITUTE_KEYS.filter((key): key is Exclude<InstituteKey, "IIMA"> => key !== "IIMA");

type Predictor = (candidate: CandidateInput, useTestModel: boolean) => InstitutePredictionResult;

const predictors: Record<Exclude<InstituteKey, "IIMA">, Predictor> = {
  IIMB: (candidate, useTestModel) => predictIimbAdmission(candidate, useTestModel ? IIMB_TEST_RUNTIME_DATA : undefined),
  IIMC: (candidate, useTestModel) => predictIimcAdmission(candidate, useTestModel ? IIMC_TEST_CYCLE_DATA : undefined),
  IIMBG: (candidate, useTestModel) => IIMBG_ENGINE.predict(candidate, useTestModel ? IIMBG_TEST_RUNTIME : undefined),
  IIMG: (candidate, useTestModel) => IIMG_ENGINE.predict(candidate, useTestModel ? IIMG_TEST_RUNTIME : undefined),
  IIMI: (candidate, useTestModel) => IIMI_ENGINE.predict(candidate, useTestModel ? IIMI_TEST_RUNTIME : undefined),
  IIMJ: (candidate, useTestModel) => IIMJ_ENGINE.predict(candidate, useTestModel ? IIMJ_TEST_RUNTIME : undefined),
  IIMKASHIPUR: (candidate, useTestModel) => IIMKASHIPUR_ENGINE.predict(candidate, useTestModel ? IIMKASHIPUR_TEST_RUNTIME : undefined),
  IIMK: (candidate, useTestModel) => IIMK_ENGINE.predict(candidate, useTestModel ? IIMK_TEST_RUNTIME : undefined),
  IIML: (candidate, useTestModel) => IIML_ENGINE.predict(candidate, useTestModel ? IIML_TEST_RUNTIME : undefined),
  IIMM: (candidate, useTestModel) => IIMM_ENGINE.predict(candidate, useTestModel ? IIMM_TEST_RUNTIME : undefined),
  IIMN: (candidate, useTestModel) => IIMN_ENGINE.predict(candidate, useTestModel ? IIMN_TEST_RUNTIME : undefined),
  IIMRAIPUR: (candidate, useTestModel) => IIMRAIPUR_ENGINE.predict(candidate, useTestModel ? IIMRAIPUR_TEST_RUNTIME : undefined),
  IIMRANCHI: (candidate, useTestModel) => IIMRANCHI_ENGINE.predict(candidate, useTestModel ? IIMRANCHI_TEST_RUNTIME : undefined),
  IIMROHTAK: (candidate, useTestModel) => IIMROHTAK_ENGINE.predict(candidate, useTestModel ? IIMROHTAK_TEST_RUNTIME : undefined),
  IIMSAMBALPUR: (candidate, useTestModel) => IIMSAMBALPUR_ENGINE.predict(candidate, useTestModel ? IIMSAMBALPUR_TEST_RUNTIME : undefined),
  IIMSHILLONG: (candidate, useTestModel) => IIMSHILLONG_ENGINE.predict(candidate, useTestModel ? IIMSHILLONG_TEST_RUNTIME : undefined),
  IIMSIRMAUR: (candidate, useTestModel) => IIMSIRMAUR_ENGINE.predict(candidate, useTestModel ? IIMSIRMAUR_TEST_RUNTIME : undefined),
  IIMTRICHY: (candidate, useTestModel) => IIMTRICHY_ENGINE.predict(candidate, useTestModel ? IIMTRICHY_TEST_RUNTIME : undefined),
  IIMUDAIPUR: (candidate, useTestModel) => IIMUDAIPUR_ENGINE.predict(candidate, useTestModel ? IIMUDAIPUR_TEST_RUNTIME : undefined),
  IIMV: (candidate, useTestModel) => IIMV_ENGINE.predict(candidate, useTestModel ? IIMV_TEST_RUNTIME : undefined),
};

export function predictInstituteAdmission(
  institute: Exclude<InstituteKey, "IIMA">,
  candidate: CandidateInput,
  useTestModel = false,
): InstitutePredictionResult {
  return predictors[institute](candidate, useTestModel);
}

export function predictAllNonIimaInstitutes(candidate: CandidateInput, useTestModel = false): InstitutePredictionResult[] {
  return NON_IIMA_INSTITUTE_KEYS.map((institute) => predictInstituteAdmission(institute, candidate, useTestModel));
}

