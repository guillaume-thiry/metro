// Derived data — do not edit manually.
// Computed from data/lines.ts.

import { lines, LineId, CanonicalLineId } from "./lines";

export type StationInfo = {
  name: string;
  lines: LineId[];
};

// Lines with only 2 entries are placeholders (just the two terminus stubs).
// A complete line always has more stations than that.
const COMPLETE_THRESHOLD = 3;

export const activeLines = Object.entries(lines)
  .filter(([, stations]) => stations.length >= COMPLETE_THRESHOLD)
  .map(([id]) => (isNaN(Number(id)) ? id : Number(id)) as LineId);

// Full map: station name → all lines it appears on (including incomplete lines).
// Used for cross-line badges and informational display.
export const stations: Map<string, StationInfo> = new Map();

for (const [lineIdStr, stationNames] of Object.entries(lines)) {
  const lineId = (isNaN(Number(lineIdStr)) ? lineIdStr : Number(lineIdStr)) as LineId;
  for (const name of stationNames) {
    const existing = stations.get(name);
    if (existing) {
      existing.lines.push(lineId);
    } else {
      stations.set(name, { name, lines: [lineId] });
    }
  }
}

// Restricted to active lines only — used for question generation.
export const stationList: StationInfo[] = Array.from(stations.values())
  .filter((s) => s.lines.some((l) => activeLines.includes(l)))
  .map((s) => ({ ...s, lines: s.lines.filter((l) => activeLines.includes(l)) }));

export { lines };
export { LINE_IDS, LINE_WEIGHTS, toCanonicalLineId } from "./lines";
export type { LineId, CanonicalLineId };
