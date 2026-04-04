"use client";

import { useState, useRef } from "react";
import { LineId, stations as stationMap, lines, toCanonicalLineId } from "@/data/index";
import { FORK_STATIONS } from "@/data/lines";
import { lineColor } from "@/data/lineColors";
import LineBadge from "@/app/components/LineBadge";
import { useLang } from "@/lib/i18n";

// Crossfades between line badges when lineId changes.
function AnimatedLineBadge({ lineId }: { lineId: LineId }) {
  const [displayedId, setDisplayedId] = useState(lineId);
  const [outgoing, setOutgoing] = useState<LineId | null>(null);
  const prevRef = useRef(lineId);

  if (lineId !== displayedId) {
    setDisplayedId(lineId);
    setOutgoing(prevRef.current);
  }
  prevRef.current = lineId;

  return (
    <div className="relative flex items-center">
      {outgoing !== null && (
        <div
          key={`out-${String(outgoing)}`}
          className="absolute pointer-events-none"
          style={{ animation: "slideUpOut 0.5s ease-in forwards" }}
          onAnimationEnd={() => setOutgoing(null)}
        >
          <LineBadge lineId={outgoing} size="md" />
        </div>
      )}
      <div key={`in-${String(displayedId)}`} style={{ animation: "slideUpIn 0.5s ease-out" }}>
        <LineBadge lineId={displayedId} size="md" />
      </div>
    </div>
  );
}

type StationDatum = {
  name: string;
  isAnswer: boolean;
  otherLines: LineId[];
  isFork: boolean;
};

type GraphicsSnapshot = {
  questionKey: string;
  stationData: StationDatum[];
  color: string;
  leftTerminus: boolean;
  rightTerminus: boolean;
  showHints: boolean;
};

type LabelsSnapshot = {
  questionKey: string;
  stationData: StationDatum[];
  selectedAnswer: string | null;
  isCorrect: boolean;
  showHints: boolean;
};

function GraphicsRow({ stationData, color, leftTerminus, rightTerminus, showHints }: Omit<GraphicsSnapshot, "questionKey">) {
  const Segment = () => (
    <div className="h-1.5 flex-1 sm:flex-none sm:w-36 mt-[11px]" style={{ backgroundColor: color }} />
  );
  const Tail = ({ show }: { show: boolean }) => (
    <div className="h-1.5 w-6 flex-shrink-0 mt-[11px]" style={{ backgroundColor: show ? color : "transparent" }} />
  );

  return (
    <div className="flex items-start w-full sm:w-auto sm:justify-center">
      <Tail show={!leftTerminus} />
      {stationData.map(({ isAnswer, otherLines, isFork }, i) => (
        <div key={i} className={`flex items-start${i < stationData.length - 1 ? " flex-1 sm:flex-none" : ""}`}>
          <div style={{ width: 28 }}>
            <div className="relative">
              {isFork && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 w-1.5"
                  style={{ backgroundColor: color, height: 16, bottom: "100%" }}
                />
              )}
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 border-4"
                style={
                  !showHints
                    ? { backgroundColor: color, borderColor: color }
                    : otherLines.length > 0
                    ? { backgroundColor: "white", borderColor: "black", borderWidth: 5 }
                    : { backgroundColor: color, borderColor: color }
                }
              />
            </div>
          </div>
          {i < stationData.length - 1 && <Segment />}
        </div>
      ))}
      <Tail show={!rightTerminus} />
    </div>
  );
}

// Crossfades between graphics rows when the question changes.
function AnimatedGraphics(props: GraphicsSnapshot) {
  const [displayedKey, setDisplayedKey] = useState(props.questionKey);
  const [outgoing, setOutgoing] = useState<GraphicsSnapshot | null>(null);
  const prevRef = useRef(props);

  if (props.questionKey !== displayedKey) {
    setDisplayedKey(props.questionKey);
    setOutgoing(prevRef.current);
  }
  prevRef.current = props;

  return (
    <div className="relative">
      {outgoing && (
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ animation: "slideUpOut 0.5s ease-in forwards" }}
          onAnimationEnd={() => setOutgoing(null)}
        >
          <GraphicsRow {...outgoing} />
        </div>
      )}
      <div key={displayedKey} style={{ animation: "slideUpIn 0.5s ease-out" }}>
        <GraphicsRow {...props} />
      </div>
    </div>
  );
}

