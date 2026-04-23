"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { stations, toCanonicalLineId } from "@/data/index";
import LineBadge from "@/app/components/LineBadge";

type StationRow = { name: string; success: number; failure: number };
type SortKey = "name" | "rate" | "total";
type SortDir = "asc" | "desc";

export default function StatisticsPage() {
  const router = useRouter();
  const { t } = useLang();

  const [rows, setRows] = useState<StationRow[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setApiError(data.error); setRows([]); }
        else setRows(data.stations ?? []);
      })
      .catch((e) => { setApiError(String(e)); setRows([]); });
  }, []);

  const sorted = useMemo(() => {
    if (!rows) return [];
    return [...rows].sort((a, b) => {
      const totalA = a.success + a.failure;
      const totalB = b.success + b.failure;
      const rateA = totalA > 0 ? a.success / totalA : 0;
      const rateB = totalB > 0 ? b.success / totalB : 0;

      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "rate") cmp = rateA - rateB;
      else cmp = totalA - totalB;

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir(key === "name" ? "asc" : "desc"); }
  }

  function arrow(key: SortKey) {
    if (key !== sortKey) return <span className="text-gray-400 ml-1">↕</span>;
    return <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center px-4 py-6">
      <div className="w-full max-w-4xl flex flex-col gap-6">

        <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
          <button onClick={() => router.push("/")} className="hover:text-gray-900 dark:hover:text-white transition">
            {t.game.back}
          </button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold">{t.home.statistics}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t.home.statisticsSubtitle}</p>
        </div>

        {rows === null ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : apiError ? (
          <p className="text-center text-red-500 py-12 font-mono text-xs">{apiError}</p>
        ) : rows.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No data yet</p>
        ) : (
          <div className="w-full">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <th className="text-left px-4 py-3 font-semibold cursor-pointer hover:text-gray-900 dark:hover:text-white select-none" onClick={() => handleSort("name")}>
                    {t.home.statsColumns.station} {arrow("name")}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer hover:text-gray-900 dark:hover:text-white select-none" onClick={() => handleSort("rate")}>
                    {t.home.statsColumns.successRate} {arrow("rate")}
                  </th>
                  <th className="text-right px-4 py-3 font-semibold cursor-pointer hover:text-gray-900 dark:hover:text-white select-none" onClick={() => handleSort("total")}>
                    {t.home.statsColumns.total} {arrow("total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => {
                  const total = row.success + row.failure;
                  const rate = total > 0 ? row.success / total : null;
                  const rateColor =
                    rate === null ? "text-gray-400" :
                    rate >= 0.7 ? "text-green-500" :
                    rate >= 0.4 ? "text-yellow-500" :
                    "text-red-500";
                  return (
                    <tr
                      key={row.name}
                      className="border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-medium">{row.name}</span>
                          <div className="flex items-center gap-1">
                            {Array.from(
                                new Map(
                                  (stations.get(row.name)?.lines ?? []).map((l) => [String(toCanonicalLineId(l)), l])
                                ).values()
                              )
                              .sort((a, b) => {
                                const ca = String(toCanonicalLineId(a)), cb = String(toCanonicalLineId(b));
                                const na = parseInt(ca), nb = parseInt(cb);
                                if (na !== nb) return na - nb;
                                return (ca.endsWith("bis") ? 1 : 0) - (cb.endsWith("bis") ? 1 : 0);
                              })
                              .map((lineId) => <LineBadge key={String(toCanonicalLineId(lineId))} lineId={lineId} size="sm" />)
                            }
                          </div>
                        </div>
                      </td>
                      <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${rateColor}`}>
                        {rate !== null ? `${Math.round(rate * 100)}%` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400 tabular-nums">
                        {total}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  );
}
