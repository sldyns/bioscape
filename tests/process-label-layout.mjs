import assert from "node:assert/strict";
import {
  annotationNumbers,
  isShortNotation,
  placeLabel,
} from "../src/processes/labelLayout.js";
const annotations = [
  { text: { zh: "人 80S 实验骨架", en: "Human 80S structure" } },
  ...["E", "P", "A", "5′", "3′"].map((text) => ({
    text: { zh: text, en: text },
  })),
  { text: { zh: "已经离开的 tRNA", en: "Departed tRNA" }, active: false },
  { text: { zh: "核糖体蛋白与 rRNA", en: "Ribosomal proteins and rRNA" } },
];
for (const lang of ["zh", "en"]) {
  assert.deepEqual(annotationNumbers(annotations, lang), [
    1,
    null,
    null,
    null,
    null,
    null,
    null,
    2,
  ]);
  annotations[6].active = true;
  assert.deepEqual(annotationNumbers(annotations, lang), [
    1,
    null,
    null,
    null,
    null,
    null,
    2,
    3,
  ]);
  annotations[6].active = false;
}
assert(isShortNotation("5′"));
assert(isShortNotation("ATP"));
assert(!isShortNotation("RNA 聚合酶 II"));
assert(!isShortNotation("Large-subunit rRNA"));
for (const viewport of [
  { width: 320, height: 260 },
  { width: 700, height: 440 },
]) {
  const occupied = [];
  for (let i = 0; i < 20; i++) {
    const place = placeLabel(
      {
        x: viewport.width / 2 + (i % 3) * 14,
        y: viewport.height / 2 + Math.floor(i / 3) * 13,
      },
      { width: 21, height: 21 },
      viewport,
      occupied,
      true,
    );
    if (!place) continue;
    assert(place.rect.left >= 8 && place.rect.right <= viewport.width - 8);
    assert(place.rect.top >= 8 && place.rect.bottom <= viewport.height - 8);
    assert(
      occupied.every(
        (r) =>
          place.rect.right <= r.left ||
          place.rect.left >= r.right ||
          place.rect.bottom <= r.top ||
          place.rect.top >= r.bottom,
      ),
    );
    occupied.push(place.rect);
  }
  assert(
    occupied.length >= 6,
    "Crowded anchors still offer readable alternatives",
  );
}
assert.equal(
  placeLabel(
    { x: -200, y: -200 },
    { width: 21, height: 21 },
    { width: 320, height: 260 },
    [],
    true,
  ),
  null,
);
console.log(
  "Process annotations: short notation, crowded anchors, viewport edges PASS",
);
