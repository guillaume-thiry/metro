"use client";

import { LineId, stations as stationMap, lines, toCanonicalLineId } from "@/data/index";
import { lineColor } from "@/data/lineColors";
import LineBadge from "@/app/components/LineBadge";
import { useLang } from "@/lib/i18n";

type Props = {
  lineId: LineId;
  context: string[];
  correctAnswer: string;
  selectedAnswer?: string | null;
  isCorrect?: boolean;
  showHints?: boolean;
};

export default function MetroLinePrompt({ lineId, context, correctAnswer, selectedAnswer, isCorrect, showHints = true }: Props) {
  const { t } = useLang();
  const color = lineColor(lineId);
  const lastLabel = selectedAnswer ?? "??";
  const stationNames = [...context, lastLabel];

  const termini = new Set([lines[lineId][0], lines[lineId][lines[lineId].length - 1]]);
  const leftTerminus = termini.has(context[0]);
  const rightTerminus = termini.has(correctAnswer);

  const stationData = stationNames.map((name, i) => {
    const isLast = i === stationNames.length - 1;
    const lookupName = isLast ? correctAnswer : name;
    const otherLines = (stationMap.get(lookupName)?.lines ?? [])
      .filter((l) => toCanonicalLineId(l) !== toCanonicalLineId(lineId))
      .filter((l, i, arr) => arr.findIndex((m) => toCanonicalLineId(m) === toCanonicalLineId(l)) === i);
    return { name, isLast, otherLines };
  });

  // Segment: colored bar connecting circles, mt centers it on h-7 (28px) circles: (28-6)/2 = 11px
  const Segment = () => (
    <div className="h-1.5 w-36 flex-shrink-0 mt-[11px]" style={{ backgroundColor: color }} />
  );

  const Tail = ({ show }: { show: boolean }) => (
    <div className="h-1.5 w-6 flex-shrink-0 mt-[11px]" style={{ backgroundColor: show ? color : "transparent" }} />
  );

  return (
    <div className="flex flex-col gap-10">
      {/* Title */}
      <div className="flex items-center text-sm text-gray-400">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 bg-white text-gray-900" style={{ boxShadow: "0 0 0 2px #111" }}>
          M
        </span>
        <span className="ml-1"><LineBadge lineId={lineId} size="md" /></span>
        <span className="ml-3 text-gray-900 dark:text-white text-lg font-bold">{t.prompt.findNext}</span>
      </div>

      {/* Station row */}
      <div className="flex items-start justify-center">
        <Tail show={!leftTerminus} />

        {stationData.map(({ name, isLast, otherLines }, i) => (
          <div key={i} className="flex items-start">
            {/* Station: circle + label */}
            <div className="flex flex-col items-center gap-2" style={{ width: 28 }}>
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 border-4"
                style={
                  !showHints && !isLast
                    ? { backgroundColor: "#9ca3af", borderColor: "black", borderWidth: 5 }
                    : otherLines.length > 0
                    ? { backgroundColor: "white", borderColor: "black", borderWidth: 5 }
                    : { backgroundColor: color, borderColor: color }
                }
              />
              <div className="flex flex-col items-center gap-1" style={{ width: 150 }}>
                <span
                  className={`text-center text-base leading-tight min-h-[2.5rem] flex items-center justify-center ${
                    isLast
                      ? selectedAnswer
                        ? isCorrect
                          ? "text-green-400 font-bold"
                          : "text-red-400 font-bold"
                        : "text-gray-900 dark:text-white font-bold"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {name}
                </span>
                {showHints
                  ? otherLines.length > 0 && (
                      <div className="flex gap-1 flex-wrap justify-center">
                        {otherLines.map((l) => <LineBadge key={String(l)} lineId={l} size="sm" />)}
                      </div>
                    )
                  : !isLast && (
                      <span className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center text-white text-xs font-bold">?</span>
                    )
                }
              </div>
            </div>

            {/* Segment to next */}
            {!isLast && <Segment />}
          </div>
        ))}

        <Tail show={!rightTerminus} />
      </div>
    </div>
  );
}
