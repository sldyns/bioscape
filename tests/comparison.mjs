import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const dir = await mkdtemp(join(tmpdir(), "bioscape-compare-test-"));
try {
  const outfile = join(dir, "comparison.mjs");
  await build({
    stdin: {
      contents:
        'export * from "./src/compare/state.js"; export * from "./src/compare/catalog.js";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const {
    normalizeComparisonState,
    normalizeComparisonView,
    sameView,
    comparisonFrameLayout,
    comparisonIds,
    comparisonRows,
    searchComparisonEntries,
  } = await import(pathToFileURL(outfile));
  assert.equal(
    searchComparisonEntries().length,
    9,
    "browse starts with complete models",
  );
  assert.ok(
    searchComparisonEntries("animal mito").some(
      (entry) => entry.id === "mitoInner",
    ),
    "search includes complete ancestry",
  );
  assert.ok(searchComparisonEntries("髓鞘").length > 0, "Chinese part search");
  assert.equal(
    searchComparisonEntries("myelin")[0].id,
    "neuronMyelin",
    "a direct part-name match ranks above its parent's similar name and other descendants",
  );
  assert.equal(searchComparisonEntries("髓鞘")[0].id, "neuronMyelin");
  assert.equal(searchComparisonEntries("myelin", "plant").length, 0);
  assert.equal(searchComparisonEntries("zzzz-no-match").length, 0);
  assert.ok(
    searchComparisonEntries("", "specialized").every(
      (entry) => entry.rootId === "specialized",
    ),
  );
  const original = {
    left: {
      id: "neuron",
      mode: "explode",
      explode: 85,
      labels: false,
      view: { direction: [0, 0, 2], target: [1, 2, 3], zoom: 1.4 },
    },
    right: { id: "plant", mode: "section", explode: 60, labels: true },
    sync: false,
  };
  const restored = normalizeComparisonState(
    JSON.parse(JSON.stringify(original)),
  );
  assert.equal(restored.left.id, "neuron");
  assert.equal(restored.left.mode, "explode");
  assert.equal(restored.left.explode, 85);
  assert.equal(restored.left.labels, false);
  assert.deepEqual(restored.left.view, {
    direction: [0, 0, 1],
    target: [1, 2, 3],
    zoom: 1.4,
  });
  assert.equal("sync" in restored, false, "comparison cameras are independent");
  const legacy = normalizeComparisonState({
    ...original,
    sync: true,
    right: {
      ...original.right,
      view: { direction: [1, 0, 0], target: [-2, 0, 1], zoom: 2 },
    },
  });
  assert.equal(
    "sync" in legacy,
    false,
    "old links cannot re-enable camera linking",
  );
  assert.deepEqual(legacy.left.view, restored.left.view);
  assert.deepEqual(
    legacy.right.view,
    {
      direction: [1, 0, 0],
      target: [-2, 0, 1],
      zoom: 2,
    },
    "each pane retains its own saved camera",
  );
  assert.equal(
    new Set(comparisonIds).size,
    comparisonIds.length,
    "each selectable ID has exactly one catalogue entry",
  );
  assert.equal(
    normalizeComparisonState({ left: { id: "neuronMyelin" } }).left.id,
    "neuronMyelin",
    "specialized parts can be shared as independent views",
  );
  assert.equal(
    comparisonRows("erythrocyte", "neuron", "en").some(
      (row) => row.key === "genome",
    ),
    true,
    "whole specimens expose corresponding comparison traits",
  );
  assert.equal(
    comparisonRows("neuronMyelin", "mitoInner", "en").some(
      (row) => row.key === "genome",
    ),
    false,
    "a magnified part must not inherit a whole-cell genome claim",
  );
  assert.deepEqual(
    original.left.view.direction,
    [0, 0, 2],
    "normalization must not mutate shared state",
  );
  const malformed = normalizeComparisonState({
    left: {
      id: "__proto__",
      mode: "boom",
      explode: Infinity,
      labels: "false",
      view: { direction: [NaN, 0, 1] },
    },
    right: null,
    sync: "false",
  });
  assert.equal(malformed.left.id, "cell");
  assert.equal(malformed.right.id, "plant");
  assert.equal(malformed.left.mode, "whole");
  assert.equal(malformed.left.explode, 55);
  assert.equal(malformed.left.view, null);
  assert.equal("sync" in malformed, false);
  assert.equal(
    normalizeComparisonState({ left: { id: "mitoInner", explode: 400 } }).left
      .explode,
    100,
    "all hierarchy levels are shareable and ranges are bounded",
  );
  assert.equal(
    normalizeComparisonState({ left: { id: "mitoInner" } }).left.id,
    "mitoInner",
  );
  assert.equal(
    normalizeComparisonView({
      direction: [0, 0, 0],
      target: [0, 0, 0],
      zoom: 1,
    }),
    null,
  );
  assert.equal(
    normalizeComparisonView({
      direction: [0, 0, 1],
      target: [Infinity, 0, 0],
      zoom: 1,
    }),
    null,
  );
  assert.equal(
    normalizeComparisonView({
      direction: [1.79e308, 1.79e308, 0],
      target: [0, 0, 0],
      zoom: 1,
    }),
    null,
    "extreme finite input must not normalize into an unusable camera",
  );
  assert.equal(
    normalizeComparisonView({
      direction: [0, 0, 1],
      target: [0, 0, 0],
      zoom: 0.15,
    }).zoom,
    0.15,
    "share restoration preserves valid renderer zoom on narrow viewports",
  );
  const linked = restored.left.view;
  assert.equal(
    sameView(linked, { ...linked, zoom: 1.40000001 }),
    true,
    "rounding must not cause redundant camera state updates",
  );
  assert.equal(sameView(linked, { ...linked, zoom: 1.5 }), false);
  for (const [width, height, stacked] of [
    [1920, 1080, false],
    [1200, 1200, false],
    [1080, 1920, true],
  ]) {
    const layout = comparisonFrameLayout(width, height);
    assert.equal(layout.stacked, stacked);
    assert.equal(layout.panes.length, 2);
    for (const p of layout.panes) {
      assert.ok(p.width > 0 && p.height > 0);
      assert.ok(
        p.x >= 0 &&
          p.y >= 0 &&
          p.x + p.width <= width &&
          p.y + p.height <= height,
      );
    }
    const [a, b] = layout.panes;
    assert.ok(
      stacked ? a.y + a.height <= b.y : a.x + a.width <= b.x,
      "exports must not overlap",
    );
  }
  assert.throws(() => comparisonFrameLayout(0, 1000), /dimensions/);
  console.log(
    "Comparison: independent saved cameras, legacy links, and export layout checks passed.",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
