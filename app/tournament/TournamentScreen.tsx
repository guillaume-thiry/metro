"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Question } from "@/lib/game/types";
import { generateQuestion } from "@/lib/game/generators";
import MetroLinePrompt from "@/app/play/MetroLinePrompt";
import { useLang } from "@/lib/i18n";
import { normalize, isCorrectAnswer } from "@/lib/game/answer";
import { stations, LineId } from "@/data/index";

const TIMER_SECONDS = 10;
const TIMER_ENABLED = true;
const R = 12; // radius of stroke centerline; strokeWidth = 2*R fills the disk

function TimerCircle({ seconds, paused }: { seconds: number; paused: boolean }) {
  return (
    <svg width="36" height="36" viewBox="0 0 48 48" style={{ transform: "scaleX(-1)" }}>
      {/* Yellow disk that drains clockwise from the top */}
      <circle
        cx="24" cy="24" r={R}
        fill="none"
        stroke="#EAB308"
        strokeWidth={R * 2}
        pathLength="1"
        strokeDasharray="1"
        strokeDashoffset={0}
        transform="rotate(-90 24 24)"
        style={{
          animation: `timer-drain ${seconds}s linear forwards`,
          animationPlayState: paused ? "paused" : "running",
        }}
      />
    </svg>
  );
}


export default function TournamentScreen() {
  const router = useRouter();
  const { t } = useLang();

  const [question, setQuestion] = useState<Question>(() => generateQuestion("complete-the-line", "hard"));
  const [timerKey, setTimerKey] = useState(0);
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  const correctLinesRef = useRef<LineId[]>([]);
  const [answered, setAnswered] = useState(false);
  const [input, setInput] = useState("");
  const [freeTextCorrect, setFreeTextCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(() => !!localStorage.getItem("playerId"));

  useEffect(() => {
    if (ready) return;
    fetch("/api/player", { method: "POST" })
      .then((r) => r.json())
      .then((d) => { if (d.player_id) localStorage.setItem("playerId", String(d.player_id)); })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [question]);

  // Timer: when it expires, validate any typed input first before ending
  useEffect(() => {
    if (answered) return;
    if (!TIMER_ENABLED) return;
    const timeout = setTimeout(() => {
      if (question.type !== "free-text") return;
      const currentInput = (inputRef.current?.value ?? "").trim();
      const normalizedInput = normalize(currentInput);
      const correct = question.correctAnswer;
      // Gentle validation: unique substring match with 5+ chars is enough
      const uniqueMatch = normalizedInput.length >= 5
        ? (() => {
            const matches = [...stations.keys()].filter(name => normalize(name).startsWith(normalizedInput));
            const uniqueNormalized = new Set(matches.map(normalize));
            return uniqueNormalized.size === 1 ? matches[0] : null;
          })()
        : null;
      const isCorrect = uniqueMatch === correct || isCorrectAnswer(currentInput, correct);
      if (currentInput && isCorrect) {
        streakRef.current += 1; setStreak(streakRef.current);
        if (question.prompt.kind === "complete-the-line") correctLinesRef.current.push(question.prompt.lineId);
        setInput(correct);
        setFreeTextCorrect(true);
      } else {
        setFreeTextCorrect(false);
      }
      setAnswered(true);
      setTimeout(isCorrect ? advance : endGame, 2000);
    }, TIMER_SECONDS * 1000);
    return () => clearTimeout(timeout);
  }, [timerKey, answered]); // eslint-disable-line react-hooks/exhaustive-deps

  function endGame() {
    sessionStorage.removeItem("scoreSaved");
    sessionStorage.setItem("quizScore", String(streakRef.current));
    sessionStorage.setItem("quizTournament", "true");
    sessionStorage.setItem("quizLines", JSON.stringify(correctLinesRef.current));
    router.push("/results");
  }

  function advance() {
    const p = question.prompt as { lineId: LineId };
    const q = question as { correctAnswer: string };
    setQuestion(generateQuestion("complete-the-line", "hard", { lineId: p.lineId, station: q.correctAnswer }));
    setTimerKey((k) => k + 1);
    setInput("");
    setFreeTextCorrect(null);
    setAnswered(false);
  }

  function submit() {
    if (answered || !input.trim()) return;
    if (question.type !== "free-text") return;

    const correct = question.correctAnswer;
    const isCorrect = isCorrectAnswer(input, correct);

    if (isCorrect) {
      streakRef.current += 1;
      setStreak(streakRef.current);
      correctLinesRef.current.push((question.prompt as { lineId: LineId }).lineId);
    }
    setFreeTextCorrect(isCorrect);
    setAnswered(true);
    setTimeout(isCorrect ? advance : endGame, 2000);
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const prompt = question.prompt;
  if (prompt.kind !== "complete-the-line" || question.type !== "free-text") return null;

  const correct = question.correctAnswer;
  const isCorrect = isCorrectAnswer(input, correct);
  const isEmpty = answered && !input.trim();
  const displayAnswer = answered ? (isCorrect || isEmpty ? correct : input) : null;
  const displayCorrect = isCorrect || isEmpty;

  const normalizedInput = normalize(input);
  const ghostSuffix = null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center px-2 py-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <button onClick={() => router.push("/")} className="hover:text-gray-900 dark:hover:text-white transition">
            {t.game.back}
          </button>
          <div className="flex items-center gap-3">
            <TimerCircle key={timerKey} seconds={TIMER_SECONDS} paused={answered} />
            <span className="font-semibold text-yellow-500 text-2xl">🏆</span>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent rounded-2xl p-5 h-52 overflow-hidden">
          <MetroLinePrompt
            lineId={prompt.lineId}
            context={prompt.context}
            variant={prompt.variant}
            correctAnswer={correct}
            selectedAnswer={displayAnswer}
            isCorrect={displayCorrect}
            showHints={answered}
          />
        </div>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-stretch">
            <div className={`relative flex-1 border rounded-xl transition-colors duration-500
              ${answered && freeTextCorrect === true ? "bg-green-600 border-green-500" : ""}
              ${answered && freeTextCorrect === false ? "bg-red-600 border-red-500" : ""}
              ${!answered ? "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus-within:border-blue-500" : ""}
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
                  if (e.key === "Enter" && !answered) submit();
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
                onClick={submit}
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

      </div>
    </main>
  );
}
