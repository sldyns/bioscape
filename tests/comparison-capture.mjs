import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
const dir = await mkdtemp(join(tmpdir(), "bioscape-comparison-capture-"));
try {
  const outfile = join(dir, "capture.mjs");
  await build({
    entryPoints: ["src/compare/capture.js"],
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const { comparisonCaptureLayout, comparisonPaneCaptions } = await import(
    pathToFileURL(outfile)
  );
  const captions = comparisonPaneCaptions(
    {
      left: {
        id: "paraMacroChromatin",
        path: ["paramecium", "paraMacro", "paraMacroChromatin"],
      },
      right: {
        id: "paraMicroChromatin",
        path: ["paramecium", "paraMicro", "paraMicroChromatin"],
      },
    },
    "zh",
  );
  assert.notEqual(
    captions[0].name + captions[0].context,
    captions[1].name + captions[1].context,
  );
  const pores = comparisonPaneCaptions(
    {
      left: {
        id: "nuclearPores",
        path: ["plant", "plantNucleus", "nuclearPores"],
      },
      right: {
        id: "yeastNuclearPores",
        path: ["yeast", "yeastNucleus", "yeastNuclearPores"],
      },
    },
    "en",
  );
  assert.match(pores[0].context, /plant/i);
  assert.match(pores[1].context, /yeast/i);
  assert.deepEqual(
    comparisonPaneCaptions(
      { left: { id: "cell" }, right: { id: "plant" } },
      "zh",
    ).map((c) => c.context),
    ["", ""],
  );
  assert.equal(
    typeof comparisonCaptureLayout,
    "function",
    "capture layout must preserve the logical export size when preview is scaled",
  );
  for (const [width, height] of [
    [1080, 1920],
    [1920, 1080],
    [1080, 1080],
  ]) {
    const exported = comparisonCaptureLayout(width, height);
    const preview = comparisonCaptureLayout(width / 4, height / 4, 0.25);
    assert.deepEqual(
      preview,
      exported,
      "preview pane positions, title metrics, and model crop must match the export in logical coordinates",
    );
  }
  const portrait = comparisonCaptureLayout(270, 480, 0.25);
  assert.equal(portrait.width, 1080);
  assert.equal(portrait.height, 1920);
  assert.equal(portrait.fontSize, 27);
  assert.equal(portrait.titleHeight, 69);
  assert.equal(portrait.panes[0].x, 0);
  assert.equal(portrait.panes[1].x, 0);
  assert.ok(portrait.panes[1].y > portrait.panes[0].height);
  assert.deepEqual(
    comparisonCaptureLayout(1080, 1920, NaN),
    comparisonCaptureLayout(1080, 1920),
  );
  console.log(
    "Comparison capture: scaled previews preserve export pane layout and identity typography.",
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
