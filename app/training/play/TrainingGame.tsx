"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Question } from "@/lib/game/types";
import { generateCompleteTheLine } from "@/lib/game/generators";
import { Difficulty } from "@/lib/game/types";
import MetroLinePrompt from "@/app/play/MetroLinePrompt";
import { useLang } from "@/lib/i18n";
import { normalize, isCorrectAnswer } from "@/lib/game/answer";
import { stations } from "@/data/index";
import { toCanonicalLineId } from "@/data/lines";

function rawSlicePoint(raw: string, normalizedLength: number): number {
  let count = 0;
  for (let i = 0; i < raw.length; i++) {
    count += normalize(raw[i]).length;
    if (count >= normalizedLength) return i + 1;
  }
  return raw.length;
}

function loadSettings(): { allowedCanonicals: Set<string>; difficulty: Difficulty } {
  const lines = JSON.parse(sessionStorage.getItem("trainingLines") ?? "[]") as string[];
  const difficulty = (sessionStorage.getItem("trainingDifficulty") ?? "medium") as Difficulty;
  return { allowedCanonicals: new Set(lines.map(String)), difficulty };
}

export default function TrainingGame() {
  const router = useRouter();
  const { t } = useLang();

  const settingsRef = useRef<ReturnType<typeof loadSettings> | null>(null);
  if (!settingsRef.current) settingsRef.current = loadSettings();
  const { allowedCanonicals, difficulty } = settingsRef.current;

  const [question, setQuestion] = useState<Question>(() =>
    generateCompleteTheLine(difficulty, allowedCanonicals)
  );
  const [answered, setAnswered] = useState(false);
  const [input, setInput] = useState("");
  const [freeTextCorrect, setFreeTextCorrect] = useState<boolean | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (question.type === "free-text") setTimeout(() => inputRef.current?.focus(), 50);
  }, [question]);

  function advance() {
    setQuestion(generateCompleteTheLine(difficulty, allowedCanonicals));
    setAnswered(false);
    setInput("");
    setFreeTextCorrect(null);
    setSelectedOption(null);
    setRevealed(false);
  }

  function submitFreeText() {
    if (answered || !input.trim() || question.type !== "free-text") return;
    const correct = question.correctAnswer;
    const isCorrect = isCorrectAnswer(input, correct);
    setFreeTextCorrect(isCorrect);
    setAnswered(true);
    setTotal((n) => n + 1);
    if (isCorrect) setScore((n) => n + 1);
    setTimeout(advance, 2000);
  }

  function submitMultipleChoice(option: string) {
    if (answered || question.type !== "multiple-choice") return;
    const isCorrect = option === question.correctAnswer;
    setSelectedOption(option);
    setAnswered(true);
    setTotal((n) => n + 1);
    if (isCorrect) setScore((n) => n + 1);
    setTimeout(() => setRevealed(true), 150);
    setTimeout(advance, 2000);
  }

  const prompt = question.prompt;
  if (prompt.kind !== "complete-the-line") return null;
  if (question.type !== "multiple-choice" && question.type !== "free-text") return null;

  const correct = question.correctAnswer;

  // Free-text display
  const isCorrectTyped = question.type === "free-text" && isCorrectAnswer(input, correct);
  const displayAnswer = question.type === "free-text"
    ? (answered ? (isCorrectTyped ? correct : input) : null)
    : (revealed ? selectedOption : null);
  const displayCorrect = question.type === "free-text" ? isCorrectTyped : selectedOption === correct;

  // Autosuggest (medium only)
  const normalizedInput = normalize(input);
  const suggestion = !answered && difficulty === "medium" && question.type === "free-text" && normalizedInput.length >= 5
    ? (() => {
        const matches = [...stations.keys()].filter(name => normalize(name).startsWith(normalizedInput));
        const uniqueNormalized = new Set(matches.map(normalize));
        return uniqueNormalized.size === 1 ? matches[0] : null;
      })()
    : null;
  const ghostSuffix = suggestion ? suggestion.slice(rawSlicePoint(suggestion, normalizedInput.length)) : null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center px-2 py-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <button onClick={() => router.push("/")} className="hover:text-gray-900 dark:hover:text-white transition">
            {t.game.back}
          </button>
          <span>{t.game.score}: {score} / {total}</span>
        </div>

        {/* Prompt */}
        <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-transparent rounded-2xl p-5 h-52 overflow-hidden">
          <MetroLinePrompt
            lineId={prompt.lineId}
            context={prompt.context}
            variant={prompt.variant}
            correctAnswer={correct}
            selectedAnswer={displayAnswer}
            isCorrect={displayCorrect}
            showHints={difficulty !== "hard" || answered}
          />
        </div>

        {/* Multiple choice (easy) */}
        {question.type === "multiple-choice" && (
          <div className="grid grid-cols-2 gap-3" style={{ perspective: "800px" }}>
            {question.options.map((opt, i) => {
              const isCorrectOpt = opt === correct;
              const isSelected = opt === selectedOption;
              let bg = "bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white border border-gray-300 dark:border-transparent";
              if (answered && revealed) {
                if (isCorrectOpt) bg = "bg-green-600 text-white border-transparent";
                else if (isSelected) bg = "bg-red-600 text-white border-transparent";
                else bg = "bg-white dark:bg-gray-700 text-gray-400 dark:text-gray-500 border border-gray-300 dark:border-transparent";
              }
              return (
                <button
                  key={i}
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

        {/* Free text (medium / hard) */}
        {question.type === "free-text" && (
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
              {correct}
            </div>
          </div>
        )}


      </div>
    </main>
  );
}
