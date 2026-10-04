import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import definition from "../src/processes/secretionProcess.js";
import baselineDefinition from "./fixtures/secretion-performance-ae697be/secretionProcess.mjs";

// The portable fixture is the complete deployed ae697be implementation, with
// its original helper. Compare every retained buffer, including hidden meshes;
// upload versions are deliberately checked separately because caching changes
// when an unchanged buffer needs to be uploaded, not its contents.
const baseline = baselineDefinition.create();
const candidate = definition.create();
const baselineNodes = [],
  candidateNodes = [];
baseline.group.traverse((node) => baselineNodes.push(node));
candidate.group.traverse((node) => candidateNodes.push(node));
assert.equal(candidateNodes.length, baselineNodes.length);
const geometryPairs = new Map(),
  materialPairs = new Map();
let comparedBytes = 0,
  comparedStates = 0;

function equalValue(actual, expected, context) {
  assert.ok(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${context}: state differs from ae697be`,
  );
}
function equalAttribute(actual, expected, context) {
  assert.equal(Boolean(actual), Boolean(expected), context);
  if (!actual) return;
  equalValue(
    [actual.itemSize, actual.count, actual.normalized, actual.usage],
    [expected.itemSize, expected.count, expected.normalized, expected.usage],
    `${context} layout`,
  );
  assert.equal(actual.array.constructor, expected.array.constructor, context);
  const a = Buffer.from(
      actual.array.buffer,
      actual.array.byteOffset,
      actual.array.byteLength,
    ),
    b = Buffer.from(
      expected.array.buffer,
      expected.array.byteOffset,
      expected.array.byteLength,
    );
  assert.ok(a.equals(b), `${context}: full buffer differs from ae697be`);
  comparedBytes += a.byteLength;
}
const bounds = (object) => [
  object.boundingBox?.min.toArray() ?? null,
  object.boundingBox?.max.toArray() ?? null,
  object.boundingSphere?.center.toArray() ?? null,
  object.boundingSphere?.radius ?? null,
];
function compareGeometry(actual, expected, context) {
  equalValue(
    [actual.type, actual.name, actual.groups, actual.drawRange, bounds(actual)],
    [
      expected.type,
      expected.name,
      expected.groups,
      expected.drawRange,
      bounds(expected),
    ],
    `${context} geometry metadata/bounds`,
  );
  equalValue(
    Object.keys(actual.attributes),
    Object.keys(expected.attributes),
    `${context} attribute names`,
  );
  for (const name of Object.keys(expected.attributes))
    equalAttribute(
      actual.attributes[name],
      expected.attributes[name],
      `${context} ${name}`,
    );
  equalAttribute(actual.index, expected.index, `${context} index`);
  equalValue(actual.morphAttributes, expected.morphAttributes, context);
}
function materialState(material) {
  const state = material.toJSON();
  delete state.uuid;
  return state;
}
function nodeState(node, nodes) {
  return [
    node.name,
    node.type,
    nodes.indexOf(node.parent),
    node.children.map((child) => nodes.indexOf(child)),
    node.visible,
    node.castShadow,
    node.receiveShadow,
    node.frustumCulled,
    node.renderOrder,
    node.position.toArray(),
    node.rotation.toArray(),
    node.quaternion.toArray(),
    node.scale.toArray(),
    node.matrix.toArray(),
    node.matrixWorld.toArray(),
    node.userData,
    node.count ?? null,
    bounds(node),
  ];
}
for (let i = 0; i < baselineNodes.length; i++) {
  const a = candidateNodes[i],
    b = baselineNodes[i];
  if (b.geometry) {
    if (geometryPairs.has(b.geometry))
      assert.equal(a.geometry, geometryPairs.get(b.geometry));
    geometryPairs.set(b.geometry, a.geometry);
  }
  if (b.material) {
    if (materialPairs.has(b.material))
      assert.equal(a.material, materialPairs.get(b.material));
    materialPairs.set(b.material, a.material);
  }
}
function compare(progress) {
  baseline.update(progress);
  candidate.update(progress);
  const context = `progress ${String(progress)}`;
  const currentNodes = [];
  candidate.group.traverse((node) => currentNodes.push(node));
  assert.equal(currentNodes.length, candidateNodes.length, context);
  for (let i = 0; i < candidateNodes.length; i++) {
    const a = candidateNodes[i],
      b = baselineNodes[i];
    assert.equal(currentNodes[i], a, `${context} node identity ${i}`);
    equalValue(
      nodeState(a, candidateNodes),
      nodeState(b, baselineNodes),
      `${context} node ${i} ${a.name}`,
    );
    if (b.geometry) assert.equal(a.geometry, geometryPairs.get(b.geometry));
    if (b.material) assert.equal(a.material, materialPairs.get(b.material));
    equalAttribute(
      a.instanceMatrix,
      b.instanceMatrix,
      `${context} instances ${i}`,
    );
    equalAttribute(a.instanceColor, b.instanceColor, `${context} colors ${i}`);
  }
  for (const [expected, actual] of geometryPairs)
    compareGeometry(actual, expected, context);
  for (const [expected, actual] of materialPairs)
    equalValue(materialState(actual), materialState(expected), context);
  equalValue(candidate.labels, baseline.labels, `${context} labels`);
  equalValue(candidate.camera, baseline.camera, `${context} camera`);
  comparedStates++;
}

const boundaries = [
  0, 0.12, 0.2, 0.32, 0.34, 0.39, 0.42, 0.56, 0.67, 0.7, 0.78, 0.9, 0.925,
  0.963, 0.992, 1,
];
const sequence = [
  ...Array.from({ length: 201 }, (_, i) => i / 200),
  ...boundaries.flatMap((p) => [p - 1e-8, p, p + 1e-8]),
  ...boundaries.toReversed(),
  ...Array.from({ length: 73 }, (_, i) => ((i * 37) % 73) / 72),
  ...Array.from({ length: 11 }, (_, i) => 0.962 + i * 0.0031),
  0.975,
  0.975,
  0.94,
  0.88,
  0.94,
  1,
  1,
  0,
  NaN,
  Infinity,
  -Infinity,
  -1,
  2,
];
for (const progress of sequence) compare(progress);

const named = (name) => candidate.group.getObjectByName(name);
const er = named("continuous-ER-carrier-neck").geometry;
const golgi = named("continuous-Golgi-carrier-neck").geometry;
const closure = named("receiving-membrane-pore-patch").geometry;
const fusion = named("continuous-fusion-shell").geometry;
const lipids = named("persistent-carrier-membrane-lipids").children;
const versions = () => [
  ...[er, golgi, closure, fusion].map((g) => g.attributes.position.version),
  ...lipids.map((node) => node.instanceMatrix.version),
];
candidate.update(0.1);
const staticVersions = versions();
candidate.update(0.19);
equalValue(versions(), staticVersions, "unchanged shapes do not re-upload");
candidate.update(0.5);
const maturationVersions = versions();
assert.ok(maturationVersions[1] > staticVersions[1]);
assert.equal(named("continuous-Golgi-carrier-neck").visible, false);
candidate.update(0.55);
assert.ok(versions()[1] > maturationVersions[1], "hidden bridge still matures");
candidate.update(0.915);
const openingVersions = versions();
candidate.update(0.915);
equalValue(
  versions(),
  openingVersions,
  "repeated dynamic state does not upload",
);
candidate.update(0.919);
const movedVersions = versions();
for (const index of [2, 3, 4, 5])
  assert.ok(movedVersions[index] > openingVersions[index]);
candidate.update(0.94);
const plateauVersions = versions();
candidate.update(0.955);
equalValue(versions(), plateauVersions, "open pore plateau keeps fixed shapes");
candidate.update(0.88);
const rewoundVersions = versions();
candidate.update(0.94);
for (const index of [4, 5])
  assert.ok(
    versions()[index] > rewoundVersions[index],
    "lipid mode invalidates",
  );
assert.equal(versions()[0], staticVersions[0], "ER bridge is built only once");

const fixtureUrl = new URL(
  "./fixtures/secretion-performance-ae697be/secretionProcess.mjs",
  import.meta.url,
);
const baselineSha256 = createHash("sha256")
  .update(await readFile(fixtureUrl))
  .digest("hex");
assert.equal(
  baselineSha256,
  "0c3ca513491442f08cf2963637e1696354e47d36f3c5b040d26684296bedb1dc",
  "Frozen fixture is the exact ae697be source",
);
const report = {
  baseline: "ae697be",
  baselineSha256,
  result: "all states bitwise equal",
  comparedStates,
  nodes: candidateNodes.length,
  uniqueGeometries: geometryPairs.size,
  uniqueMaterials: materialPairs.size,
  comparedBufferBytes: comparedBytes,
  progressSequence: sequence.map((p) => (Number.isFinite(p) ? p : String(p))),
  coverage: [
    "all indexed vertex/normal/uv buffers, index buffers, instance matrices",
    "hidden and visible nodes, geometry/instance bounds, material serialization",
    "hierarchy, object identity, transforms, labels, camera, userData",
    "dense playback, boundary epsilon, reverse/random seeks, non-finite progress",
    "dependency cache invalidation and unchanged-state upload suppression",
  ],
};
const reportFlag = process.argv.indexOf("--report");
if (reportFlag !== -1) {
  assert.ok(process.argv[reportFlag + 1], "--report requires an output path");
  await writeFile(
    process.argv[reportFlag + 1],
    `${JSON.stringify(report, null, 2)}\n`,
  );
}
console.log(
  `Secretion equivalence passed: ${comparedStates} states; ${candidateNodes.length} nodes; ${geometryPairs.size} geometries; all buffer bytes, transforms, materials, bounds and labels match ae697be.`,
);
