import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

const project = fileURLToPath(new URL("../", import.meta.url));
// Optional diagnostic comparison; the complete default test is self-contained.
const baseline = process.argv[2] ? resolve(process.argv[2]) : null;
const directory = await mkdtemp(join(tmpdir(), "bioscape-startup-catalog-"));
const metadataSource = `
  export * from './src/compare/state.js';
  export * from './src/compare/catalog.js';
  export * from './src/home/catalog.js';
  export * from './src/home/routes.js';
  export * from './src/navigation.js';
  export { readSceneState, sceneHash } from './src/exploration/state.js';
`;
const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

async function readMetadata(root, name) {
  const outfile = join(directory, `${name}.mjs`);
  await build({
    stdin: { contents: metadataSource, resolveDir: root },
    absWorkingDir: root,
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  return import(pathToFileURL(outfile));
}

async function staticInputs(root, name) {
  const result = await build({
    absWorkingDir: root,
    entryPoints: [
      "src/home/HomeRouter.jsx",
      "src/App.jsx",
      "src/compare/state.js",
    ],
    bundle: true,
    packages: "external",
    platform: "browser",
    format: "esm",
    outdir: join(directory, name),
    write: false,
    metafile: true,
    logLevel: "silent",
    plugins: [
      {
        name: "keep-lazy-boundaries",
        setup(builder) {
          builder.onResolve({ filter: /.*/ }, (args) =>
            args.kind === "dynamic-import"
              ? { path: args.path, external: true }
              : undefined,
          );
        },
      },
    ],
  });
  return Object.keys(result.metafile.inputs);
}

try {
  const inputs = await staticInputs(project, "current-static");
  assert.ok(
    !inputs.some((input) => /(?:^|\/)compare\/catalog\.js$/.test(input)),
    "homepage, application shell and shared-state validation must not load the comparison directory",
  );
  assert.ok(
    !inputs.some((input) =>
      /(?:CellScene|ProcessScene)\.jsx$|Process\.js$/.test(input),
    ),
    "startup metadata keeps model and process implementations behind lazy boundaries",
  );

  const current = await readMetadata(project, "current-metadata");
  const { comparisonIds, comparisonEntries, normalizeComparisonState } =
    current;
  assert.deepEqual(
    comparisonIds,
    comparisonEntries.map(({ id }) => id),
    "the ID registry preserves every directory entry and its first-visit order",
  );
  assert.equal(new Set(comparisonIds).size, comparisonIds.length);
  assert.deepEqual(current.DEFAULT_COMPARISON_STATE, {
    left: { id: "cell", mode: "whole", explode: 55, labels: true, view: null },
    right: {
      id: "plant",
      mode: "whole",
      explode: 55,
      labels: true,
      view: null,
    },
  });

  const stateCases = [undefined, null, {}, { left: null, right: [] }];
  for (const id of comparisonIds) {
    assert.equal(current.isComparisonId(id), true, `${id} remains shareable`);
    const input = {
      left: {
        id,
        mode: "explode",
        explode: 185,
        labels: false,
        view: { direction: [0, 0, 2], target: [1, -2, 3], zoom: 20 },
      },
      right: { id, mode: "section", explode: -5, labels: true },
    };
    const original = digest(input);
    const normalized = normalizeComparisonState(input);
    assert.deepEqual(normalized, {
      left: {
        id,
        mode: "explode",
        explode: 100,
        labels: false,
        view: { direction: [0, 0, 1], target: [1, -2, 3], zoom: 10 },
      },
      right: { id, mode: "section", explode: 0, labels: true, view: null },
    });
    assert.equal(digest(input), original, "shared input is never mutated");
    const hash = current.sceneHash("#/cell", {
      lang: "en",
      compare: normalized,
    });
    const restored = current.readSceneState(hash);
    assert.deepEqual(normalizeComparisonState(restored.compare), normalized);
    assert.deepEqual(
      current.readSceneState(current.resumeSceneHash(hash, "zh")).compare,
      restored.compare,
      "homepage Resume retains every comparison ID and pane setting",
    );
    stateCases.push(input);
  }
  const invalidIds = [
    "",
    "missing",
    "__proto__",
    "constructor",
    "toString",
    null,
    0,
    {},
    [],
  ];
  for (const id of invalidIds) {
    assert.equal(current.isComparisonId(id), false);
    const input = {
      left: { id, mode: "invalid", explode: Infinity, labels: "true" },
      right: { id, view: { direction: [0, 0, 0], target: [0, 0, 0], zoom: 1 } },
    };
    assert.deepEqual(
      normalizeComparisonState(input),
      current.DEFAULT_COMPARISON_STATE,
    );
    stateCases.push(input);
  }

  if (baseline) {
    const previous = await readMetadata(baseline, "baseline-metadata");
    for (const name of [
      "comparisonIds",
      "comparisonEntries",
      "comparisonGroups",
      "homeModels",
      "homeProcesses",
      "homeProcessCategories",
      "homepageMetrics",
      "featuredProcessIds",
      "DEFAULT_COMPARISON_STATE",
    ])
      assert.equal(
        digest(current[name]),
        digest(previous[name]),
        `${name}: baseline metadata is unchanged`,
      );
    for (const input of stateCases) {
      const normalized = normalizeComparisonState(input);
      assert.deepEqual(normalized, previous.normalizeComparisonState(input));
      for (const lang of ["zh", "en"]) {
        const state = { lang, compare: normalized };
        const hash = current.sceneHash("#/cell", state);
        assert.equal(hash, previous.sceneHash("#/cell", state));
        assert.deepEqual(
          current.readSceneState(hash),
          previous.readSceneState(hash),
        );
        assert.equal(
          current.resumeSceneHash(hash, lang),
          previous.resumeSceneHash(hash, lang),
        );
      }
    }
    for (const entry of current.homeProcesses) {
      assert.deepEqual(
        current.parsePath(entry.href),
        previous.parsePath(entry.href),
      );
      assert.equal(
        current.parseProcess(entry.href),
        previous.parseProcess(entry.href),
      );
      assert.equal(
        current.parseExperience(entry.href),
        previous.parseExperience(entry.href),
      );
    }
    const previousInputs = await staticInputs(baseline, "baseline-static");
    assert.ok(
      previousInputs.some((input) =>
        /(?:^|\/)compare\/catalog\.js$/.test(input),
      ),
      "the supplied pre-optimization baseline includes the eager comparison directory",
    );
  }

  console.log(
    `Startup catalog PASS: ${comparisonIds.length} ordered IDs, share/resume states, lazy static imports${baseline ? ", unchanged baseline metadata and URLs" : ""}.`,
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}
