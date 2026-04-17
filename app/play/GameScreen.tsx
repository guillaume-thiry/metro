"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { GameMode, Difficulty, Question } from "@/lib/game/types";
import { generateQuestion } from "@/lib/game/generators";
import { LINE_IDS, LineId, toCanonicalLineId, stations } from "@/data/index";
import MetroLinePrompt from "./MetroLinePrompt";
import LineBadge from "@/app/components/LineBadge";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { normalize, isCorrectAnswer } from "@/lib/game/answer";

const QUESTIONS_PER_SESSION = 10;

// Given a raw station name and a normalized prefix length, find where to slice
// the raw string so the ghost suffix starts at the right position.
function rawSlicePoint(raw: string, normalizedLength: number): number {
  let count = 0;
  for (let i = 0; i < raw.length; i++) {
    count += normalize(raw[i]).length;
    if (count >= normalizedLength) return i + 1;
  }
  return raw.length;
}

export default function GameScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useLang();
  const { theme } = useTheme();

  const mode = (params.get("mode") ?? "complete-the-line") as GameMode;
  const difficulty = (params.get("difficulty") ?? "easy") as Difficulty;

  const [question, setQuestion] = useState<Question>(() => generateQuestion(mode, difficulty));
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Free text state
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Line select state
  const [selectedLines, setSelectedLines] = useState<Set<LineId>>(new Set());

  useEffect(() => {
    if (question.type === "free-text") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [question]);


  function nextQuestion() {
    if (questionIndex + 1 >= QUESTIONS_PER_SESSION) {
      sessionStorage.setItem("quizScore", String(scoreRef.current));
      sessionStorage.setItem("quizTotal", String(QUESTIONS_PER_SESSION));
      sessionStorage.setItem("quizMode", mode);
      sessionStorage.setItem("quizDifficulty", difficulty);
      sessionStorage.removeItem("quizTournament");
      router.push("/results");
      return;
    }
    setQuestion(generateQuestion(mode, difficulty));
    setQuestionIndex((i) => i + 1);
    setInput("");
    setSelectedLines(new Set());
    setSelectedOption(null);
    setRevealed(false);
    setFeedback(null);
    setFreeTextCorrect(null);
    setAnswered(false);
  }

  useEffect(() => {
    if (question.type !== "line-select" || difficulty !== "hard" || answered) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Enter") submitLineSelect(selectedLines); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [question, difficulty, answered, selectedLines]); // eslint-disable-line react-hooks/exhaustive-deps

  const [feedback, setFeedback] = useState<string | null>(null);
  const [freeTextCorrect, setFreeTextCorrect] = useState<boolean | null>(null);

  function submitFreeText() {
    if (answered || !input.trim()) return;
    if (question.type !== "free-text") return;

    const correct = question.correctAnswer;
    const isCorrect = isCorrectAnswer(input, correct);

    if (isCorrect) {
      scoreRef.current += 1; setScore(scoreRef.current);
      setFeedback(t.game.correct);
    } else {
      setFeedback(`${t.game.wrongAnswer} ${correct}`);
    }
    setFreeTextCorrect(isCorrect);
    setAnswered(true);
    setTimeout(nextQuestion, 2000);
  }

  const [revealed, setRevealed] = useState(false);

  function submitMultipleChoice(option: string) {
    if (answered || question.type !== "multiple-choice") return;
    const isCorrect = option === question.correctAnswer;
    if (isCorrect) { scoreRef.current += 1; setScore(scoreRef.current); }
    setSelectedOption(option);
    setAnswered(true);
    setTimeout(() => setRevealed(true), 150);
    setTimeout(nextQuestion, 2000);
  }

  function submitLineSelect(lines: Set<LineId>) {
    if (answered || question.type !== "line-select") return;
    const correct = new Set(question.correctLines.map(String));
    const selected = new Set([...lines].map(String));
    const isCorrect =
      correct.size === selected.size && [...correct].every((l) => selected.has(l));
    if (isCorrect) {
      scoreRef.current += 1; setScore(scoreRef.current);
      setFeedback(t.game.correct);
    } else {
      setFeedback(`${t.game.wrongLines} ${question.correctLines.map(toCanonicalLineId).join(", ")}`);
    }
    setAnswered(true);
    setTimeout(() => setRevealed(true), 150);
    setTimeout(nextQuestion, 2000);
  }

  function submitLineSelectSingle(lineId: LineId) {
    if (answered || question.type !== "line-select") return;
    const isCorrect = question.correctLines.includes(lineId);
    setSelectedLines(new Set([lineId]));
    if (isCorrect) { scoreRef.current += 1; setScore(scoreRef.current); }
    setAnswered(true);
    setTimeout(() => setRevealed(true), 150);
    setTimeout(nextQuestion, 2000);
  }

  function toggleLine(lineId: LineId) {
    if (answered || question.type !== "line-select") return;
    if (difficulty === "hard") {
      setSelectedLines((prev) => {
        const next = new Set(prev);
        if (next.has(lineId)) next.delete(lineId);
        else next.add(lineId);
        return next;
      });
      return;
    }
    if (selectedLines.has(lineId)) return; // no deselect for medium
    const next = new Set(selectedLines);
    next.add(lineId);
    setSelectedLines(next);
    if (next.size === question.correctLines.length) {
      setTimeout(() => submitLineSelect(next), 0);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center px-2 py-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <button onClick={() => router.push("/")} className="hover:text-gray-900 dark:hover:text-white transition">
            {t.game.back}
          </button>
          <span>{questionIndex + 1} / {QUESTIONS_PER_SESSION} · {t.game.score}: {score}</span>
        </div>

        {/* Prompt */}
        <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-transparent rounded-2xl p-5 h-52 overflow-hidden">
          <Prompt question={question} selectedOption={selectedOption} revealed={revealed} typedAnswer={answered ? input : null} difficulty={difficulty} answered={answered} questionIndex={questionIndex} />
        </div>

        {/* Answer area */}
        {question.type === "multiple-choice" && (
          <div className="grid grid-cols-2 gap-3" style={{ perspective: "800px" }}>
            {question.options.map((opt, i) => {
              const isCorrect = opt === question.correctAnswer;
              const isSelected = opt === selectedOption;
              let bg = "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-transparent";
              if (answered && revealed) {
                if (isCorrect) bg = "bg-green-600 text-white border-transparent";
                else if (isSelected) bg = "bg-red-600 text-white border-transparent";
                else bg = "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-transparent";
              } else if (answered) {
                bg = "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-transparent";
              }
              return (
                <button
                  key={`q${questionIndex}-${i}`}
                  onClick={() => submitMultipleChoice(opt)}
                  disabled={answered}
                  className={`rounded-xl px-4 py-3 text-base font-medium text-center h-16 flex items-center justify-center ${answered ? "transition-colors duration-500" : ""} ${bg}`}
                  style={{ animation: `cardFlipIn 0.4s ease-out ${i * 80}ms both` }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {question.type === "free-text" && (() => {
          const normalizedInput = normalize(input);
          const suggestion = !answered && difficulty === "medium" && normalizedInput.length >= 5
            ? (() => {
                const matches = [...stations.keys()].filter(name => normalize(name).startsWith(normalizedInput));
                const uniqueNormalized = new Set(matches.map(normalize));
                return uniqueNormalized.size === 1 ? matches[0] : null;
              })()
            : null;
          const ghostSuffix = suggestion ? suggestion.slice(rawSlicePoint(suggestion, normalizedInput.length)) : null;
          return (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-stretch">
              <div className={`relative flex-1 border rounded-xl transition-colors duration-500
                ${answered && freeTextCorrect === true ? "bg-green-600 border-green-500" : ""}
                ${answered && freeTextCorrect === false ? "bg-red-600 border-red-500" : ""}
                ${!answered ? "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus-within:border-blue-500" : ""}
              `}>
                {ghostSuffix && (
                  <div className="absolute inset-0 px-4 py-3 flex items-center pointer-events-none overflow-hidden" aria-hidden>
                    <span className="whitespace-pre text-transparent select-none">{input}</span>
                    <span className="whitespace-pre text-gray-400 dark:text-gray-500">{ghostSuffix}</span>
                  </div>
                )}
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !answered) submitFreeText();
                    if (e.key === "Tab" && suggestion) { e.preventDefault(); setInput(suggestion); }
                  }}
                  disabled={answered}
                  placeholder={t.game.placeholder}
                  className={`w-full bg-transparent px-4 py-3 focus:outline-none transition-colors duration-500
                    ${answered ? "text-white" : "text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"}
                  `}
                />
              </div>
              {!answered && (
                <button
                  onClick={submitFreeText}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition"
                >
                  {t.game.confirm}
                </button>
              )}
            </div>
            <div className={`rounded-xl px-4 py-3 font-medium transition-colors duration-300 ${answered && freeTextCorrect === false ? "bg-green-600 border border-green-500 text-white" : "invisible"}`}>
              {question.correctAnswer}
            </div>
          </div>
          );
        })()}

        {question.type === "line-select" && difficulty === "easy" && (
          <div className="grid grid-cols-2 gap-3" style={{ perspective: "800px" }}>
            {question.visibleLines.map((lineId, i) => {
              const isCorrect = question.correctLines.includes(lineId);
              const isSelected = selectedLines.has(lineId);
              let bg = "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-transparent";
              if (answered && revealed) {
                if (isCorrect) bg = "bg-green-600 border-transparent";
                else if (isSelected) bg = "bg-red-600 border-transparent";
                else bg = "bg-gray-200 dark:bg-gray-700 opacity-40 border border-gray-300 dark:border-transparent";
              } else if (answered) {
                bg = "bg-white dark:bg-gray-700 border border-gray-300 dark:border-transparent";
              }
              return (
                <button
                  key={`q${questionIndex}-${i}`}
                  onClick={() => submitLineSelectSingle(lineId)}
                  disabled={answered}
                  className={`rounded-2xl p-5 flex items-center justify-center ${answered ? "transition-colors duration-500" : ""} ${bg}`}
                  style={{ animation: `cardFlipIn 0.4s ease-out ${i * 80}ms both` }}
                >
                  <LineBadge lineId={lineId} size="lg" />
                </button>
              );
            })}
          </div>
        )}

        {question.type === "line-select" && difficulty === "medium" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-8 gap-2" style={{ perspective: "800px" }}>
              {question.visibleLines.map((lineId, i) => {
                const isCorrect = question.correctLines.includes(lineId);
                const isSelected = selectedLines.has(lineId);
                const isMissed = answered && revealed && isCorrect && !isSelected;
                const isWrong = answered && revealed && !isCorrect && isSelected;
                const isHit = answered && revealed && isCorrect && isSelected;
                let bg = "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-transparent";
                if (answered && revealed) {
                  if (isHit) bg = "bg-green-600 border-transparent";
                  else if (isWrong) bg = "bg-red-600 border-transparent";
                  else if (isMissed) bg = "border-transparent";
                  else bg = "bg-gray-200 dark:bg-gray-700 opacity-40 border border-gray-300 dark:border-transparent";
                } else if (answered) {
                  bg = "bg-white dark:bg-gray-700 border border-gray-300 dark:border-transparent";
                } else if (isSelected) {
                  bg = "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500";
                }
                const hatchStyle = isMissed
                  ? {
                      backgroundColor: theme === "dark" ? "#374151" : "#ffffff",
                      backgroundImage: "repeating-linear-gradient(-45deg, #16a34a 0px, #16a34a 4px, transparent 4px, transparent 10px)",
                    }
                  : {};
                return (
                  <button
                    key={`q${questionIndex}-${i}`}
                    onClick={() => toggleLine(lineId)}
                    disabled={answered}
                    className={`rounded-xl py-3 flex items-center justify-center ${answered ? "transition-colors duration-500" : ""} ${bg}`}
                    style={{ animation: `cardFlipIn 0.4s ease-out ${i * 40}ms both`, ...hatchStyle }}
                  >
                    <LineBadge lineId={lineId} size="md" />
                  </button>
                );
              })}
            </div>
            <button onClick={() => submitLineSelect(selectedLines)} disabled={answered} className={`font-semibold px-6 py-3 rounded-xl transition self-end text-white ${answered ? "bg-blue-600 opacity-40 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"}`}>
              {t.game.confirm}
            </button>
          </div>
        )}

        {question.type === "line-select" && difficulty === "hard" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-8 gap-2" style={{ perspective: "800px" }}>
              {question.visibleLines.map((lineId, i) => {
                const isCorrect = question.correctLines.includes(lineId);
                const isSelected = selectedLines.has(lineId);
                const isMissed = answered && revealed && isCorrect && !isSelected;
                const isWrong = answered && revealed && !isCorrect && isSelected;
                const isHit = answered && revealed && isCorrect && isSelected;
                let bg = "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-300 dark:border-transparent";
                if (answered && revealed) {
                  if (isHit) bg = "bg-green-600 border-transparent";
                  else if (isWrong) bg = "bg-red-600 border-transparent";
                  else if (isMissed) bg = "border-transparent";
                  else bg = "bg-gray-200 dark:bg-gray-700 opacity-40 border border-gray-300 dark:border-transparent";
                } else if (answered) {
                  bg = "bg-white dark:bg-gray-700 border border-gray-300 dark:border-transparent";
                } else if (isSelected) {
                  bg = "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500";
                }
                const hatchStyle = isMissed
                  ? {
                      backgroundColor: theme === "dark" ? "#374151" : "#ffffff",
                      backgroundImage: "repeating-linear-gradient(-45deg, #16a34a 0px, #16a34a 4px, transparent 4px, transparent 10px)",
                    }
                  : {};
                return (
                  <button
                    key={`q${questionIndex}-${i}`}
                    onClick={() => toggleLine(lineId)}
                    disabled={answered}
                    className={`rounded-xl py-3 flex items-center justify-center ${answered ? "transition-colors duration-500" : ""} ${bg}`}
                    style={{ animation: `cardFlipIn 0.4s ease-out ${i * 40}ms both`, ...hatchStyle }}
                  >
                    <LineBadge lineId={lineId} size="md" />
                  </button>
                );
              })}
            </div>
            <button onClick={() => submitLineSelect(selectedLines)} disabled={answered} className={`font-semibold px-6 py-3 rounded-xl transition self-end text-white ${answered ? "bg-blue-600 opacity-40 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"}`}>
              {t.game.confirm}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function Prompt({ question, selectedOption, revealed, typedAnswer, difficulty, answered, questionIndex }: { question: Question; selectedOption: string | null; revealed: boolean; typedAnswer: string | null; difficulty: Difficulty; answered: boolean; questionIndex: number }) {
  const { t } = useLang();
  const { prompt } = question;

  if (prompt.kind === "complete-the-line") {
    const correctAnswer = question.type === "multiple-choice" || question.type === "free-text" ? question.correctAnswer : "";
    const isCorrect = question.type === "free-text"
      ? isCorrectAnswer(typedAnswer ?? "", correctAnswer)
      : selectedOption === correctAnswer;
    const displayAnswer = question.type === "free-text"
      ? (typedAnswer !== null ? (isCorrect ? correctAnswer : typedAnswer) : null)
      : (revealed ? selectedOption : null);
    return (
      <MetroLinePrompt
        lineId={prompt.lineId}
        context={prompt.context}
        variant={prompt.variant}
        correctAnswer={correctAnswer}
        selectedAnswer={displayAnswer}
        isCorrect={isCorrect}
        showHints={difficulty !== "hard" || answered}
      />
    );
  }

  if (prompt.kind === "lines-to-name") {
    return (
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t.prompt.linesToName}</p>
        <div className="flex gap-2 flex-wrap">
          {prompt.lines.map((line) => (
            <LineBadge key={String(line)} lineId={line} size="md" />
          ))}
        </div>
      </div>
    );
  }

  if (prompt.kind === "name-to-lines") {
    if (difficulty === "easy") {
      const correctLine = question.type === "line-select" ? question.correctLines[0] : null;
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p key={questionIndex} className="text-2xl font-bold text-center" style={{ animation: "slideUpIn 0.5s ease-out" }}>{prompt.stationName}</p>
          {revealed && correctLine
            ? <LineBadge lineId={correctLine} size="lg" />
            : <div className="w-11 h-11 rounded-full bg-gray-300 dark:bg-gray-500 flex items-center justify-center text-white font-bold text-xl">?</div>
          }
        </div>
      );
    }
    if (difficulty === "medium") {
      const nLines = question.type === "line-select" ? question.correctLines.length : 1;
      const correctLinesArr = (question.type === "line-select" ? [...question.correctLines] : []).sort((a, b) => {
        const ca = String(toCanonicalLineId(a)), cb = String(toCanonicalLineId(b));
        const na = parseInt(ca), nb = parseInt(cb);
        if (na !== nb) return na - nb;
        return (ca.endsWith("bis") ? 1 : 0) - (cb.endsWith("bis") ? 1 : 0);
      });
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p key={questionIndex} className="text-2xl font-bold text-center" style={{ animation: "slideUpIn 0.5s ease-out" }}>{prompt.stationName}</p>
          <div className="flex gap-2">
            {Array.from({ length: nLines }, (_, i) =>
              revealed && correctLinesArr[i]
                ? <LineBadge key={i} lineId={correctLinesArr[i]} size="lg" />
                : <div key={i} className="w-11 h-11 rounded-full bg-gray-300 dark:bg-gray-500 flex items-center justify-center text-white font-bold text-xl">?</div>
            )}
          </div>
        </div>
      );
    }
    const correctLinesArr = (question.type === "line-select" ? [...question.correctLines] : []).sort((a, b) => {
      const ca = String(toCanonicalLineId(a)), cb = String(toCanonicalLineId(b));
      const na = parseInt(ca), nb = parseInt(cb);
      if (na !== nb) return na - nb;
      return (ca.endsWith("bis") ? 1 : 0) - (cb.endsWith("bis") ? 1 : 0);
    });
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p key={questionIndex} className="text-2xl font-bold text-center" style={{ animation: "slideUpIn 0.5s ease-out" }}>{prompt.stationName}</p>
        <div className={`flex gap-2 ${revealed ? "" : "invisible"}`}>
          {correctLinesArr.map((lineId, i) => <LineBadge key={i} lineId={lineId} size="lg" />)}
        </div>
      </div>
    );
  }

  return null;
}
