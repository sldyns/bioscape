import assert from "node:assert/strict";
import { test } from "node:test";
import { layoutCompactPins } from "../src/scene/compactPinLayout.js";

const tolerance = 1e-7;
const near = (actual, expected) =>
  assert(Math.abs(actual - expected) <= tolerance);
function separated(entries) {
  for (let i = 0; i < entries.length; i++)
    for (let j = 0; j < i; j++)
      assert(
        Math.hypot(
          entries[i].pinX - entries[j].pinX,
          entries[i].pinY - entries[j].pinY,
        ) >=
          22 - tolerance,
        `pins ${j + 1} and ${i + 1} overlap or lose their gap`,
      );
}
function inside(entries, width, height) {
  for (const entry of entries) {
    assert(entry.pinX - 9 >= 8 - tolerance);
    assert(entry.pinY - 9 >= 8 - tolerance);
    assert(entry.pinX + 9 <= width - 8 + tolerance);
    assert(entry.pinY + 9 <= height - 8 + tolerance);
  }
}
function clearsLandmarks(entries) {
  for (const pin of entries)
    for (const landmark of entries.filter((entry) => entry.protectAnchor))
      assert(
        Math.hypot(pin.pinX - landmark.x, pin.pinY - landmark.y) >=
          12 - tolerance,
        "a pin covers a protected anatomical anchor",
      );
}
function clearsTools(entries, bounds, width) {
  for (const entry of entries)
    assert(
      entry.pinX + 9 <= bounds.left + tolerance ||
        entry.pinX - 9 >= (bounds.right ?? width) - tolerance ||
        entry.pinY + 9 <= bounds.top + tolerance ||
        entry.pinY - 9 >= bounds.bottom - tolerance,
      "a pin covers the zoom controls",
    );
}

test("separated child-part pins keep their positions and physical anchors", () => {
  const entries = [
    { x: 45, y: 50, id: "first" },
    { x: 120, y: 110, id: "second" },
    { x: 220, y: 60, id: "third" },
  ];
  const before = entries.map((entry) => ({ ...entry }));
  const references = [...entries];
  assert.equal(layoutCompactPins(entries, 320, 220), entries);
  entries.forEach((entry, index) => {
    assert.equal(entry, references[index]);
    const { pinX, pinY, ...source } = entry;
    assert.deepEqual(source, before[index]);
    near(pinX, entry.x);
    near(pinY, entry.y);
  });
});

test("membrane pairs and mitochondrial triples remain individually readable", () => {
  for (const count of [2, 3]) {
    const entries = Array.from({ length: count }, () => ({ x: 160, y: 110 }));
    layoutCompactPins(entries, 320, 220);
    separated(entries);
    inside(entries, 320, 220);
    for (const entry of entries) {
      near(entry.x, 160);
      near(entry.y, 110);
    }
  }
});

test("edge clusters separate while keeping the complete pins inside the margin", () => {
  for (const [x, y] of [
    [-5, 2],
    [319, 179],
  ]) {
    const entries = Array.from({ length: 7 }, () => ({ x, y }));
    layoutCompactPins(entries, 320, 180);
    separated(entries);
    inside(entries, 320, 180);
  }
});

test("landmark pins expose their own anchor and protect it from earlier pins", () => {
  const entries = [
    { x: 160, y: 100 },
    { x: 160, y: 100, protectAnchor: true },
    { x: 163, y: 103, protectAnchor: true },
    { x: 55, y: 45 },
  ];
  layoutCompactPins(entries, 320, 220);
  separated(entries);
  clearsLandmarks(entries);
  inside(entries, 320, 220);
  near(entries[3].pinX, entries[3].x);
  near(entries[3].pinY, entries[3].y);
});

