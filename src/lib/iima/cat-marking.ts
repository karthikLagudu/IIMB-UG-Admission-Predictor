export interface CatSectionAnswers {
  mcqCorrect: number;
  mcqWrong: number;
  titaCorrect: number;
  titaWrong: number;
}

export interface CatSectionProjection extends CatSectionAnswers {
  attempted: number;
  marks: number;
}

export function calculateCatSectionProjection(answers: CatSectionAnswers): CatSectionProjection {
  return {
    ...answers,
    attempted: answers.mcqCorrect + answers.mcqWrong + answers.titaCorrect + answers.titaWrong,
    marks: (answers.mcqCorrect + answers.titaCorrect) * 3 - answers.mcqWrong,
  };
}
