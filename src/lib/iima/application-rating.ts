import type {
  AcademicCategory,
  ApplicationRatingResult,
  CandidateInput,
  Gender,
  IimaPolicyConfig,
  RatingBand,
  Stream,
} from "@/types/iima";

function ratingForBands(percent: number, bands: RatingBand[]): number {
  const band = bands.find((candidate) =>
    candidate.maxInclusive == null ? true : percent <= candidate.maxInclusive,
  );
  if (!band) throw new Error(`No rating band configured for ${percent}`);
  return band.score;
}

export function calculateClass10Rating(
  percent: number,
  policy: IimaPolicyConfig,
): number {
  return ratingForBands(percent, policy.class10Bands);
}

export function calculateClass12Rating(
  percent: number,
  stream: Stream,
  policy: IimaPolicyConfig,
): number {
  return ratingForBands(percent, policy.class12Bands[stream]);
}

export function calculateBachelorRating(
  percentage: number,
  academicCategory: AcademicCategory,
  policy: IimaPolicyConfig,
): number {
  return ratingForBands(percentage, policy.bachelorBands[academicCategory]);
}

export function calculateProfessionalPercentage(candidate: CandidateInput): number {
  if (
    candidate.academicCategory === "AC_2" &&
    ["CA", "ICWA", "CMA", "CS"].includes(candidate.professionalQualification) &&
    candidate.professionalInterPercent != null &&
    candidate.professionalFinalPercent != null
  ) {
    return (candidate.professionalInterPercent + candidate.professionalFinalPercent) / 2;
  }
  if (
    candidate.academicCategory === "AC_2" &&
    candidate.professionalQualification === "FIAI" &&
    candidate.professionalAggregatePercent != null
  ) {
    return candidate.professionalAggregatePercent;
  }
  return candidate.bachelorPercent;
}

/** Official Table 5 work-experience rating, counted in completed months. */
export function calculateWorkExRating(months: number, policy: IimaPolicyConfig): number {
  const { minimumMonths, maximumRatedMonths, monthlyRate } = policy.workExperience;
  if (months < minimumMonths) return 0;
  if (months > maximumRatedMonths) return 5;
  return monthlyRate * (months - (minimumMonths - 1));
}

export function calculateGenderRating(gender: Gender, policy: IimaPolicyConfig): number {
  return policy.genderRatings[gender];
}

export function calculateApplicationRating(
  candidate: CandidateInput,
  policy: IimaPolicyConfig,
): ApplicationRatingResult {
  const effectiveBachelorPercent = calculateProfessionalPercentage(candidate);
  const result = {
    class10: calculateClass10Rating(candidate.class10Percent, policy),
    class12: calculateClass12Rating(candidate.class12Percent, candidate.class12Stream, policy),
    bachelor: calculateBachelorRating(
      effectiveBachelorPercent,
      candidate.academicCategory,
      policy,
    ),
    workExperience: calculateWorkExRating(candidate.workExperienceMonths, policy),
    gender: calculateGenderRating(candidate.gender, policy),
    effectiveBachelorPercent,
  };
  const total =
    result.class10 +
    result.class12 +
    result.bachelor +
    result.workExperience +
    result.gender;
  if (total < 0 || total > policy.arNormalizationDenominator) {
    throw new Error(`Application Rating ${total} is outside 0–${policy.arNormalizationDenominator}`);
  }
  return { ...result, total };
}
