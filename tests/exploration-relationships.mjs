import assert from "node:assert/strict";
import { build } from "esbuild";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extensionEntries } from "../src/processes/extensions.js";
import { createHash } from "node:crypto";

// Removing a process mapping, moving a stage, or adding a foreign structure
// must fail this contract. Scene definitions are loaded only in this test.
const project = fileURLToPath(new URL("../", import.meta.url));
assert.ok(
  existsSync(join(project, "src/exploration/relationships.js")),
  "The complete structure/process relationship catalogue must exist",
);
const dir = await mkdtemp(join(tmpdir(), "bioscape-relationships-"));
try {
  const entry = `
    export * from './src/exploration/relationships.js';
    export { children } from './src/hierarchy.js';
    export { processCatalog, processesByRoot } from './src/processes/catalog.js';
    export { parsePath, parseProcess, parseExperience, experienceHash } from './src/navigation.js';
  `;
  const outfile = join(dir, "relationships.mjs");
  const built = await build({
    stdin: { contents: entry, resolveDir: project },
    bundle: true,
    format: "esm",
    platform: "node",
    metafile: true,
    outfile,
    logLevel: "silent",
  });
  assert.ok(
    Object.keys(built.metafile.inputs).every(
      (path) =>
        !/node_modules\/three|Process\.js$|models\/(?:erythrocyte|neuron|muscle)\.js$/.test(
          path,
        ),
    ),
    "Relationship lookup must not eagerly load geometry or Three.js",
  );
  const {
    getProcessesForStructure,
    getStructuresForProcess,
    groupProcessStructures,
    children,
    processCatalog,
    processesByRoot,
    parsePath,
    parseProcess,
    parseExperience,
    experienceHash,
  } = await import(pathToFileURL(outfile));
  const specializedProcesses = {
    neuron: ["actionPotential", "synapse"],
    muscleFibre: ["muscle"],
    erythrocyte: ["osmoticBalance"],
  };
  for (const [root, ids] of Object.entries(specializedProcesses))
    assert.deepEqual(
      processesByRoot[root],
      ids,
      `${root}: expose only the processes supported by this specimen`,
    );

  const definitions = [
    ["secretion", "./secretionProcess.js"],
    ["transcription", "./transcriptionProcess.js"],
    ["photosynthesis", "./photosynthesisProcess.js"],
    ["infection", "./phageProcess.js"],
    ...extensionEntries.map(({ id, module }) => [id, module]),
  ];
  const definitionFile = join(dir, "stages.mjs");
  await build({
    stdin: {
      contents:
        definitions
          .map(
            ([, module], i) =>
              `import d${i} from './src/processes/${module.replace(/^\.\//, "")}';`,
          )
          .join("\n") +
        `\nexport default [${definitions.map((_, i) => `d${i}`).join(",")}].map(d => ({id:d.id, stages:d.stages.map(s => s.at), controls:(d.controls||[]).map(c=>({id:c.id,options:c.options.map(o=>o.value)}))}));`,
      resolveDir: project,
    },
    bundle: true,
    format: "esm",
    platform: "node",
    outfile: definitionFile,
    logLevel: "silent",
  });
  const definitionMetadata = (await import(pathToFileURL(definitionFile)))
    .default;
  const controlOptions = new Map(
    definitionMetadata.map((d) => [d.id, d.controls]),
  );
  const stages = new Map(definitionMetadata.map((d) => [d.id, d.stages]));
  assert.equal(Object.keys(processCatalog).length, 84);
  let rootCases = 0;
  let destinations = 0;
  const rootOnly = [];
  for (const [root, ids] of Object.entries(processesByRoot)) {
    const rootProcesses = getProcessesForStructure([root]);
    assert.deepEqual(
      new Set(rootProcesses.map((item) => item.id)),
      new Set(ids),
      `${root}: root view must expose every supported process`,
    );
    for (const id of Object.keys(processCatalog)) {
      const links = getStructuresForProcess(root, id);
      if (!ids.includes(id)) {
        assert.deepEqual(links, [], `${id} must not leak into ${root}`);
        continue;
      }
      rootCases++;
      assert.ok(links.length, `${root}/${id}: missing relationship`);
      assert.ok(
        links.some(({ path }) => path.length === 1 && path[0] === root),
        `${root}/${id}: requires a root fallback`,
      );
      if (links.length === 1) {
        rootOnly.push(`${root}/${id}`);
        assert.ok(links[0].label?.zh && links[0].label?.en);
      }
      const seen = new Set();
      for (const at of stages.get(id)) {
        const grouped = groupProcessStructures(
          root,
          id,
          stages.get(id).map((at) => ({ at })),
          at,
        );
        assert.equal(
          grouped.current.length +
            grouped.other.flatMap((group) => group.entries).length,
          links.length - 1,
          `${root}/${id}: grouping must preserve every specific destination`,
        );
        assert.ok(
          grouped.current.every((item) => item.at === at),
          `${root}/${id}: current entries must belong to current stage`,
        );
      }
      for (const { path, at, label, when } of links) {
        destinations++;
        assert.equal(path[0], root, `${id}: foreign root`);
        assert.ok(!seen.has(path.join("/")), `${id}: repeated destination`);
        seen.add(path.join("/"));
        for (let i = 1; i < path.length; i++)
          assert.ok(
            children[path[i - 1]]?.includes(path[i]),
            `${id}: nonexistent hierarchy path ${path.join("/")}`,
          );
        if (at !== undefined)
          assert.ok(
            stages.get(id)?.includes(at),
            `${id}: ${at} is not an actual stage boundary`,
          );
        if (label) assert.ok(label.zh && label.en, `${id}: bilingual label`);
        for (const [key, value] of Object.entries(when || {}))
          assert.ok(
            controlOptions
              .get(id)
              .find((control) => control.id === key)
              ?.options.includes(value),
            `${id}: branch constraint must name a real control option`,
          );
        const inverse = getProcessesForStructure(path).find(
          (process) => process.id === id,
        );
        assert.ok(inverse, `${id}: missing reverse relationship`);
        assert.deepEqual(inverse.structurePath, path);
        assert.equal(inverse.entryProgress, at ?? 0);
      }
    }
  }

  const has = (path, id) =>
    getProcessesForStructure(path.split("/")).find((entry) => entry.id === id);
  assert.equal(has("cell/golgi", "secretion").entryProgress, 0.2);
  assert.equal(
    has("cell/mitochondria/mitoInner/atpSynthase", "respiration").entryProgress,
    0.67,
  );
  assert.equal(
    has("plant/chloroplast/stroma/rubisco", "photosynthesis").entryProgress,
    0.66,
  );
  assert.equal(
    has("plant/plantNucleus/nuclearPores", "nuclearTransport").entryProgress,
    0.34,
  );
  assert.equal(
    has("cell/roughER/boundRibosomes/smallSubunit", "translation")
      ?.entryProgress,
    0.13,
    "ER-bound and free ribosomes share the translation mechanism",
  );
  assert.equal(
    has("plant/plantER/plantRibosome/plant60S", "translation")?.entryProgress,
    0.33,
  );
  assert.equal(
    has("phage/phageTail/phageSheath", "infection").entryProgress,
    0.32,
  );
  const alias = ["cell", "cytoplasm", "golgi"];
  const secretion = getProcessesForStructure(alias).find(
    (entry) => entry.id === "secretion",
  );
  assert.deepEqual(
    secretion.structurePath,
    alias,
    "Preserve actual entry path",
  );
  assert.equal(secretion.relation, "exact");
  assert.equal(secretion.entryProgress, 0.2);
  assert.equal(
    has("cell/cytoplasm", "secretion")?.relation,
    "descendant",
    "The cytoplasm overview includes its organelles' processes",
  );
  assert.ok(
    !has("cell/cytoplasm", "transcription"),
    "Nuclear transcription must not become a cytoplasmic process",
  );

  // Explicit entry points do not confer the mechanism on every child.
  for (const [path, id] of [
    ["cell/nucleus/nucleolus", "transcription"],
    ["cell/nucleus/envelope", "replication"],
    ["cell/mitochondria/matrix/mitoDNA", "respiration"],
    ["cell/membrane/glycans", "activeTransport"],
    ["plant/plantNucleus/nuclearPores", "dnaRepair"],
  ])
    assert.ok(!has(path, id), path + ": reject broad ancestor fallthrough");
  const secretionStages = stages.get("secretion").map((at) => ({ at }));
  const opening = groupProcessStructures(
    "cell",
    "secretion",
    secretionStages,
    0,
  );
  assert.equal(opening.current.length, 2);
  const budding = groupProcessStructures(
    "cell",
    "secretion",
    secretionStages,
    0.12,
  );
  assert.equal(
    budding.current.length,
    0,
    "Do not mark a previous stage as current",
  );
  assert.equal(budding.other.flatMap((group) => group.entries).length, 8);
  assert.equal(
    groupProcessStructures(
      "cell",
      "secretion",
      secretionStages,
      0.9,
    ).current[0].path.at(-1),
    "membrane",
  );
  assert.deepEqual(has("plant/vacuole", "c4cam").entryParameters, {
    strategy: "cam",
  });
  assert.deepEqual(has("cell/membrane/bilayer", "diffusion").entryParameters, {
    route: "oxygen",
  });
  const branches = (id, root, parameters) =>
    groupProcessStructures(
      root,
      id,
      stages.get(id).map((at) => ({ at })),
      0.38,
      parameters,
    );
  const allLinks = (group) => [
    ...group.current,
    ...group.other.flatMap((item) => item.entries),
  ];
  assert.ok(
    !allLinks(branches("c4cam", "plant", { strategy: "c4" })).some(
      (item) => item.path.at(-1) === "vacuole",
    ),
  );
  assert.ok(
    !allLinks(branches("c4cam", "plant", { strategy: "cam" })).some(
      (item) => item.path.at(-1) === "plasmodesmata",
    ),
  );
  assert.ok(
    !allLinks(branches("diffusion", "plant", { route: "oxygen" })).some(
      (item) => item.path.at(-1) === "plantAquaporin",
    ),
  );

  const candidates = getProcessesForStructure([
    "cell",
    "mitochondria",
    "mitoInner",
    "atpSynthase",
  ]);
  const rank = { exact: 0, ancestor: 1, descendant: 2 };
  for (let i = 1; i < candidates.length; i++)
    assert.ok(rank[candidates[i - 1].relation] <= rank[candidates[i].relation]);
  assert.equal(candidates[0].id, "respiration");
  assert.ok(
    !has("cell/golgi", "mitosis"),
    "Root fallbacks cannot match all parts",
  );
  assert.ok(!has("plant/plantER", "secretion"), "Only allowed roots may match");
  assert.ok(!has("phage/phageTail/phageSheath", "phageLysogenic"));
  assert.ok(!has("bacterium/pili/pilusRod", "conjugation"));
  assert.ok(!has("bacterium/bacterialEnvelope", "bacterialPhotosynthesis"));
  assert.ok(!has("yeast/yeastBud", "fungalHyphae"));
  assert.ok(!has("yeast/yeastMito", "yeastFermentation"));
  assert.ok(!has("paramecium/paraMicro", "translation"));
  assert.equal(
    has("neuron/neuronAxon", "actionPotential")?.entryProgress,
    0.42,
  );
  assert.equal(has("neuron/neuronTerminals", "synapse")?.entryProgress, 0.38);
  assert.equal(has("neuron/neuronDendrites", "synapse")?.entryProgress, 0.56);
  assert.equal(
    has("muscleFibre/muscleFibreMyofibrils", "muscle")?.entryProgress,
    0.43,
  );
  assert.equal(
    has("muscleFibre/muscleFibreSarcomere", "muscle")?.entryProgress,
    0,
  );
  assert.equal(
    has("erythrocyte/erythrocyteMembrane", "osmoticBalance")?.entryProgress,
    0.38,
  );
  for (const path of [
    "neuron/neuronNucleus",
    "neuron/neuronMyelin",
    "neuron/neuronNodes",
    "muscleFibre/muscleFibreNuclei",
    "muscleFibre/muscleFibreSarcolemma",
  ])
    assert.deepEqual(
      getProcessesForStructure(path.split("/")),
      [],
      `${path}: no process for an anatomical mechanism outside the selected models`,
    );
  for (const id of ["transcription", "respiration", "differentiation"])
    assert.deepEqual(getStructuresForProcess("erythrocyte", id), []);
  for (const [root, ids] of Object.entries(specializedProcesses))
    for (const id of ids) {
      const destinations = getStructuresForProcess(root, id);
      assert.ok(destinations.every(({ path }) => path[0] === root));
      for (const { path } of destinations) {
        assert.deepEqual(
          getProcessesForStructure(path).find((item) => item.id === id)
            ?.structurePath,
          path,
          "Keep the specialized origin instead of redirecting to the generic animal cell",
        );
        const hash = experienceHash(path, "process", id);
        assert.deepEqual(parsePath(hash), path);
        assert.equal(parseExperience(hash), "process");
        assert.equal(parseProcess(hash), id);
      }
    }
  assert.deepEqual(getStructuresForProcess("plant", "autophagy"), []);
  assert.deepEqual(getStructuresForProcess("__proto__", "transcription"), []);
  assert.deepEqual(getStructuresForProcess("cell", "__proto__"), []);
  for (const path of [
    null,
    [],
    "cell/golgi",
    ["nope"],
    ["cell", "chloroplast"],
    ["plant", "plantER", "roughER"],
  ])
    assert.deepEqual(getProcessesForStructure(path), []);

  const editable = getStructuresForProcess("cell", "secretion");
  editable[0].path.push("bad");
  assert.ok(
    getStructuresForProcess("cell", "secretion").every(
      ({ path }) => !path.includes("bad"),
    ),
    "Consumers cannot mutate the shared mapping catalogue",
  );

  // Exercise the existing directory with the real specialized roots. Its lookup
  // must retain the specimen identity and render only the supported process list.
  const directoryFile = join(dir, "directory.cjs");
  await build({
    stdin: {
      contents: `
        import React from 'react';
        import { renderToStaticMarkup } from 'react-dom/server';
        import ProcessDirectory from './src/processes/ProcessDirectory.jsx';
        export const renderDirectory = (rootId) => renderToStaticMarkup(
          React.createElement(ProcessDirectory, { rootId, lang: 'en' })
        );
      `,
      resolveDir: project,
    },
    bundle: true,
    format: "cjs",
    platform: "node",
    loader: { ".css": "empty" },
    outfile: directoryFile,
    logLevel: "silent",
  });
  const { renderDirectory } = (await import(pathToFileURL(directoryFile)))
    .default;
  for (const [root, ids] of Object.entries(specializedProcesses)) {
    const html = renderDirectory(root);
    assert.ok(html.includes(`data-process-directory="${root}"`));
    for (const id of ids) assert.ok(html.includes(processCatalog[id].title.en));
    assert.ok(
      !html.includes(
        "Process demonstrations for this organism are not available yet.",
      ),
    );
    assert.ok(!html.includes('data-process-directory="cell"'));
  }

  // The selected definitions accept these roots without changing their models.
  // Compare their actual scene data with the established generic animal context
  // at every stage and control branch, including a backward seek. No WebGL or
  // whole-project scientific sweep is needed to verify this dispatch contract.
  const snapshot = (model) => {
    const hash = createHash("sha256");
    const seen = new Set();
    model.group.updateMatrixWorld(true);
    model.group.traverse((object) => {
      assert.ok(object.matrixWorld.elements.every(Number.isFinite));
      hash.update(
        JSON.stringify([
          object.visible,
          object.matrixWorld.elements,
          object.material?.opacity,
          object.material?.color?.toArray(),
        ]),
      );
      for (const attribute of [
        ...Object.values(object.geometry?.attributes || {}),
        object.geometry?.index,
        object.instanceMatrix,
        object.instanceColor,
      ]) {
        if (!attribute || seen.has(attribute.array)) continue;
        seen.add(attribute.array);
        assert.ok(attribute.array.every(Number.isFinite));
        hash.update(
          Buffer.from(
            attribute.array.buffer,
            attribute.array.byteOffset,
            attribute.array.byteLength,
          ),
        );
      }
    });
    hash.update(JSON.stringify(model.group.userData));
    return hash.digest("hex");
  };
  const dispose = (model) => {
    const resources = new Set();
    model.group.traverse((object) => {
      if (object.geometry) resources.add(object.geometry);
      for (const material of [object.material].flat())
        if (material) resources.add(material);
    });
    for (const resource of resources) resource.dispose();
  };
  let specializedStates = 0;
  for (const [root, ids] of Object.entries(specializedProcesses))
    for (const id of ids) {
      const metadata = extensionEntries.find((entry) => entry.id === id);
      const base = (
        await import(
          new URL(`../src/processes/${metadata.module}`, import.meta.url)
        )
      ).default;
      const definition = { ...base, ...base.contexts?.[root] };
      for (const lang of ["zh", "en"]) assert.ok(definition.intro[lang]);
      const specimen = definition.create({ rootId: root });
      const generic = base.create({ rootId: "cell" });
      try {
        const control = definition.controls[0];
        for (const option of control.options)
          for (const progress of [
            ...definition.stages.map((stage) => stage.at),
            1,
            0.37,
            0,
          ]) {
            const parameters = { [control.id]: option.value };
            specimen.update(progress, parameters);
            generic.update(progress, parameters);
            if (root === "erythrocyte")
              assert.equal(specimen.group.userData.nucleusPresent, false);
            assert.equal(
              snapshot(specimen),
              snapshot(generic),
              `${root}/${id}: root dispatch changed the existing mechanism at ${progress}`,
            );
            specializedStates++;
          }
      } finally {
        dispose(specimen);
        dispose(generic);
      }
    }
  console.log(
    `Exploration relationships: 84 processes, ${rootCases} supported root/process cases, ${destinations} validated destinations; ${rootOnly.length} qualified root-only cases.`,
  );
  console.log(`Root-only scope: ${rootOnly.join(", ")}`);
  console.log(
    `Specialized process roots: 3 directories and ${specializedStates} model/control states passed.`,
  );
} finally {
  await rm(dir, { recursive: true, force: true });
}
