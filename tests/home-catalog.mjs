import assert from "node:assert/strict";
import { build } from "esbuild";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), "bioscape-home-catalog-"));
try {
  const outfile = join(temporary, "catalog.mjs");
  const result = await build({
    stdin: {
      contents: `
        export * from './src/home/catalog.js';
        export { cellTypes } from './src/catalog/cellTypes.js';
        export { children, getNode } from './src/hierarchy.js';
        export * from './src/navigation.js';
        export * from './src/processes/catalog.js';
      `,
      resolveDir: project,
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    metafile: true,
    logLevel: "silent",
  });
  // Homepage metadata must never instantiate or include scene/rendering code.
  for (const input of Object.keys(result.metafile.inputs)) {
    assert.ok(!/node_modules\/three(?:\/|-)/.test(input), input);
    assert.ok(!/Process\.js$|\/Scene\w*\.[jt]sx?$/.test(input), input);
  }
  const {
    homeModels,
    homeProcesses,
    homeProcessCategories,
    featuredProcessIds,
    homepageMetrics,
    cellTypes,
    children,
    getNode,
    processCatalog,
    processesByRoot,
    processCategories,
    parsePath,
    parseExperience,
    parseProcess,
  } = await import(pathToFileURL(outfile).href);

  const bilingual = (copy, label) => {
    for (const lang of ["zh", "en"])
      assert.ok(typeof copy?.[lang] === "string" && copy[lang].trim(), label);
  };
  assert.deepEqual(
    homeModels.map(({ id }) => id),
    cellTypes.map(({ id }) => id),
  );
  assert.equal(homepageMetrics.modelCount, cellTypes.length);
  // Count reachable structures independently, including every root only once.
  const reachable = new Set();
  const visit = (id) => {
    if (reachable.has(id)) return;
    reachable.add(id);
    for (const child of children[id] || []) visit(child);
  };
  cellTypes.forEach(({ id }) => visit(id));
  assert.equal(homepageMetrics.structureCount, reachable.size);
  assert.equal(
    homepageMetrics.processCount,
    Object.keys(processCatalog).length,
  );

  for (const model of homeModels) {
    for (const key of ["title", "description", "eyebrow"])
      bilingual(model[key], `${model.id}.${key}`);
    for (const lang of ["zh", "en"])
      assert.equal(model.title[lang], getNode(model.id, lang).name);
    assert.ok(model.description.zh.length <= 28, model.id);
    assert.ok(model.description.en.length <= 80, model.id);
    assert.match(model.accent, /^#[0-9a-f]{6}$/i);
    assert.equal(model.image, `home/models/${model.id}.webp`);
    assert.deepEqual(parsePath(model.href), [model.id]);
    assert.equal(parseExperience(model.href), "structure");
  }
  const phage = homeModels.find(({ id }) => id === "phage");
  assert.match(phage.eyebrow.en, /Virus/);
  assert.match(phage.description.zh, /病毒/);
  assert.deepEqual(
    homeProcessCategories,
    Object.entries(processCategories).map(([id, title]) => ({ id, title })),
  );
  const processIds = homeProcesses.map(({ id }) => id);
  assert.equal(new Set(processIds).size, processIds.length);
  assert.deepEqual(processIds.sort(), Object.keys(processCatalog).sort());
  for (const process of homeProcesses) {
    bilingual(process.title, `${process.id}.title`);
    bilingual(process.summary, `${process.id}.summary`);
    assert.deepEqual(process.title, processCatalog[process.id].title);
    assert.deepEqual(process.summary, processCatalog[process.id].summary);
    assert.ok(processCategories[process.category]);
    assert.ok(processesByRoot[process.rootId].includes(process.id));
    assert.deepEqual(parsePath(process.href), [process.rootId]);
    assert.equal(parseExperience(process.href), "process");
    assert.equal(parseProcess(process.href), process.id);
    assert.equal(
      process.image,
      `process-thumbnails/rendered/${process.id}.webp`,
    );
    await access(join(project, "public", process.image));
  }
  for (const [id, expectedRoot] of Object.entries({
    actionPotential: "neuron",
    synapse: "neuron",
    muscle: "muscleFibre",
    osmoticBalance: "erythrocyte",
    photosynthesis: "plant",
    phageLytic: "phage",
  }))
    assert.equal(
      homeProcesses.find((entry) => entry.id === id).rootId,
      expectedRoot,
    );
  assert.equal(featuredProcessIds.length, 6);
  assert.equal(new Set(featuredProcessIds).size, featuredProcessIds.length);
  featuredProcessIds.forEach((id) => assert.ok(processCatalog[id]));
  assert.ok(
    new Set(featuredProcessIds.map((id) => processCatalog[id].category)).size >=
      4,
  );
  console.log(
    `Homepage catalog PASS: ${homeModels.length} models, ${reachable.size} unique structures, ${homeProcesses.length} valid process routes and previews; no Three.js.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
