"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n";

type ScoreEntry = { rank: number; player_id: number; player: string; score: number };

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function LeaderboardPage() {
  const router = useRouter();
  const { t } = useLang();

  const [entries, setEntries] = useState<ScoreEntry[] | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("playerId");
    const pid = stored ? Number(stored) : null;
    setPlayerId(pid);

    const url = pid ? `/api/scores?all=true&playerId=${pid}` : "/api/scores?all=true";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setEntries(data.ranked ?? []))
      .catch(() => setEntries([]));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-2xl flex flex-col gap-6">

        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <button onClick={() => router.push("/")} className="hover:text-gray-900 dark:hover:text-white transition">
            {t.game.back}
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center">{t.home.leaderboard}</h1>

        {entries === null ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No scores yet</p>
        ) : (
          <div className="flex flex-col gap-1">
            {entries.map((entry) => {
              const isMe = entry.player_id === playerId;
              const medal = MEDAL[entry.rank];
              return (
                <div
                  key={entry.rank}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 ${isMe ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm w-8 text-right font-medium ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                      {medal ?? entry.rank}
                    </span>
                    <span className="font-medium">{entry.player || "—"}</span>
                  </div>
                  <span className={`font-semibold tabular-nums ${isMe ? "text-white" : "text-yellow-500"}`}>
                    {entry.score}
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
