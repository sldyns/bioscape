import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";

const source = process.env.BIOSCAPE_CAPTURE_TEST_MODULE
  ? pathToFileURL(process.env.BIOSCAPE_CAPTURE_TEST_MODULE)
  : new URL("./sceneCapture.js", import.meta.url);
const { layoutCaptureLabels } = await import(source);
const measure = (text, size) => text.length * size * 0.6;
const width = 1920,
  height = 730;
const physical = [
  ["Human 80S · experimental 4UG0", 0.3],
  ["E", 0.4],
  ["5′", 0.4],
  ["N terminus", 0.6],
  ["Peptide exit path (schematic)", 0.6],
  ["PTC · large-subunit rRNA catalysis", 0.6],
  ["3′", 0.6],
  ["A", 0.6],
  ["P", 0.6],
].map(([text, x]) => ({ text, x: x * width, y: 365, priority: 2 }));
const notes = [
  "RNA C4′ / protein Cα · registered",
  "Inside the ribosome · separate reaction enlargement",
  "Blue-grey: rRNA · gold: proteins",
  "Ribosome-fixed view: mRNA shifts left",
].map((text) => ({
  text,
  x: width * 0.75,
  y: height * 0.15,
  annotationKind: "context",
}));

test("four translation notes preserve PTC, peptide exit and every fitting physical callout", () => {
  const labels = [...physical, ...notes],
    before = JSON.stringify(labels),
    result = layoutCaptureLabels(labels, width, height, measure);
  assert.deepEqual(
    new Set(result.map((x) => x.text)),
    new Set(labels.map((x) => x.text)),
    "scope notes displaced a fitting physical annotation",
  );
  assert.equal(result.filter((x) => x.annotationKind === "context").length, 4);
  assert.equal(JSON.stringify(labels), before);
  assert(
    notes.some((note) => result.find((x) => x.text === note.text).side === -1),
  );
  for (const item of result) {
    assert.equal(item.fontSize, width / 65, "caption font was reduced");
    assert(item.left >= 0 && item.left + item.width <= width);
    assert(item.top >= 0 && item.top + item.height <= height);
  }
  for (const side of [-1, 1]) {
    const column = result
      .filter((x) => x.side === side)
      .sort((a, b) => a.top - b.top);
    for (let i = 1; i < column.length; i++)
      assert(column[i].top >= column[i - 1].top + column[i - 1].height);
  }
});

test("ordinary physical callouts retain their side, font, identities and deterministic layout", () => {
  const a = layoutCaptureLabels(physical, width, height, measure),
    b = layoutCaptureLabels(physical, width, height, measure);
  assert.deepEqual(a, b);
  assert.deepEqual(
    new Set(a.map((x) => x.text)),
    new Set(physical.map((x) => x.text)),
  );
  for (const item of a) {
    assert.equal(item.side, item.x < width / 2 ? -1 : 1);
    assert.equal(item.fontSize, width / 65);
  }
});

test("context text remains mandatory and impossible capture dimensions still fail", () => {
  assert.throws(() => layoutCaptureLabels(notes, 63, 100, measure), RangeError);
  assert.throws(
    () =>
      layoutCaptureLabels([{ ...notes[0], text: "" }], width, height, measure),
    RangeError,
  );
  assert.throws(
    () =>
      layoutCaptureLabels(
        Array.from({ length: 80 }, () => ({ ...notes[0] })),
        100,
        100,
        measure,
      ),
    RangeError,
  );
});
