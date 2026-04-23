"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { useLang } from "@/lib/i18n";
import { GameMode, Difficulty } from "@/lib/game/types";
import LineBadge from "@/app/components/LineBadge";
import { LineId } from "@/data/index";

const COUNTER_DURATION_MS = 800;

type ScoreEntry = { rank: number; player_id: number; player: string; score: number };
type Leaderboard = { top5: ScoreEntry[]; playerEntry: ScoreEntry | null; entryAbove: ScoreEntry | null; entryBelow: ScoreEntry | null };

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
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [playerName, setPlayerName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("playerName") ?? "") : ""
  );
  const [playerId, setPlayerId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("playerId");
    return stored ? Number(stored) : null;
  });
  const [register, setRegister] = useState(false);
  const [saved, setSaved] = useState(() =>
    typeof window !== "undefined" && sessionStorage.getItem("scoreSaved") === "true"
  );
  const savingRef = useRef(false);
  const [savedName, setSavedName] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("playerName") ?? "") : ""
  );
  const [isNewBest, setIsNewBest] = useState(false);

  useEffect(() => {
    if (!isNewBest) return;
    const end = Date.now() + 3000;
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#a855f7"] });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#a855f7"] });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, [isNewBest]);

  function fetchLeaderboard(pid?: number | null) {
    const url = pid ? `/api/scores?playerId=${pid}` : "/api/scores";
    fetch(url)
      .then((r) => r.json())
      .then((data) => setLeaderboard(data?.top5 ? data : { top5: [], playerEntry: null, entryAbove: null, entryBelow: null }))
      .catch(() => setLeaderboard({ top5: [], playerEntry: null, entryAbove: null, entryBelow: null }));
  }

  // On arrival: fetch leaderboard + player data in parallel, then auto-save
  useEffect(() => {
    if (!tournament) return;
    async function init() {
      const leaderboardUrl = playerId ? `/api/scores?playerId=${playerId}` : "/api/scores";
      const [lbResult, playerResult] = await Promise.allSettled([
        fetch(leaderboardUrl).then((r) => r.json()),
        playerId ? fetch(`/api/player?playerId=${playerId}`).then((r) => r.json()) : Promise.resolve(null),
      ]);
      if (lbResult.status === "fulfilled") {
        const data = lbResult.value;
        setLeaderboard(data?.top5 ? data : { top5: [], playerEntry: null, entryAbove: null, entryBelow: null });
      } else {
        setLeaderboard({ top5: [], playerEntry: null, entryAbove: null, entryBelow: null });
      }
      let previousBest: number | null = null;
      if (playerResult.status === "fulfilled" && playerResult.value) {
        const d = playerResult.value;
        if (typeof d.show_scores === "boolean") setRegister(d.show_scores);
        if (typeof d.best_score === "number") previousBest = d.best_score;
      }
      if (!saved) saveScore(previousBest);
    }
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveScore(previousBest: number | null) {
    if (savingRef.current || saved) return;
    savingRef.current = true;
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, name: playerName, score }),
      });
      const data = await res.json();
      if (!res.ok) { console.error("saveScore failed", data); savingRef.current = false; return; }
      const pid = data.player_id ?? playerId;
      if (data.player_id) {
        setPlayerId(data.player_id);
        localStorage.setItem("playerId", String(data.player_id));
      }
      savingRef.current = false;
      sessionStorage.setItem("scoreSaved", "true");
      setSaved(true);
      if (previousBest !== null && score > previousBest) setIsNewBest(true);
      fetchLeaderboard(pid);
    } catch (e) {
      console.error("saveScore error", e);
      savingRef.current = false;
    }
  }

  async function updateName() {
    if (!playerId) { console.error("updateName: no playerId yet"); return; }
    const shouldShow = !!playerName.trim();
    const body: Record<string, unknown> = { player_id: playerId, name: playerName };
    if (shouldShow && !register) body.show_scores = true;
    const res = await fetch("/api/player", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) { console.error("updateName failed", await res.text()); return; }
    localStorage.setItem("playerName", playerName);
    setSavedName(playerName);
    if (shouldShow && !register) setRegister(true);
    fetchLeaderboard(shouldShow ? playerId : null);
  }

  function toggleRegister() {
    const next = !register;
    if (next && !playerName.trim()) return;
    setRegister(next);
    if (playerId) {
      fetch("/api/player", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, show_scores: next }),
      })
        .then(() => fetchLeaderboard(next ? playerId : null))
        .catch(() => {});

      if (!next) {
        // Optimistic: remove player immediately and re-rank
        setLeaderboard((lb) => {
          if (!lb) return lb;
          const newTop5 = lb.top5
            .filter((e) => e.player_id !== playerId)
            .map((e, i) => ({ ...e, rank: i + 1 }));
          return { top5: newTop5, playerEntry: null, entryAbove: null, entryBelow: null };
        });
      }
    }
  }

  const playAgainPath = tournament
    ? "/tournament"
    : mode && difficulty ? `/play?mode=${mode}&difficulty=${difficulty}` : null;

  useEffect(() => {
    if (!playAgainPath) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") router.push(playAgainPath!);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playAgainPath]); // eslint-disable-line react-hooks/exhaustive-deps

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
      {tournament && isNewBest && <p className="text-green-500 font-bold text-2xl animate-pop">{t.results.newBest}</p>}
      <div className="flex gap-3">
        {playAgainPath && (
          <button
            onClick={() => router.push(playAgainPath)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            {t.results.playAgain}
          </button>
        )}
        <button
          onClick={() => router.push("/")}
          className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          {t.results.home}
        </button>
      </div>
      {tournament && (
        <div className="w-full max-w-sm mt-6">
          <h2 className="text-2xl font-bold text-center mb-3">{t.results.leaderboard}</h2>
          {leaderboard === null ? (
            <p className="text-center text-gray-400 text-sm">...</p>
          ) : leaderboard.top5.length === 0 ? (
            <p className="text-center text-gray-400 text-sm">No scores yet</p>
          ) : (
            <div className="flex flex-col gap-1">
              {leaderboard.top5.map((entry) => {
                const isMe = entry.player_id === playerId;
                return (
                  <div key={entry.rank} className={`flex items-center justify-between rounded-xl px-4 py-2 ${isMe ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-700"}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm w-5 text-right ${isMe ? "text-blue-200" : "text-gray-400"}`}>{entry.rank}</span>
                      <span className="font-medium">{entry.player}</span>
                      {isMe && isNewBest && <span className="text-green-300 text-sm font-semibold">{t.results.newBest}</span>}
                    </div>
                    <span className={`font-semibold ${isMe ? "text-white" : "text-yellow-500"}`}>{entry.score}</span>
                  </div>
                );
              })}
              {leaderboard.playerEntry && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                  {leaderboard.entryAbove && (
                    <div className="flex items-center justify-between rounded-xl px-4 py-2 bg-white dark:bg-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-5 text-right">{leaderboard.entryAbove.rank}</span>
                        <span className="font-medium">{leaderboard.entryAbove.player}</span>
                      </div>
                      <span className="font-semibold text-yellow-500">{leaderboard.entryAbove.score}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between rounded-xl px-4 py-2 bg-blue-600 text-white">
                    <div className="flex items-center gap-3">
                      <span className="text-blue-200 text-sm w-5 text-right">{leaderboard.playerEntry.rank}</span>
                      <span className="font-medium">{leaderboard.playerEntry.player}</span>
                      {isNewBest && <span className="text-green-300 text-sm font-semibold">{t.results.newBest}</span>}
                    </div>
                    <span className="font-semibold">{leaderboard.playerEntry.score}</span>
                  </div>
                  {leaderboard.entryBelow && (
                    <div className="flex items-center justify-between rounded-xl px-4 py-2 bg-white dark:bg-gray-700">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-5 text-right">{leaderboard.entryBelow.rank}</span>
                        <span className="font-medium">{leaderboard.entryBelow.player}</span>
                      </div>
                      <span className="font-semibold text-yellow-500">{leaderboard.entryBelow.score}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      {tournament && (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={toggleRegister}
              className={`relative w-10 h-6 rounded-full transition-colors ${register ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${register ? "translate-x-5" : "translate-x-1"}`} />
            </div>
            <span className="font-medium">{t.results.registerScore}</span>
          </label>
          <div className="flex gap-2">
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") updateName(); }}
              placeholder={!register && !playerName.trim() ? t.results.enterNameHint : t.results.enterName}
              className="flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-transparent rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-400"
            />
            {playerName !== savedName && (
              <button
                onClick={updateName}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition"
              >
                {t.results.saveScore}
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
