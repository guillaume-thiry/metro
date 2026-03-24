"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { GameMode, Difficulty, Question } from "@/lib/game/types";
import { generateQuestion } from "@/lib/game/generators";
import { LINE_IDS, LineId, toCanonicalLineId } from "@/data/index";
import MetroLinePrompt from "./MetroLinePrompt";
import LineBadge from "@/app/components/LineBadge";
import { useLang } from "@/lib/i18n";

const QUESTIONS_PER_SESSION = 10;

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export default function GameScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useLang();

  const mode = (params.get("mode") ?? "complete-the-line") as GameMode;
  const difficulty = (params.get("difficulty") ?? "easy") as Difficulty;

  const [question, setQuestion] = useState<Question>(() => generateQuestion(mode, difficulty));
  const [score, setScore] = useState(0);
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
      router.push(`/results?score=${score}&total=${QUESTIONS_PER_SESSION}`);
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

  const [feedback, setFeedback] = useState<string | null>(null);
  const [freeTextCorrect, setFreeTextCorrect] = useState<boolean | null>(null);

  function submitFreeText() {
    if (answered || !input.trim()) return;
    if (question.type !== "free-text") return;

    const correct = question.correctAnswer;
    const isCorrect = normalize(input) === normalize(correct);

    if (isCorrect) {
      setScore((s) => s + 1);
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
    if (option === question.correctAnswer) setScore((s) => s + 1);
    setSelectedOption(option);
    setAnswered(true);
    setTimeout(() => setRevealed(true), 150);
    setTimeout(nextQuestion, 2000);
  }

  function submitLineSelect() {
    if (answered || question.type !== "line-select") return;
    const correct = new Set(question.correctLines.map(String));
    const selected = new Set([...selectedLines].map(String));
    const isCorrect =
      correct.size === selected.size && [...correct].every((l) => selected.has(l));
    if (isCorrect) {
      setScore((s) => s + 1);
      setFeedback(t.game.correct);
    } else {
      setFeedback(`${t.game.wrongLines} ${question.correctLines.map(toCanonicalLineId).join(", ")}`);
    }
    setAnswered(true);
  }

  function toggleLine(lineId: LineId) {
    if (answered) return;
    setSelectedLines((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
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
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent rounded-2xl p-5 h-56">
          <Prompt question={question} selectedOption={selectedOption} revealed={revealed} typedAnswer={answered ? input : null} difficulty={difficulty} answered={answered} />
        </div>

        {/* Answer area */}
        {question.type === "multiple-choice" && (
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((opt) => {
              const isCorrect = opt === question.correctAnswer;
              const isSelected = opt === selectedOption;
              let bg = "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white";
              if (answered && revealed) {
                if (isCorrect) bg = "bg-green-600 text-white";
                else if (isSelected) bg = "bg-red-600 text-white";
                else bg = "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500";
              } else if (answered) {
                bg = "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white";
              }
              return (
                <button
                  key={opt}
                  onClick={() => submitMultipleChoice(opt)}
                  disabled={answered}
                  className={`rounded-xl px-4 py-3 text-base font-medium text-center h-16 flex items-center justify-center ${answered ? "transition-colors duration-500" : ""} ${bg}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {question.type === "free-text" && (
          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !answered && submitFreeText()}
              disabled={answered}
              placeholder={t.game.placeholder}
              className={`border rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-colors duration-500
                ${answered && freeTextCorrect === true ? "bg-green-700 border-green-500 text-white" : ""}
                ${answered && freeTextCorrect === false ? "bg-red-700 border-red-500 text-white" : ""}
                ${!answered ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:border-blue-500" : ""}
              `}
            />
            <div className={`rounded-xl px-4 py-3 font-medium transition-colors duration-300 ${answered && freeTextCorrect === false ? "bg-green-700 border border-green-500 text-white" : "invisible"}`}>
              {question.correctAnswer}
            </div>
          </div>
        )}

        {question.type === "line-select" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {question.visibleLines.map((lineId) => (
                <button
                  key={String(lineId)}
                  onClick={() => toggleLine(lineId)}
                  disabled={answered}
                  className={`rounded-full transition p-0.5
                    ${selectedLines.has(lineId) ? "ring-2 ring-gray-900 dark:ring-white" : "ring-2 ring-transparent"}
                    ${answered && question.correctLines.includes(lineId) ? "ring-2 ring-green-500" : ""}
                  `}
                >
                  <LineBadge lineId={lineId} size="md" />
                </button>
              ))}
            </div>
            {!answered && (
              <button
                onClick={submitLineSelect}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition self-end"
              >
                {t.game.confirm}
              </button>
            )}
          </div>
        )}

        {/* Feedback — only for line-select */}
        {feedback && question.type === "line-select" && (
          <div className={`text-sm rounded-xl px-4 py-3 ${feedback.startsWith("✗") ? "bg-red-900/40 text-red-300" : "bg-green-900/40 text-green-300"}`}>
            {feedback}
          </div>
        )}

        {/* Next — only for line-select */}
        {answered && question.type === "line-select" && (
          <button
            onClick={nextQuestion}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition self-end"
          >
            {questionIndex + 1 >= QUESTIONS_PER_SESSION ? t.game.seeResults : t.game.next}
          </button>
        )}
      </div>
    </main>
  );
}

function Prompt({ question, selectedOption, revealed, typedAnswer, difficulty, answered }: { question: Question; selectedOption: string | null; revealed: boolean; typedAnswer: string | null; difficulty: Difficulty; answered: boolean }) {
  const { t } = useLang();
  const { prompt } = question;

  if (prompt.kind === "complete-the-line") {
    const correctAnswer = question.type === "multiple-choice" || question.type === "free-text" ? question.correctAnswer : "";
    const displayAnswer = question.type === "free-text" ? typedAnswer : (revealed ? selectedOption : null);
    const isCorrect = question.type === "free-text"
      ? normalize(typedAnswer ?? "") === normalize(correctAnswer)
      : selectedOption === correctAnswer;
    return (
      <MetroLinePrompt
        lineId={prompt.lineId}
        context={prompt.context}
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
    return (
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t.prompt.nameToLines}</p>
        <p className="text-xl font-semibold">{prompt.stationName}</p>
      </div>
    );
  }

  return null;
}
