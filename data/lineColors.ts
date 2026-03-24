import { LineId, CanonicalLineId, toCanonicalLineId } from "./lines";

// Official RATP line colors, keyed by canonical line id.
export const lineColors: Record<CanonicalLineId, string> = {
  1:      "#FFCE00",
  2:      "#0064B0",
  3:      "#9F9825",
  "3bis": "#98D4E2",
  4:      "#C04191",
  5:      "#F28E42",
  6:      "#83C491",
  7:      "#F3A4BA",
  "7bis": "#83C491",
  8:      "#CEADD2",
  9:      "#D5C900",
  10:     "#E3B32A",
  11:     "#8D5E2A",
  12:     "#00814F",
  13:     "#98D4E2",
  14:     "#662483",
};

// Lines where the badge text should be white (dark background colors).
// All others default to dark text.
const WHITE_TEXT_LINES: CanonicalLineId[] = [2, 3, 4, 11, 12, 14];

export function lineColor(lineId: LineId): string {
  return lineColors[toCanonicalLineId(lineId)];
}

export function lineTextColor(lineId: LineId): string {
  return WHITE_TEXT_LINES.includes(toCanonicalLineId(lineId)) ? "white" : "#1a1a1a";
}
