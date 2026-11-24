import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { rootIds } from "../src/catalog/cellTypes.js";
import { children } from "../src/hierarchy.js";
import angles from "../src/scene/specimenAngles.json" with { type: "json" };
import moments from "../src/processes/studyMoments.json" with { type: "json" };
import { processesByRoot } from "../src/processes/catalog.js";
import { extensionEntries } from "../src/processes/extensions.js";
import { stageFrames, stageStop } from "../src/processes/studyFrames.js";
import {
  initialStructureMode,
  specimenDirection,
  turnedView,
} from "../src/scene/specimenViews.js";

const ids = new Set(rootIds);
for (const id of ids) for (const child of children[id] ?? []) ids.add(child);
assert.deepEqual(Object.keys(angles).sort(), [...ids].sort());
for (const id of ids) {
  const [yaw, tilt] = angles[id];
  assert.ok(Number.isFinite(yaw) && Number.isFinite(tilt) && tilt !== 0);
  const view = {
    direction: specimenDirection(id),
    zoom: 0.78,
    target: [1, 2, 3],
  };
  const result = turnedView(
    view,
    (yaw * Math.PI) / 180,
    (tilt * Math.PI) / 180,
  );
  assert.ok(Math.abs(Math.hypot(...result.direction) - 1) < 1e-10, id);
  assert.equal(result.zoom, view.zoom);
  assert.deepEqual(result.target, view.target);
}
assert.equal(initialStructureMode("erythrocyte"), "whole");
const files = Object.fromEntries(extensionEntries.map((e) => [e.id, e.module]));
Object.assign(files, {
  secretion: "./secretionProcess.js",
  transcription: "./transcriptionProcess.js",
  photosynthesis: "./photosynthesisProcess.js",
  infection: "./phageProcess.js",
});
assert.deepEqual(
  Object.keys(moments.processes).sort(),
  Object.keys(files).sort(),
);
// Production resolves both newer ESM and older extensionless scene imports.
const directory = await mkdtemp(join(tmpdir(), "bioscape-study-catalog-"));
const catalogFile = join(directory, "definitions.mjs");
let definitions;
try {
  await build({
    stdin: {
      contents: Object.entries(files)
        .map(
          ([id, file]) =>
            "export {default as " + id + "} from " + JSON.stringify(file),
        )
        .join("\n"),
      resolveDir: resolve("src/processes"),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile: catalogFile,
    logLevel: "silent",
  });
  definitions = await import(pathToFileURL(catalogFile));
} finally {
  await rm(directory, { recursive: true, force: true });
}
let contexts = 0,
  times = 0;
for (const [root, processes] of Object.entries(processesByRoot)) {
  for (const id of processes) {
    const base = definitions[id];
    const definition = { ...base, ...base.contexts?.[root] };
    const { stages } = definition;
    const parameters = Object.fromEntries(
      (definition.controls ?? []).map((c) => [c.id, c.default]),
    );
    const view = { direction: [0, 0, 1], target: [0, 0, 0], zoom: 1 };
    const row = moments.processes[id];
    const percents = row.roots?.[root] ?? row.default;
    assert.equal(percents.length, stages.length, id);
    assert.equal(percents.at(-1), 100, id);
    const frames = stageFrames(
      definition,
      stages,
      root,
      parameters,
      "zh",
      view,
    );
    for (const [i, frame] of frames.entries()) {
      const at = frame.options.progress;
      const lookup = (t) =>
        stages.findLastIndex((stage) => stage.at <= t + 1e-5);
      assert.ok(at >= stages[i].at && at <= 1);
      assert.equal(lookup(at), i, id);
      assert.equal(lookup(stageStop(stages, i)), i, id);
      assert.equal(frame.label, stages[i].title.zh);
      assert.equal(frame.options.view, view);
      assert.match(frame.detail, /^\d+:\d{2}$/);
    }
    const control = definition.controls?.[0];
    if (control) {
      const other = control.options.find((o) => o.value !== control.default);
      const branch = stageFrames(
        definition,
        stages,
        root,
        { ...parameters, [control.id]: other.value },
        "en",
        view,
        true,
      );
      for (const [i, frame] of branch.entries()) {
        const expected =
          i === stages.length - 1 ? 1 : (stages[i].at + stages[i + 1].at) / 2;
        assert.ok(Math.abs(frame.options.progress - expected) < 1e-10, id);
        assert.equal(frame.label, "Observation " + (i + 1));
      }
    }
    contexts++;
    times += frames.length;
  }
}
console.log(
  `Study plates verified for ${ids.size} structures, ${contexts} process contexts and ${times} stages.`,
);
