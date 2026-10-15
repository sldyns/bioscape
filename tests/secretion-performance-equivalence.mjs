import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import definition from "../src/processes/secretionProcess.js";
import baselineDefinition from "./fixtures/secretion-performance-ae697be/secretionProcess.mjs";
import {
  secretionRefinementDelta,
  secretionStructuralNodes,
  secretionResourceIdentity,
  assertSecretionResourceIdentity,
  secretionCandidateSnapshot,
} from "./helpers/secretion-refinement-20261015-delta.mjs";

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
const delta = secretionRefinementDelta(candidate, baseline);
const candidateResources = secretionResourceIdentity(candidate);
const candidateSnapshots = new Map();
let reverseStates = 0;
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
function nodeState(node, paths, { replacedName, omitAdded = false } = {}) {
  return [
    replacedName ?? node.name,
    node.type,
    paths.get(node.parent) ?? null,
    node.children
      .filter((child) => !omitAdded || !delta.additions.has(paths.get(child)))
      .map((child) => paths.get(child)),
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
// Exhaustive reviewed delta: 334 retained nodes; exactly 16 original cut-edge
// tubes change only name + prescribed tube geometry; exactly 32 new detail
// nodes. Ancestor/type/name/same-kind occurrence selectors survive insertions.
for (const { actual: a, expected: b, replaced } of delta.pairs) {
  if (b.geometry && !replaced) {
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
function compare(progress, reverse = false) {
  baseline.update(progress);
  candidate.update(progress);
  baseline.group.updateMatrixWorld(true);
  candidate.group.updateMatrixWorld(true);
  const context = `progress ${String(progress)}${reverse ? " reverse replay" : ""}`;
  const currentPaths = secretionStructuralNodes(candidate.group);
  assert.deepEqual(
    [...currentPaths.keys()],
    [...delta.current.keys()],
    `${context} structural paths`,
  );
  for (const [path, node] of currentPaths)
    assert.equal(
      node,
      delta.current.get(path),
      `${context} node identity ${path}`,
    );
  assertSecretionResourceIdentity(
    secretionResourceIdentity(candidate),
    candidateResources,
    context,
  );
  for (const { path, actual: a, expected: b, replaced } of delta.pairs) {
    equalValue(
      nodeState(a, delta.canonical, {
        replacedName: replaced ? b.name : undefined,
        omitAdded: true,
      }),
      nodeState(b, delta.referencePaths),
      `${context} original node ${path}`,
    );
    if (b.geometry && !replaced)
      assert.equal(a.geometry, geometryPairs.get(b.geometry));
    if (b.material) assert.equal(a.material, materialPairs.get(b.material));
    equalAttribute(
      a.instanceMatrix,
      b.instanceMatrix,
      `${context} instances ${path}`,
    );
    equalAttribute(
      a.instanceColor,
      b.instanceColor,
      `${context} colors ${path}`,
    );
  }
  for (const [expected, actual] of geometryPairs)
    compareGeometry(actual, expected, context);
  for (const [expected, actual] of materialPairs)
    equalValue(materialState(actual), materialState(expected), context);
  for (const [path, detail] of delta.expectedDetails) {
    const actual = currentPaths.get(path);
    compareGeometry(
      actual.geometry,
      detail.geometry,
      `${context} prescribed ${detail.kind} ${path}`,
    );
    if (delta.additions.has(path)) {
      // New details inherit the exact old cord's local/world transforms and
      // drawing state; their only node-state differences are their own names.
      equalValue(
        nodeState(actual, delta.canonical, {
          replacedName: detail.baselineNode.name,
        }),
        nodeState(detail.baselineNode, delta.referencePaths),
        `${context} added detail state ${path}`,
      );
      const expectedMaterial = materialState(detail.baselineNode.material);
      if (detail.kind === "ribbon") {
        expectedMaterial.color = 0xb9b3a0;
        expectedMaterial.userData = {
          ...expectedMaterial.userData,
          tintWithCisterna: false,
        };
      }
      equalValue(
        materialState(actual.material),
        expectedMaterial,
        `${context} added detail material ${path}`,
      );
    }
  }
  equalValue(candidate.labels, baseline.labels, `${context} labels`);
  equalValue(candidate.camera, baseline.camera, `${context} camera`);
  const key = String(progress),
    snapshot = secretionCandidateSnapshot(candidate);
  if (candidateSnapshots.has(key))
    assert.deepEqual(
      snapshot,
      candidateSnapshots.get(key),
      `${context} complete candidate repeat`,
    );
  else {
    assert(!reverse, "reverse state must already have a forward reference");
    candidateSnapshots.set(key, snapshot);
  }
  if (reverse) reverseStates++;
  else comparedStates++;
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
for (const progress of sequence) {
  compare(progress);
  candidate.update(0.97831);
  candidate.update(0.03197);
  compare(progress, true);
}

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
const baselineHelperSha256 = createHash("sha256")
  .update(
    await readFile(
      new URL(
        "./fixtures/secretion-performance-ae697be/secretoryDetails.js",
        import.meta.url,
      ),
    ),
  )
  .digest("hex");
assert.equal(
  baselineHelperSha256,
  "7229d640920a7d9108e3f7e1132c495c6dd6c1dd9fe47ae44bce96cbca5348e4",
  "Frozen helper remains exact ae697be source",
);
assertSecretionResourceIdentity(
  secretionResourceIdentity(candidate),
  candidateResources,
  "after cache invalidation probes",
);
const report = {
  baseline: "ae697be",
  baselineSha256,
  baselineHelperSha256,
  result:
    "retained original state bitwise equal; exact reviewed cisternal detail delta",
  originalNodes: baselineNodes.length,
  byteExactRetainedNodes: 334,
  prescribedOriginalReplacements: 16,
  classifiedAdditionalNodes: 32,
  reverseStates,
  candidateResourceCounts: {
    nodes: candidateResources.nodes.length,
    geometries: candidateResources.geometries.length,
    materials: candidateResources.materials.length,
    buffers: candidateResources.buffers.length,
  },
  comparedStates,
  nodes: candidateNodes.length,
  uniqueGeometries: geometryPairs.size,
  uniqueMaterials: materialPairs.size,
  comparedBufferBytes: comparedBytes,
  progressSequence: sequence.map((p) => (Number.isFinite(p) ? p : String(p))),
  coverage: [
    "all indexed vertex/normal/uv buffers, index buffers, instance matrices",
    "hidden and visible nodes, geometry/instance bounds, material serialization",
    "structural ancestor/type/name/occurrence pairing and exhaustive 334 retained +16 replaced +32 added classification",
    "all original transforms, world matrices, node bounds, material states, labels, camera and userData",
    "all changed/new geometry exact against frozen baseline control-point derivation",
    "complete candidate snapshot repeats and reverse replay at every original pose",
    "candidate object/geometry/material/attribute/typed-array/buffer identity",
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
  `Secretion reviewed-delta equivalence passed: ${comparedStates} original states + ${reverseStates} reverse replays; 334 retained nodes exact, 16 prescribed edge replacements, 32 additions; all 382 candidate nodes checked.`,
);
