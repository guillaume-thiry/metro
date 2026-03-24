// Run with: npm run check-lines
// For forked lines (7, 10, 13), provide the total unique station count across both branches.

import { lines, LINE_IDS } from "../data/lines";

// Branches that belong to the same real line — will be merged and deduped.
const BRANCH_GROUPS: Record<string, (typeof LINE_IDS)[number][]> = {
  "7":  ["7_1", "7_2"],
  "10": ["10_1", "10_2"],
  "13": ["13_1", "13_2"],
};

const EXPECTED: Record<string, number> = {
  "1":    25,
  "2":    25,
  "3":    25,
  "3bis": 4,
  "4":    29,
  "5":    22,
  "6":    28,
  "7":    38, // unique stations across 7_1 and 7_2
  "7bis": 8,
  "8":    38,
  "9":    37,
  "10":   23, // unique stations across 10_1 and 10_2
  "11":   19,
  "12":   31,
  "13":   32, // unique stations across 13_1 and 13_2
  "14":   21,
};

function uniqueStationsForGroup(ids: (typeof LINE_IDS)[number][]): number {
  const seen = new Set<string>();
  for (const id of ids) for (const s of lines[id]) seen.add(s);
  return seen.size;
}

let ok = true;

for (const [key, expected] of Object.entries(EXPECTED)) {
  const group = BRANCH_GROUPS[key];
  const actual = group
    ? uniqueStationsForGroup(group)
    : lines[key as unknown as keyof typeof lines]?.length;

  if (actual === undefined) {
    console.error(`✗  Line ${key}: not found in lines data`);
    ok = false;
  } else if (actual !== expected) {
    console.error(`✗  Line ${key}: expected ${expected} stations, got ${actual}`);
    ok = false;
  } else {
    console.log(`✓  Line ${key}: ${actual} stations`);
  }
}

if (!ok) process.exit(1);
else console.log("\nAll lines match.");
