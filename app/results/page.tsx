"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";

function ResultsContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { t } = useLang();
  const score = Number(params.get("score") ?? 0);
  const total = Number(params.get("total") ?? 10);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-bold">{t.results.title}</h1>
      <p className="text-5xl font-semibold text-blue-500 dark:text-blue-400">
        {score} <span className="text-gray-400 dark:text-gray-500 text-3xl">/ {total}</span>
      </p>
      <button
        onClick={() => router.push("/")}
        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition"
      >
        {t.results.playAgain}
      </button>
    </main>
  );
}

export default function ResultsPage() {
  return (
    <Suspense>
      <ResultsContent />
    </Suspense>
  );
}