test("a pin leaves the small unnumbered target above its anchor exposed", () => {
  const entries = [
    { x: 160, y: 110, protectAnchor: true },
    { x: 160, y: 110, protectAnchor: true },
  ];
  const sources = entries.map((entry) => ({ ...entry }));
  const protectedTargets = Object.freeze([
    Object.freeze({ x: 160, y: 88, name: "tip or channel opening" }),
  ]);
  const originalTargets = protectedTargets.map((target) => ({ ...target }));
  const omitted = sources.map((entry) => ({ ...entry }));
  const empty = sources.map((entry) => ({ ...entry }));
  layoutCompactPins(omitted, 320, 220);
  layoutCompactPins(empty, 320, 220, null, []);
  empty.forEach((entry, index) => {
    near(entry.pinX, omitted[index].pinX);
    near(entry.pinY, omitted[index].pinY);
  });

  layoutCompactPins(entries, 320, 220, null, protectedTargets);
  assert.equal(
    entries.length,
    sources.length,
    "extra targets do not create pins",
  );
  entries.forEach((entry, index) => {
    const { pinX, pinY, ...source } = entry;
    assert.deepEqual(source, sources[index]);
    for (const target of protectedTargets)
      assert(Math.hypot(pinX - target.x, pinY - target.y) >= 12 - tolerance);
  });
  assert.deepEqual(protectedTargets, originalTargets);
  separated(entries);
  clearsLandmarks(entries);
  inside(entries, 320, 220);
});

test("pins avoid zoom bounds with an implicit or explicit right edge", () => {
  for (const bounds of [
    { left: 250, top: 45, bottom: 170 },
    { left: 110, top: 45, bottom: 170, right: 170 },
  ]) {
    const x = (bounds.left + (bounds.right ?? 320)) / 2;
    const entries = [
      { x, y: 100 },
      { x, y: 105, protectAnchor: true },
      { x: 220, y: 30 },
    ];
    layoutCompactPins(entries, 320, 220, bounds);
    separated(entries);
    clearsLandmarks(entries);
    clearsTools(entries, bounds, 320);
    inside(entries, 320, 220);
  }
});

test("bounded fallback finds open canvas beyond the local toolbar search", () => {
  const entries = [{ x: 500, y: 160 }];
  const bounds = { left: 80, top: 0, bottom: 320 };
  layoutCompactPins(entries, 540, 320, bounds);
  inside(entries, 540, 320);
  clearsTools(entries, bounds, 540);
});

test("repeated frames are stable and removed pins leave no accumulated occupancy", () => {
  const entries = [
    { x: 160, y: 110 },
    { x: 160, y: 110 },
    { x: 160, y: 110, protectAnchor: true },
  ];
  layoutCompactPins(entries, 320, 220);
  const first = entries.map(({ pinX, pinY }) => ({ pinX, pinY }));
  for (let frame = 0; frame < 4; frame++) {
    layoutCompactPins(entries, 320, 220);
    entries.forEach((entry, index) => {
      near(entry.pinX, first[index].pinX);
      near(entry.pinY, first[index].pinY);
    });
  }
  entries.pop();
  entries[1].x = 230;
  entries[1].y = 160;
  layoutCompactPins(entries, 320, 220);
  for (const entry of entries) {
    near(entry.pinX, entry.x);
    near(entry.pinY, entry.y);
  }
  separated(entries);
});

test("impossible tiny viewports return finite positions without an unbounded search", () => {
  for (const [width, height] of [
    [0, 0],
    [1, 1],
    [18, 18],
    [33, 20],
  ]) {
    const entries = Array.from({ length: 20 }, () => ({
      x: 0,
      y: 0,
      protectAnchor: true,
    }));
    assert.equal(layoutCompactPins(entries, width, height), entries);
    for (const entry of entries) {
      assert(Number.isFinite(entry.pinX) && Number.isFinite(entry.pinY));
      assert(entry.pinX >= 0 && entry.pinX <= width);
      assert(entry.pinY >= 0 && entry.pinY <= height);
    }
  }
});
