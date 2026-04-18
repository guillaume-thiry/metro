import { lines, stationList, LINE_IDS, LineId, activeLines, LINE_WEIGHTS, toCanonicalLineId } from "@/data/index";
import { POST_FORK_STATIONS, FIXED_DIRECTION_LINES } from "@/data/lines";
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

export function generateCompleteTheLine(difficulty: Difficulty, allowedCanonicals?: Set<string>, excludePair?: { lineId: LineId; station: string }): Question {
  // Pick a complete line with enough stations, weighted by station count.
  const eligibleLines = activeLines
    .filter((id) => lines[id].length >= 4)
    .filter((id) => !allowedCanonicals || allowedCanonicals.has(String(toCanonicalLineId(id))));
  const weight = (id: LineId) => lines[id].length * (LINE_WEIGHTS[id] ?? 1);
  const totalStations = eligibleLines.reduce((sum, id) => sum + weight(id), 0);
  let r = Math.random() * totalStations;
  let lineId = eligibleLines[0];
  for (const id of eligibleLines) {
    r -= weight(id);
    if (r <= 0) { lineId = id; break; }
  }
  const stationSeq = FIXED_DIRECTION_LINES.includes(lineId) || Math.random() < 0.5
    ? lines[lineId]
    : [...lines[lineId]].reverse();

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

  // Retry once if this matches the excluded pair
  if (excludePair && lineId === excludePair.lineId && correctAnswer === excludePair.station) {
    return generateCompleteTheLine(difficulty, allowedCanonicals);
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

function deduplicateByCanonical(lineIds: LineId[]): LineId[] {
  const seen = new Set<string>();
  return lineIds.filter(id => {
    const c = String(toCanonicalLineId(id));
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
}

function canonicalLineCount(lineIds: LineId[]): number {
  return new Set(lineIds.map(id => String(toCanonicalLineId(id)))).size;
}

const nameToLinesMultiStations = stationList.filter(s => canonicalLineCount(s.lines) > 1);
const nameToLinesSingleStations = stationList.filter(s => canonicalLineCount(s.lines) === 1);

export function generateNameToLines(difficulty: Difficulty, exclude?: { stationName: string }): Question {
  let station;
  const pickFrom = (pool: typeof stationList) => {
    const filtered = exclude ? pool.filter(s => s.name !== exclude.stationName) : pool;
    return randomItem(filtered.length > 0 ? filtered : pool);
  };
  if (difficulty === "easy") {
    station = pickFrom(nameToLinesSingleStations);
  } else if (difficulty === "medium") {
    station = pickFrom(Math.random() < 0.4 ? nameToLinesMultiStations : nameToLinesSingleStations);
  } else {
    // hard: 60% multi-line, 40% single-line
    station = pickFrom(Math.random() < 0.6 ? nameToLinesMultiStations : nameToLinesSingleStations);
  }
  const prompt = { kind: "name-to-lines" as const, stationName: station.name };
  const correctLines = deduplicateByCanonical(station.lines);

  if (difficulty === "easy") {
    // Single correct line + 3 distractors, answered with one click.
    // Deduplicate by canonical ID to avoid visually identical badges (e.g. 7_1 vs 7_2).
    const correctLine = randomItem(correctLines);
    const excludedCanonicals = new Set(correctLines.map(id => String(toCanonicalLineId(id))));
    const seenCanonicals = new Set(excludedCanonicals);
    const uniquePool = [...LINE_IDS].filter(id => {
      const c = String(toCanonicalLineId(id));
      if (seenCanonicals.has(c)) return false;
      seenCanonicals.add(c);
      return true;
    });
    const distractors = shuffle(uniquePool).slice(0, 3);
    const visibleLines = shuffle([correctLine, ...distractors]) as LineId[];
    return { type: "line-select", mode: "name-to-lines", prompt, visibleLines, correctLines: [correctLine] } satisfies LineSelectQuestion;
  }

  if (difficulty === "medium") {
    // 8 options, deduplicated by canonical to avoid visually identical badges.
    const excludedCanonicals = new Set(correctLines.map(id => String(toCanonicalLineId(id))));
    const seenCanonicals = new Set(excludedCanonicals);
    const uniquePool = [...LINE_IDS].filter(id => {
      const c = String(toCanonicalLineId(id));
      if (seenCanonicals.has(c)) return false;
      seenCanonicals.add(c);
      return true;
    });
    const distractors = shuffle(uniquePool).slice(0, 8 - correctLines.length);
    const visibleLines = ([...correctLines, ...distractors] as LineId[]).sort((a, b) => {
      const ca = String(toCanonicalLineId(a)), cb = String(toCanonicalLineId(b));
      const na = parseInt(ca), nb = parseInt(cb);
      if (na !== nb) return na - nb;
      return (ca.endsWith("bis") ? 1 : 0) - (cb.endsWith("bis") ? 1 : 0);
    });
    return { type: "line-select", mode: "name-to-lines", prompt, visibleLines, correctLines } satisfies LineSelectQuestion;
  }

  // Hard: show all lines, deduplicated by canonical and sorted.
  // Use correctLines variants for matching canonicals so badge IDs align with correctLines.
  const sortFn = (a: LineId, b: LineId) => {
    const ca = String(toCanonicalLineId(a)), cb = String(toCanonicalLineId(b));
    const na = parseInt(ca), nb = parseInt(cb);
    if (na !== nb) return na - nb;
    return (ca.endsWith("bis") ? 1 : 0) - (cb.endsWith("bis") ? 1 : 0);
  };
  const correctCanonicals = new Set(correctLines.map(id => String(toCanonicalLineId(id))));
  const remaining = deduplicateByCanonical([...LINE_IDS]).filter(id => !correctCanonicals.has(String(toCanonicalLineId(id))));
  const visibleLines = ([...correctLines, ...remaining] as LineId[]).sort(sortFn);
  return { type: "line-select", mode: "name-to-lines", prompt, visibleLines, correctLines } satisfies LineSelectQuestion;
}

// --- Entry point ---

import { GameMode } from "./types";

export function generateQuestion(mode: GameMode, difficulty: Difficulty, exclude?: { stationName?: string; lineId?: LineId; station?: string }): Question {
  switch (mode) {
    case "complete-the-line": return generateCompleteTheLine(
      difficulty,
      undefined,
      exclude?.lineId ? { lineId: exclude.lineId, station: exclude.station ?? "" } : undefined
    );
    case "lines-to-name":     return generateLinesToName(difficulty);
    case "name-to-lines":     return generateNameToLines(difficulty, exclude?.stationName ? { stationName: exclude.stationName } : undefined);
  }
}
