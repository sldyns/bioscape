import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const directory = await mkdtemp(join(tmpdir(), "bioscape-comparison-context-"));
try {
  const outfile = join(directory, "context.mjs");
  await build({
    stdin: {
      contents: `
        export * from './src/compare/state.js';
        export * from './src/compare/catalog.js';
        export * from './src/exploration/state.js';
        export * from './src/home/routes.js';
        export { contextNotes } from './src/catalog/cellTypes.js';
      `,
      resolveDir: process.cwd(),
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile,
    logLevel: "silent",
  });
  const api = await import(pathToFileURL(outfile));
  const plantPaths = [
    ["plant", "plantNucleus", "nucleolus"],
    ["plant", "plantNucleus", "envelope", "innerNuclear"],
    ["plant", "plantMitochondria"],
  ];
  for (const path of plantPaths) {
    const id = path.at(-1);
    const input = { left: { id, path }, right: { id: "cell" } };
    const normalized = api.normalizeComparisonState(input);
    assert.deepEqual(
      normalized.left.path,
      path,
      `${path.join("/")}: comparison must preserve the selected plant context`,
    );
    assert.notEqual(normalized.left.path, path, "copy the caller's path");
    const entry = api.getComparisonEntry(id, normalized.left.path);
    assert.equal(entry.rootId, "plant");
    assert.deepEqual(entry.trail, path.slice(0, -1));
    for (const language of ["zh", "en"]) {
      assert.equal(entry.scope[language], api.contextNotes.plant[id][language]);
      const scope = api
        .comparisonRows(id, "cell", language, path)
        .find((row) => row.key === "scope");
      assert.equal(scope.left, api.contextNotes.plant[id][language]);
      const parent = api.getComparisonEntry(path.at(-2), entry.trail);
      assert.equal(parent.rootId, "plant", "Up stays in the same specimen");
    }
    const hash = api.sceneHash("#/plant", { lang: "en", compare: normalized });
    const restored = api.normalizeComparisonState(
      api.readSceneState(hash).compare,
    );
    assert.deepEqual(
      restored,
      normalized,
      "shared state retains both pane contexts",
    );
    const resumed = api.readSceneState(api.resumeSceneHash(hash, "zh"));
    assert.equal(resumed.lang, "zh");
    assert.deepEqual(api.normalizeComparisonState(resumed.compare), normalized);
    normalized.left.path.push("mutation");
    assert.deepEqual(
      input.left.path,
      path,
      "normalization cannot mutate input",
    );
  }

  // Drill down from the actual selected specimen, then follow its real parent.
  for (const path of plantPaths.slice(0, 2)) {
    let current = ["plant"];
    for (const child of path.slice(1)) {
      current = api.getComparisonChildPath(current.at(-1), current, child);
      assert.ok(current, "a real hierarchy child remains navigable");
    }
    assert.deepEqual(current, path);
    while (current.length > 1) {
      current = api.getComparisonEntry(current.at(-1), current).trail;
      assert.equal(current[0], "plant");
    }
  }
  assert.equal(
    api.getComparisonChildPath(
      "plantNucleus",
      ["plant", "plantNucleus"],
      "nucleus",
    ),
    null,
  );
  assert.equal(
    api.getComparisonChildPath(
      "plantNucleus",
      ["plant", "plantNucleus"],
      "phage",
    ),
    null,
  );

  for (const id of ["nucleolus", "innerNuclear"]) {
    const found = api
      .searchComparisonEntries("", "plant")
      .find((entry) => entry.id === id);
    assert.ok(
      found,
      `${id}: the plant picker includes shared parts in plant context`,
    );
    assert.equal(found.rootId, "plant");
    assert.equal(found.trail[0], "plant");
    assert.equal(
      api.getComparisonEntry(id).rootId,
      "cell",
      "legacy ID-only lookup keeps its canonical root",
    );
  }
  assert.equal(api.searchComparisonEntries().length, 9);
  assert.equal(
    api.comparisonEntries.length,
    182,
    "legacy canonical ID directory remains deduplicated",
  );

  const legacy = api.normalizeComparisonState({
    left: { id: "nucleolus" },
    right: { id: "plant" },
  });
  assert.deepEqual(legacy, {
    left: {
      id: "nucleolus",
      mode: "whole",
      explode: 55,
      labels: true,
      view: null,
    },
    right: {
      id: "plant",
      mode: "whole",
      explode: 55,
      labels: true,
      view: null,
    },
  });
  assert.deepEqual(
    api.normalizeComparisonState(
      api.readSceneState(api.sceneHash("#/cell", { compare: legacy })).compare,
    ),
    legacy,
  );
  for (const path of [
    null,
    "plant/plantNucleus/nucleolus",
    [],
    ["nucleolus"],
    ["plant", "nucleolus"],
    ["plant", "plantNucleus", "innerNuclear"],
    ["plant", "plantNucleus", "nucleolus", "nucleolus"],
    ["__proto__", "plantNucleus", "nucleolus"],
    ["plant", {}, "nucleolus"],
    ["cell", "plantNucleus", "nucleolus"],
    ["plant", "plantNucleus", "envelope"],
    Array(70).fill("plant"),
  ]) {
    const input = { left: { id: "nucleolus", path }, right: { id: "cell" } };
    assert.ok(
      !("path" in api.normalizeComparisonState(input).left),
      "invalid or mismatched paths are discarded",
    );
    assert.ok(
      !("path" in api.sanitizeSceneState({ compare: input }).compare.left),
      "sharing rejects invalid context rather than serializing it",
    );
  }
  const alias = ["cell", "cytoplasm", "roughER", "boundRibosomes", "mrna"];
  assert.deepEqual(
    api.normalizeComparisonState({ left: { id: "mrna", path: alias } }).left
      .path,
    alias,
  );
  assert.deepEqual(
    api.getComparisonEntry("mrna", alias).trail,
    alias.slice(0, -1),
  );
  const bilateral = api.normalizeComparisonState({
    left: { id: "nucleolus", path: plantPaths[0] },
    right: { id: "nucleolus", path: ["cell", "nucleus", "nucleolus"] },
  });
  const bilateralRestored = api.normalizeComparisonState(
    api.readSceneState(api.sceneHash("#/plant", { compare: bilateral }))
      .compare,
  );
  assert.deepEqual(
    bilateralRestored,
    bilateral,
    "same model ID can retain a different specimen per pane",
  );
  assert.notEqual(
    api.getComparisonEntry(bilateral.left.id, bilateral.left.path).scope.en,
    api.getComparisonEntry(bilateral.right.id, bilateral.right.path).scope.en,
  );

  const startup = await build({
    stdin: {
      contents:
        'export * from "./src/compare/state.js"; export * from "./src/exploration/state.js";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    format: "esm",
    platform: "node",
    write: false,
    metafile: true,
    logLevel: "silent",
  });
  assert.ok(
    !Object.keys(startup.metafile.inputs).some((path) =>
      /compare\/catalog\.js$/.test(path),
    ),
    "shared-state validation keeps the full comparison catalog lazy",
  );

  // Rendering the real components verifies that both language variants consume
  // the pane context. The lazy canvas is stubbed; this is not WebGL acceptance.
  const rendered = join(directory, "render.cjs");
  await build({
    stdin: {
      contents: `
      import React from 'react';
      import {renderToStaticMarkup} from 'react-dom/server';
      import CompareWorkspace from './src/compare/CompareWorkspace.jsx';
      export const render=(state,lang)=>renderToStaticMarkup(React.createElement(CompareWorkspace,{initialState:state,lang}));
    `,
      resolveDir: process.cwd(),
    },
    plugins: [
      {
        name: "no-canvas",
        setup(build) {
          build.onResolve({ filter: /CellScene\.jsx$/ }, () => ({
            path: "canvas",
            namespace: "stub",
          }));
          build.onLoad({ filter: /.*/, namespace: "stub" }, () => ({
            contents: "export default function Canvas(){return null}",
          }));
        },
      },
    ],
    bundle: true,
    format: "cjs",
    platform: "node",
    loader: { ".css": "empty" },
    outfile: rendered,
    logLevel: "silent",
  });
  const { render } = (await import(pathToFileURL(rendered))).default;
  for (const path of plantPaths)
    for (const lang of ["zh", "en"]) {
      const html = render(
        { left: { id: path.at(-1), path }, right: { id: "plant" } },
        lang,
      );
      assert.ok(
        html.includes(api.contextNotes.plant[path.at(-1)][lang]),
        "comparison renders the selected plant scope in both languages",
      );
      if (path.at(-1) === "nucleolus")
        assert.ok(!html.includes("typical mammalian nucleolus"));
    }
  const app = await readFile("src/App.jsx", "utf8");
  const openComparison = app.slice(
    app.indexOf("function openComparison()"),
    app.indexOf("const createShareUrl"),
  );
  assert.match(
    openComparison,
    /left:\s*\{\s*id:[^\n]+\n\s*path[, :]/,
    "opening comparison passes the current structure path",
  );
  console.log(
    "Comparison context review PASS: plant nuclear/mitochondrial notes, drilldown/Up, bilingual panes, valid/legacy/invalid shared states, and lazy startup imports.",
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
