import { LineId, toCanonicalLineId } from "@/data/index";
import { lineColor, lineTextColor } from "@/data/lineColors";

type Props = {
  lineId: LineId;
  size?: "sm" | "md";
};

function parseLineId(lineId: LineId): { number: string; bis: boolean } {
  const canonical = String(toCanonicalLineId(lineId));
  if (canonical.endsWith("bis")) {
    return { number: canonical.replace("bis", ""), bis: true };
  }
  return { number: canonical, bis: false };
}

export default function LineBadge({ lineId, size = "md" }: Props) {
  const { number, bis } = parseLineId(lineId);
  const bg = lineColor(lineId);
  const color = lineTextColor(lineId);
  const dim = size === "md" ? "w-7 h-7" : "w-6 h-6";
  const numSize = size === "md" ? "text-base" : "text-xs";
  const bisSize = size === "md" ? "text-[9px]" : "text-[8px]";

  return (
    <span
      className={`${dim} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
      style={{ backgroundColor: bg, color }}
    >
      <span className={`${numSize} leading-none`}>{number}</span>
      {bis && (
        <span className={`${bisSize} leading-none ml-px`}>bis</span>
      )}
    </span>
  );
}
