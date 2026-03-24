import { LineId } from "@/data/index";

export type GameMode = "complete-the-line" | "lines-to-name" | "name-to-lines";
export type Difficulty = "easy" | "medium" | "hard";

// easy:   multiple choice, distractors from same line / 6 visible lines
// medium: multiple choice, distractors from all stations / 10 visible lines
// hard:   free text input (complete-the-line, lines-to-name) or all line buttons (name-to-lines)

export type MultipleChoiceQuestion = {
  type: "multiple-choice";
  mode: GameMode;
  prompt: CompleteTheLinePrompt | LinesToNamePrompt | NameToLinesPrompt;
  options: string[];       // 4 station names to pick from
  correctAnswer: string;
};

export type FreeTextQuestion = {
  type: "free-text";
  mode: "complete-the-line" | "lines-to-name";
  prompt: CompleteTheLinePrompt | LinesToNamePrompt;
  correctAnswer: string;
};

export type LineSelectQuestion = {
  type: "line-select";
  mode: "name-to-lines";
  prompt: NameToLinesPrompt;
  visibleLines: LineId[];  // which line buttons to show (6 on easy, all 16 on hard)
  correctLines: LineId[];
};

export type Question = MultipleChoiceQuestion | FreeTextQuestion | LineSelectQuestion;

// --- Prompt types per game mode ---

export type CompleteTheLinePrompt = {
  kind: "complete-the-line";
  lineId: LineId;
  context: string[];   // 2-3 stations shown in order
};

export type LinesToNamePrompt = {
  kind: "lines-to-name";
  lines: LineId[];
};

export type NameToLinesPrompt = {
  kind: "name-to-lines";
  stationName: string;
};
