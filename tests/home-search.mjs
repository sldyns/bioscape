import assert from "node:assert/strict";
import { normalizeHomeSearch } from "../src/home/search.js";
import { processCatalog } from "../src/processes/catalog.js";

const matches = (query) =>
  Object.values(processCatalog)
    .filter((entry) =>
      normalizeHomeSearch(
        `${entry.title.zh} ${entry.title.en} ${entry.summary.zh} ${entry.summary.en}`,
      ).includes(normalizeHomeSearch(query)),
    )
    .map(({ id }) => id);

// Ordinary keyboard input must find the scientific typography in real records.
for (const [query, expectedIds] of [
  ["C4", ["c4cam"]],
  ["CO2", ["photorespiration", "c4cam"]],
  ["Ca2+", ["muscle"]],
  ["Kalanchoe", ["c4cam"]],
  ["  KALANCHOE  ", ["c4cam"]],
  ["Kalanchoe\u0308", ["c4cam"]],
  ["光合作用", ["photosynthesis", "bacterialPhotosynthesis"]],
])
  assert.deepEqual(matches(query), expectedIds, query);

// Normalizing both sides preserves exact scientific-input searches as well.
assert.deepEqual(matches("C₄"), matches("C4"));
assert.deepEqual(matches("Ca²⁺"), matches("Ca2+"));
assert.deepEqual(matches("Kalanchoë"), matches("Kalanchoe"));
assert.deepEqual(matches("not-a-biological-process-xyz"), []);

// Operators still carry meaning; do not strip charge or reaction direction.
assert.notEqual(normalizeHomeSearch("Ca²⁺"), normalizeHomeSearch("Ca²⁻"));
assert.notEqual(normalizeHomeSearch("A→B"), normalizeHomeSearch("A←B"));
assert.notEqual(normalizeHomeSearch("NAD⁺"), normalizeHomeSearch("NAD"));
assert.equal(normalizeHomeSearch("中文检索"), "中文检索");
assert.equal(normalizeHomeSearch("   "), "");

console.log(
  "Homepage search PASS: real catalog matches for scientific Unicode, accents, bilingual queries and case; charge and direction remain distinct.",
);
