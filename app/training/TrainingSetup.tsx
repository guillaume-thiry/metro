"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CANONICAL_LINE_IDS, CanonicalLineId } from "@/data/lines";
import { LineId } from "@/data/index";
import LineBadge from "@/app/components/LineBadge";
import { useLang } from "@/lib/i18n";

export default function TrainingSetup() {
  const router = useRouter();
  const { t } = useLang();

  const [selected, setSelected] = useState<Set<CanonicalLineId>>(
    new Set()
  );
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");

  function toggle(id: CanonicalLineId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startTraining() {
    sessionStorage.setItem("trainingLines", JSON.stringify([...selected]));
    sessionStorage.setItem("trainingDifficulty", difficulty);
    router.push("/training/play");
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center px-4 py-10 gap-8">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <button onClick={() => router.push("/")} className="hover:text-gray-900 dark:hover:text-white transition">
            {t.game.back}
          </button>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold">📚 {t.home.training}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-4">{t.home.selectLines}</p>
        </div>

        {/* Select / deselect all + difficulty */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <div className="flex gap-3 justify-center md:justify-start">
            <button
              onClick={() => setSelected(new Set(CANONICAL_LINE_IDS))}
              className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold px-4 py-2 rounded-xl transition"
            >
              {t.home.selectAll}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold px-4 py-2 rounded-xl transition"
            >
              {t.home.deselectAll}
            </button>
          </div>
          <div className="flex gap-2 justify-center md:justify-end">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={`text-2xl px-3 py-2 rounded-xl transition hover:scale-110 ${difficulty === d ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500" : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent opacity-40 hover:opacity-70"}`}
              >
                {d === "easy" ? "😇" : d === "medium" ? "😐" : "😈"}
              </button>
            ))}
          </div>
        </div>

        {/* Line grid */}
        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent rounded-2xl p-5">
          <div className="grid grid-cols-8 gap-2">
            {CANONICAL_LINE_IDS.map((id) => {
              const isSelected = selected.has(id);
              return (
                <button
                  key={String(id)}
                  onClick={() => toggle(id)}
                  className={`rounded-xl py-3 flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500 hover:scale-110"
                      : "bg-gray-100 dark:bg-gray-600 opacity-40 hover:opacity-70 hover:scale-110"
                  }`}
                >
                  <LineBadge lineId={id as LineId} size="md" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={startTraining}
          disabled={selected.size === 0}
          className="self-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-10 py-3 rounded-xl transition"
        >
          {t.home.startTraining}
        </button>

      </div>
    </main>
  );
}
