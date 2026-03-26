"use client";

import Link from "next/link";
import { useState } from "react";
import { GameMode, Difficulty } from "@/lib/game/types";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

const GAME_MODES: GameMode[] = ["complete-the-line", "lines-to-name", "name-to-lines"];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const PREVIEW_SLUG: Partial<Record<GameMode, string>> = {
  "complete-the-line": "complete",
};

function PreviewImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      key={src}
      src={src}
      alt={alt}
      className="w-full rounded-xl border-2 border-gray-300 dark:border-gray-500 object-cover"
      style={{ display: loaded ? "block" : "none" }}
      onLoad={() => setLoaded(true)}
    />
  );
}

export default function Home() {
  const { t, lang } = useLang();
  const { theme } = useTheme();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center px-4 py-10 sm:p-6 gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Paris Métro Quiz</h1>
        <p className="text-gray-500 dark:text-gray-400">{t.home.subtitle}</p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-2xl">
        {GAME_MODES.map((mode) => {
          const { title, description } = t.home.modes[mode];
          const wip = mode !== "complete-the-line";
          return (
            <div key={mode} className={`relative bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 ${wip ? "opacity-50" : ""}`}>
              {wip && (
                <span className="absolute top-3 left-3 text-sm font-bold bg-red-700 text-white px-2.5 py-1 rounded-full">
                  WIP
                </span>
              )}
              <div className="flex-1">
                <h2 className="text-lg font-semibold mb-3 text-center sm:text-left">{title}</h2>
                {PREVIEW_SLUG[mode] && <PreviewImage src={`/previews/${PREVIEW_SLUG[mode]}_${theme}_${lang}.png`} alt={title} />}
              </div>
              <div className="flex flex-col gap-2 items-center">
                <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">{t.home.level}</span>
                <div className="flex flex-row sm:flex-col gap-2 items-center">
                  {DIFFICULTIES.map((diff) => (
                    wip ? (
                      <div
                        key={diff}
                        className="text-center bg-gray-300 dark:bg-gray-600 text-gray-400 dark:text-gray-500 text-2xl sm:text-3xl px-5 sm:px-8 py-3 rounded-xl cursor-not-allowed"
                      >
                        {diff === "easy" ? "😇" : diff === "medium" ? "😐" : "😈"}
                      </div>
                    ) : (
                      <Link
                        key={diff}
                        href={`/play?mode=${mode}&difficulty=${diff}`}
                        className="text-center bg-blue-500 dark:bg-blue-600 hover:bg-blue-400 dark:hover:bg-blue-500 text-white text-2xl sm:text-3xl px-5 sm:px-8 py-3 rounded-xl"
                      >
                        {diff === "easy" ? "😇" : diff === "medium" ? "😐" : "😈"}
                      </Link>
                    )
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
