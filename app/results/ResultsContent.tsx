"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import { GameMode, Difficulty } from "@/lib/game/types";
import LineBadge from "@/app/components/LineBadge";
import { LineId } from "@/data/index";

const COUNTER_DURATION_MS = 800;

export default function ResultsContent() {
  const router = useRouter();
  const { t } = useLang();
  const score = Number(sessionStorage.getItem("quizScore") ?? 0);
  const total = Number(sessionStorage.getItem("quizTotal") ?? 10);
  const tournament = sessionStorage.getItem("quizTournament") === "true";
  const lines: LineId[] = tournament ? JSON.parse(sessionStorage.getItem("quizLines") ?? "[]") : [];
  const mode = sessionStorage.getItem("quizMode") as GameMode | null;
  const difficulty = sessionStorage.getItem("quizDifficulty") as Difficulty | null;
  const subtitle = tournament
    ? t.home.tournament
    : mode && difficulty
      ? `${t.home.modes[mode].title} · ${t.difficulties[difficulty]}`
      : null;

  const [count, setCount] = useState(tournament ? 0 : score);
  const done = count === score;

  useEffect(() => {
    if (!tournament) return;
    if (score === 0) { setCount(0); return; }
    const interval = COUNTER_DURATION_MS / score;
    const timer = setInterval(() => {
      setCount((c) => {
        if (c + 1 >= score) { clearInterval(timer); return score; }
        return c + 1;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [score, tournament]);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{t.results.title}</h1>
        {subtitle && <p className="text-xl text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {!tournament && (
        <img
          src={`/scores/${score}.jpg`}
          alt={`Score ${score}`}
          className="w-full max-w-xl aspect-video object-cover rounded-2xl shadow-lg"
        />
      )}
      {tournament && lines.length > 0 && (
        <div className="grid grid-cols-10 gap-1.5">
          {lines.slice(0, 50).map((lineId, i) => (
            <div key={i} className={`transition-all duration-200 ${i < count ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
              <LineBadge lineId={lineId} size="sm" />
            </div>
          ))}
        </div>
      )}
      <p className={`font-semibold transition-all duration-500 ${done ? "text-green-500 dark:text-green-400 text-7xl" : "text-blue-500 dark:text-blue-400 text-5xl"}`}>
        {count}{!tournament && <span className="text-gray-400 dark:text-gray-500 text-3xl"> / {total}</span>}
      </p>
      {tournament && <p className="text-gray-500 dark:text-gray-400">{t.results.inARow}</p>}
      <div className="flex gap-3">
        {tournament ? (
          <button
            onClick={() => router.push("/tournament")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            {t.results.playAgain}
          </button>
        ) : mode && difficulty ? (
          <button
            onClick={() => router.push(`/play?mode=${mode}&difficulty=${difficulty}`)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            {t.results.playAgain}
          </button>
        ) : null}
        <button
          onClick={() => router.push("/")}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          {t.results.home}
        </button>
      </div>
    </main>
  );
}