function LabelsRow({ stationData, selectedAnswer, isCorrect, showHints }: Omit<LabelsSnapshot, "questionKey">) {
  return (
    <div className="flex items-start w-full sm:w-auto sm:justify-center">
      <div className="w-6 flex-shrink-0" />
      {stationData.map(({ name, isAnswer, otherLines }, i) => (
        <div key={i} className={`flex items-start${i < stationData.length - 1 ? " flex-1 sm:flex-none" : ""}`}>
          <div className="flex flex-col items-center" style={{ width: 28 }}>
            <div className="flex flex-col items-center gap-1 w-24 sm:w-[150px]">
              <span
                className={`text-center text-base leading-tight min-h-[2.5rem] flex items-center justify-center ${
                  isAnswer
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
                : (
                    <span className="w-6 h-6 rounded-full bg-gray-400 dark:bg-gray-500 flex items-center justify-center text-white text-xs font-bold">?</span>
                  )
              }
            </div>
          </div>
          {i < stationData.length - 1 && <div className="flex-1 sm:flex-none sm:w-36" />}
        </div>
      ))}
      <div className="w-6 flex-shrink-0" />
    </div>
  );
}

function AnimatedLabels(props: LabelsSnapshot) {
  const [displayedKey, setDisplayedKey] = useState(props.questionKey);
  const [outgoing, setOutgoing] = useState<LabelsSnapshot | null>(null);
  const prevRef = useRef(props);

  if (props.questionKey !== displayedKey) {
    setDisplayedKey(props.questionKey);
    setOutgoing(prevRef.current);
  }
  prevRef.current = props;

  return (
    <div className="relative">
      {outgoing && (
        <div
          className="absolute inset-x-0 top-0 pointer-events-none"
          style={{ animation: "slideUpOut 0.5s ease-in forwards" }}
          onAnimationEnd={() => setOutgoing(null)}
        >
          <LabelsRow {...outgoing} />
        </div>
      )}
      <div key={displayedKey} style={{ animation: "slideUpIn 0.5s ease-out" }}>
        <LabelsRow {...props} />
      </div>
    </div>
  );
}

type Props = {
  lineId: LineId;
  context: string[];
  variant: "next" | "middle";
  correctAnswer: string;
  selectedAnswer?: string | null;
  isCorrect?: boolean;
  showHints?: boolean;
};

export default function MetroLinePrompt({ lineId, context, variant, correctAnswer, selectedAnswer, isCorrect, showHints = true }: Props) {
  const { t } = useLang();
  const color = lineColor(lineId);
  const answerLabel = selectedAnswer ?? "??";

  const stationNames = variant === "middle"
    ? [context[0], answerLabel, context[1]]
    : [...context, answerLabel];
  const answerIndex = variant === "middle" ? 1 : stationNames.length - 1;

  const termini = new Set([lines[lineId][0], lines[lineId][lines[lineId].length - 1]]);
  const leftTerminus = termini.has(context[0]);
  const rightTerminus = variant === "middle" ? termini.has(context[1]) : termini.has(correctAnswer);

  const stationData = stationNames.map((name, i) => {
    const isAnswer = i === answerIndex;
    const lookupName = isAnswer ? correctAnswer : name;
    const otherLines = (stationMap.get(lookupName)?.lines ?? [])
      .filter((l) => toCanonicalLineId(l) !== toCanonicalLineId(lineId))
      .filter((l, i, arr) => arr.findIndex((m) => toCanonicalLineId(m) === toCanonicalLineId(l)) === i);
    const isFork = FORK_STATIONS.includes(lookupName);
    return { name, isAnswer, otherLines, isFork };
  });

  const questionKey = `${String(lineId)}|${variant}|${context.join(",")}`;

  return (
    <div className="flex flex-col gap-5 sm:gap-10">
      {/* Title */}
      <div className="flex items-center text-sm text-gray-400">
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 bg-white text-gray-900" style={{ boxShadow: "0 0 0 2px #111" }}>
          M
        </span>
        <span className="ml-1"><AnimatedLineBadge lineId={lineId} /></span>
        <span className="ml-3 text-gray-900 dark:text-white text-lg font-bold">
          {variant === "middle" ? t.prompt.findMiddle : t.prompt.findNext}
        </span>
      </div>

      {/* Station area: animated graphics row + static labels row */}
      <div className="flex flex-col gap-2">
        <AnimatedGraphics
          questionKey={questionKey}
          stationData={stationData}
          color={color}
          leftTerminus={leftTerminus}
          rightTerminus={rightTerminus}
          showHints={showHints}
        />
        <AnimatedLabels
          questionKey={questionKey}
          stationData={stationData}
          selectedAnswer={selectedAnswer ?? null}
          isCorrect={isCorrect ?? false}
          showHints={showHints}
        />
      </div>
    </div>
  );
}
