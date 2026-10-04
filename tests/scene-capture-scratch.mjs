import assert from "node:assert/strict";
import test from "node:test";
import {
  createCaptureLabelMask,
  layoutCaptureLabels,
} from "../src/scene/sceneCapture.js";

const measure = (text, size) => [...text].length * size * 0.52;

function pixels(width, height, phase) {
  const data = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const stripe = (x * 3 + y * 5 + phase * 7) % 29;
      data[(y * width + x) * 4 + 3] =
        phase < 0
          ? 0
          : stripe < 2
            ? 9
            : stripe === 3
              ? 8
              : stripe > 23
                ? 255
                : 0;
    }
  return data;
}

function labels(width, height, phase) {
  return Array.from({ length: 12 }, (_, index) => ({
    text: `${index % 3 === 0 ? "细胞结构" : "Label"} ${index}`,
    x: width * (index % 2 ? 0.78 : 0.22),
    y: height * (0.12 + ((index * 7 + phase * 3) % 17) / 23),
    priority: index % 4,
  }));
}

test("borrowed masks clear old alpha and preserve queries across changing strides", () => {
  const scratch = {};
  for (const [width, height, scale, phase] of [
    [640, 360, 1, 0],
    [640, 360, 1, -1],
    [191, 127, 0.5, 1],
    [80, 120, 2, 2],
    [640, 360, 1, 3],
    [641, 361, 0.75, -1],
  ]) {
    const data = pixels(width, height, phase);
    const independent = createCaptureLabelMask(data, width, height, scale);
    const borrowed = createCaptureLabelMask(
      data,
      width,
      height,
      scale,
      scratch,
    );
    for (let y = -1; y <= 6; y++)
      for (let x = -1; x <= 8; x++) {
        const box = [
          (x * width) / (8 * scale),
          (y * height) / (6 * scale),
          width / (7 * scale),
          height / (5 * scale),
        ];
        assert.equal(borrowed(...box), independent(...box));
      }
    if (phase < 0)
      assert.equal(borrowed(0, 0, width / scale, height / scale), 0);
  }
});

test("default masks remain independent while borrowed buffers are reused", () => {
  const width = 96,
    height = 64;
  const filled = new Uint8Array(width * height * 4).fill(255);
  const empty = new Uint8Array(filled.length);
  const independent = createCaptureLabelMask(filled, width, height);
  const scratch = {};
  createCaptureLabelMask(filled, width, height, 1, scratch);
  const buffers = Object.values(scratch);
  const blank = createCaptureLabelMask(empty, width, height, 1, scratch);
  assert.equal(blank(0, 0, width, height), 0);
  assert.equal(independent(0, 0, width, height), width * height);
  assert.equal(Object.values(scratch).length, buffers.length);
  Object.values(scratch).forEach((buffer, index) =>
    assert.strictEqual(buffer, buffers[index]),
  );
});

test("pooled label search matches independent layouts after changing frames and sizes", () => {
  const scratch = {};
  const previous = [];
  for (const [width, height, scale, phase] of [
    [960, 640, 1, 0],
    [960, 640, 1, 1],
    [640, 960, 0.5, 2],
    [480, 320, 1, -1],
    [960, 640, 1, 4],
    [96, 64, 1, 5],
    [640, 960, 0.5, 6],
  ]) {
    const data = pixels(width, height, phase);
    const logicalWidth = width / scale,
      logicalHeight = height / scale;
    const items = labels(logicalWidth, logicalHeight, Math.max(0, phase));
    const expected = layoutCaptureLabels(
      items,
      logicalWidth,
      logicalHeight,
      measure,
      createCaptureLabelMask(data, width, height, scale),
    );
    const actual = layoutCaptureLabels(
      items,
      logicalWidth,
      logicalHeight,
      measure,
      createCaptureLabelMask(data, width, height, scale, scratch),
      scratch,
    );
    assert.deepEqual(actual, expected);
    previous.push({ actual, snapshot: structuredClone(actual) });
    for (const item of previous)
      assert.deepEqual(
        item.actual,
        item.snapshot,
        "Returned layouts cannot alias scratch",
      );
  }
});

test("steady-size label playback retains scratch allocations across both columns", () => {
  const scratch = {};
  const width = 960,
    height = 640;
  let retained;
  for (let phase = 0; phase < 6; phase++) {
    const data = pixels(width, height, phase);
    const result = layoutCaptureLabels(
      labels(width, height, phase),
      width,
      height,
      measure,
      createCaptureLabelMask(data, width, height, 1, scratch),
      scratch,
    );
    assert.equal(result.length, 12);
    if (!retained) retained = new Set(Object.values(scratch));
    assert.equal(Object.values(scratch).length, retained.size);
    for (const buffer of Object.values(scratch))
      assert(
        retained.has(buffer),
        "No new typed arrays after same-size warmup",
      );
  }
});
