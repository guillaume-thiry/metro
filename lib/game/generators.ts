import { lines, stationList, LINE_IDS, LineId, activeLines, LINE_WEIGHTS } from "@/data/index";
import { POST_FORK_STATIONS } from "@/data/lines";
import {
  Difficulty,
  Question,
  MultipleChoiceQuestion,
  FreeTextQuestion,
  LineSelectQuestion,
} from "./types";

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Pick N distinct items from an array, excluding a set of values.
function sampleExcluding<T>(arr: T[], n: number, exclude: T[]): T[] {
  const pool = arr.filter((x) => !exclude.includes(x));
  return shuffle(pool).slice(0, n);
}

// --- Complete the line ---

export function generateCompleteTheLine(difficulty: Difficulty): Question {
  // Pick a complete line with enough stations, weighted by station count.
  const eligibleLines = activeLines.filter((id) => lines[id].length >= 4);
  const weight = (id: LineId) => lines[id].length * (LINE_WEIGHTS[id] ?? 1);
  const totalStations = eligibleLines.reduce((sum, id) => sum + weight(id), 0);
  let r = Math.random() * totalStations;
  let lineId = eligibleLines[0];
  for (const id of eligibleLines) {
    r -= weight(id);
    if (r <= 0) { lineId = id; break; }
  }
  const stationSeq = Math.random() < 0.5 ? lines[lineId] : [...lines[lineId]].reverse();

  // Both variants need 3 consecutive stations.
  const maxStart = stationSeq.length - 3;
  const allStartIndices = Array.from({ length: maxStart + 1 }, (_, i) => i);

  // For "next", the answer is stationSeq[startIdx + 2]. Post-fork stations are ambiguous
  // (two valid next stations exist), so exclude those start indices.
  const nextValidIndices = allStartIndices.filter(
    (i) => !POST_FORK_STATIONS.includes(stationSeq[i + 2])
  );

  // Fall back to "middle" if no valid "next" indices exist (shouldn't happen in practice).
  const variant: "next" | "middle" =
    nextValidIndices.length > 0 && Math.random() < 0.5 ? "next" : "middle";

  let startIdx: number;
  let context: string[];
  let correctAnswer: string;

  if (variant === "next") {
    startIdx = nextValidIndices[Math.floor(Math.random() * nextValidIndices.length)];
    context = [stationSeq[startIdx], stationSeq[startIdx + 1]];
    correctAnswer = stationSeq[startIdx + 2];
  } else {
    startIdx = allStartIndices[Math.floor(Math.random() * allStartIndices.length)];
    context = [stationSeq[startIdx], stationSeq[startIdx + 2]];
    correctAnswer = stationSeq[startIdx + 1];
  }

  const prompt = { kind: "complete-the-line" as const, lineId, context, variant };

  if (difficulty === "easy") {
    const distractors = sampleExcluding(stationSeq, 3, [...context, correctAnswer]);
    const options = shuffle([correctAnswer, ...distractors]);
    return { type: "multiple-choice", mode: "complete-the-line", prompt, options, correctAnswer } satisfies MultipleChoiceQuestion;
  }

  return { type: "free-text", mode: "complete-the-line", prompt, correctAnswer } satisfies FreeTextQuestion;
}

// --- Lines to name ---

export function generateLinesToName(difficulty: Difficulty): Question {
  const station = randomItem(stationList);
  const prompt = { kind: "lines-to-name" as const, lines: station.lines };

  if (difficulty === "easy" || difficulty === "medium") {
    const allNames = stationList.map((s) => s.name);
    const distractors = sampleExcluding(allNames, 3, [station.name]);
    const options = shuffle([station.name, ...distractors]);
    return { type: "multiple-choice", mode: "lines-to-name", prompt, options, correctAnswer: station.name } satisfies MultipleChoiceQuestion;
  }

  return { type: "free-text", mode: "lines-to-name", prompt, correctAnswer: station.name } satisfies FreeTextQuestion;
}

// --- Name to lines ---

export function generateNameToLines(difficulty: Difficulty): Question {
  const station = randomItem(stationList);
  const prompt = { kind: "name-to-lines" as const, stationName: station.name };
  const correctLines = station.lines;

  if (difficulty === "easy" || difficulty === "medium") {
    const total = difficulty === "easy" ? 6 : 10;
    const distractorLines = sampleExcluding([...LINE_IDS], total - correctLines.length, correctLines);
    const visibleLines = shuffle([...correctLines, ...distractorLines]) as LineId[];
    return { type: "line-select", mode: "name-to-lines", prompt, visibleLines, correctLines } satisfies LineSelectQuestion;
  }

  // Hard: show all lines.
  return { type: "line-select", mode: "name-to-lines", prompt, visibleLines: [...LINE_IDS], correctLines } satisfies LineSelectQuestion;
}

// --- Entry point ---

import { GameMode } from "./types";

export function generateQuestion(mode: GameMode, difficulty: Difficulty): Question {
  switch (mode) {
    case "complete-the-line": return generateCompleteTheLine(difficulty);
    case "lines-to-name":     return generateLinesToName(difficulty);
    case "name-to-lines":     return generateNameToLines(difficulty);
  }
}
