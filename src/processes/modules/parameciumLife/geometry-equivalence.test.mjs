import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  geometrySnapshot,
  setupSnapshot,
  resourceInventory,
  disposeSnapshot,
  frozenDefinitions,
} from "./geometrySnapshot.test-support.mjs";
import { sceneKit } from "../../kit.js";
import { hollowInlet } from "./scientificGeometry.js";

// RPP-01 nuclear repair and the 2026-10-15 oral-art delta are explicit.
// Every other division subtree stays strictly on the immutable baseline.
const unchangedDivisionRoots = [
  "fission-body-half--1",
  "fission-body-half-1",
  "transverse-cleavage-furrow",
];
const changedDivisionRoots = [
  "anterior-oral-apparatus",
  "posterior-oral-apparatus",
  "macronuclear-fission-lineage",
  "micronuclear-fission-lineage",
  "micronuclear-spindle",
  ...Array.from(
    { length: 18 },
    (_, i) => `inherited-macronuclear-granule-${i}`,
  ),
  ...[-1, 1].flatMap((side) =>
    Array.from({ length: 4 }, (_, i) => `segregating-chromatid-${side}-${i}`),
  ),
];
function unchangedDivisionSnapshot({ model, parent }) {
  return unchangedDivisionRoots.map((name) => {
    const group = model.group.getObjectByName(name);
    assert(group, `original nonnuclear division subtree ${name}`);
    return geometrySnapshot(
      { group, labels: [], camera: model.camera },
      parent,
    );
  });
}

// Explicit parent/ordinal/type manifests classify unnamed nodes without collisions.
const partnerChildren = (i, current) => [
  ["", "Group"],
  current ? ["concave-oral-apparatus", "Group"] : ["", "Mesh"],
  [`maternal-macronucleus-${i}`, "Mesh"],
  ...Array.from({ length: 8 }, (_, j) => [
    `maternal-macronuclear-fragment-${i}-${j}`,
    "Mesh",
  ]),
  ...Array.from({ length: 4 }, (_, j) => [`meiotic-nucleus-${i}-${j}`, "Mesh"]),
  [`stationary-pronucleus-${i}`, "Mesh"],
  [`synkaryon-${i}`, "Group"],
  ...Array.from({ length: 8 }, (_, j) => [
    `synkaryon-descendant-${i}-${j}`,
    "Group",
  ]),
  ["", "Mesh"],
  ...Array.from({ length: 4 }, (_, j) => [
    `macronuclear-anlage-contents-${i}-${j}`,
    "Group",
  ]),
  [`postzygotic-lineage-${i}`, "Group"],
];
const childManifest = (o) =>
  o.children.map((child) => [child.name, child.type]);
const groupState = (o) => [
  o.name,
  o.type,
  o.visible,
  o.userData,
  o.position.toArray(),
  o.quaternion.toArray(),
  o.scale.toArray(),
  o.matrix.toArray(),
  o.matrixWorld.toArray(),
  o.renderOrder,
  o.frustumCulled,
];
function conjugationNonoral(current, original) {
  const top = [
    ["conjugating-partner-0", "Group"],
    ["conjugating-partner-1", "Group"],
    ["conjugation-open-passage", "Group"],
    ["migratory-pronucleus-0", "Mesh"],
    ["migratory-pronucleus-1", "Mesh"],
  ];
  for (const scene of [current, original])
    assert.deepEqual(childManifest(scene.model.group), top);
  assert.deepEqual(
    groupState(current.model.group),
    groupState(original.model.group),
  );
  for (let i = 0; i < top.length; i++) {
    const a = current.model.group.children[i],
      b = original.model.group.children[i];
    if (i < 2) {
      assert.deepEqual(childManifest(a), partnerChildren(i, true));
      assert.deepEqual(childManifest(b), partnerChildren(i, false));
      assert.deepEqual(groupState(a), groupState(b));
      // Every child is accounted for, and ordinal 1 is the only art delta.
      for (let j = 0; j < a.children.length; j++)
        if (j !== 1)
          assert.deepEqual(
            geometrySnapshot(
              {
                group: a.children[j],
                labels: [],
                camera: current.model.camera,
              },
              current.parent,
            ),
            geometrySnapshot(
              {
                group: b.children[j],
                labels: [],
                camera: original.model.camera,
              },
              original.parent,
            ),
            `partner ${i} unchanged child ${j}`,
          );
      oralInvariant(a.children[1], true);
    } else
      assert.deepEqual(
        geometrySnapshot(
          { group: a, labels: [], camera: current.model.camera },
          current.parent,
        ),
        geometrySnapshot(
          { group: b, labels: [], camera: original.model.camera },
          original.parent,
        ),
      );
  }
  assert.deepEqual(current.model.labels, original.model.labels);
  assert.deepEqual(current.model.camera, original.model.camera);
}
function oralInvariant(group, expectedWindow = false) {
  const cutaway = !!group.getObjectByName("oral-observation-cut-edges");
  const expectedChildren = [
    ["oral-lumen-wall", "Mesh"],
    ["oral-outer-wall", "Mesh"],
    ["oral-open-rim", "Mesh"],
    ["oral-open-rim", "Mesh"],
  ];
  if (cutaway)
    expectedChildren.push(
      ["oral-open-rim", "Mesh"],
      ["oral-open-rim", "Mesh"],
      ["oral-observation-cut-edges", "Mesh"],
    );
  expectedChildren.push(["oral-membranelle-rows", "Mesh"]);
  assert.deepEqual(childManifest(group), expectedChildren);
  const [wall, outer, left, right] = group.children;
  const cilia = group.getObjectByName("oral-membranelle-rows");
  const a = wall.geometry.attributes.position,
    b = outer.geometry.attributes.position;
  assert.equal(a.count, 325);
  assert.equal(b.count, 325);
  assert.equal(wall.geometry.index.count, (cutaway ? 9 : 24) * 12 * 6);
  if (cutaway)
    for (const index of wall.geometry.index.array) {
      const row = Math.floor(index / 13);
      assert(
        row <= 6 || row >= 21,
        "observation window contains no foreground triangles",
      );
    }
  assert.equal(
    cutaway,
    expectedWindow,
    "only conjugation uses an observational cut",
  );
  for (let row = 0; row <= 24; row++) {
    const first = row * 13;
    assert(a.getZ(first) - a.getZ(first + 6) > 0.1);
    assert(a.getZ(first + 12) - a.getZ(first + 6) > 0.1);
    const width = a.getX(first + 12) - a.getX(first);
    assert(Math.abs(width - 0.38 * (1 - (0.66 * row) / 24)) < 1e-6);
  }
  for (let i = 0; i < a.count; i++) {
    assert(Math.abs(a.getX(i) - b.getX(i)) < 1e-7);
    assert(Math.abs(a.getY(i) - b.getY(i)) < 1e-7);
    assert(Math.abs(a.getZ(i) - b.getZ(i) - 0.018) < 1e-6);
  }
  assert(left.geometry.parameters.path && right.geometry.parameters.path);
  assert.equal(cilia.count, cutaway ? 15 : 36);
  for (const mesh of group.children) {
    for (const attribute of Object.values(mesh.geometry.attributes))
      assert(attribute.array.every(Number.isFinite));
    assert(
      mesh.geometry.index.array.every(
        (index) => index < mesh.geometry.attributes.position.count,
      ),
    );
  }
  const hair = cilia.geometry.attributes.position;
  // Consecutive tubular rings remain connected along the curved cilium.
  assert.equal(hair.count, 42);
  for (let ring = 1; ring <= 6; ring++)
    for (let vertex = 0; vertex < 6; vertex++) {
      const a = ring * 6 + vertex,
        b = a - 6;
      assert(
        Math.hypot(
          hair.getX(a) - hair.getX(b),
          hair.getY(a) - hair.getY(b),
          hair.getZ(a) - hair.getZ(b),
        ) < 0.05,
      );
    }

  let instance = 0;
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 12; i++) {
      const t = (i + 0.5) / 12,
        u = -0.72 + row * 0.32,
        offset = instance * 16;
      if (cutaway && t > 0.25 && t < 0.875) continue;
      instance++;
      const x = cilia.instanceMatrix.array[offset + 12],
        y = cilia.instanceMatrix.array[offset + 13],
        z = cilia.instanceMatrix.array[offset + 14];
      assert(
        Math.abs(x - (0.72 - 0.22 * t + u * 0.19 * (1 - 0.66 * t))) < 1e-6,
      );
      assert(Math.abs(y - (0.48 - 0.83 * t)) < 1e-6);
      assert(
        Math.abs(z - (0.53 + 0.115 * u * u)) < 1e-6,
        "cilia attach continuously to concave wall",
      );
    }
}
function completeResources(model) {
  const result = resourceInventory(model),
    materials = new Set(model.materials ?? []);
  model.group.traverse((o) => {
    for (const material of Array.isArray(o.material)
      ? o.material
      : [o.material])
      if (material) materials.add(material);
    if (o.geometry?.index)
      result.push(o.geometry.index.array, o.geometry.index.array.buffer);
  });
  // Existing models swap preallocated, returned materials. Inventory the owning
  // universe rather than incorrectly requiring each node's active slot to stay fixed.
  result.push(...[...materials].sort((a, b) => a.uuid.localeCompare(b.uuid)));
  return result;
}

export async function runGeometryEquivalence() {
  const referenceBytes = await readFile(
      new URL("./geometry-reference.json", import.meta.url),
    ),
    reference = JSON.parse(referenceBytes),
    originals = await frozenDefinitions(reference, referenceBytes);
  assert.equal(reference.cases.length, 10);
  let states = 0;
  const coverage = {
    parameciumFeeding: 0,
    contractileVacuole: 0,
    parameciumDivision: 0,
    parameciumConjugation: 0,
  };
  for (const row of reference.cases) {
    const definition = (await import(`./${row.id}Process.js`)).default;
    const current = setupSnapshot(definition, row.transformed),
      original = setupSnapshot(originals.get(row.id), row.transformed),
      scenes = [original, current],
      inventories = scenes.map(({ model }) => completeResources(model));
    for (const { progress, sha256: historicalHash, ...counts } of row.states) {
      // Historical hashes remain evidence, not cross-platform expected values.
      // Feeding/CV retain full original output; explicit adapters retain exact
      // unchanged subtrees for the nuclear repair and oral-art delta.
      assert.match(historicalHash, /^[a-f\d]{64}$/);
      for (const { model } of scenes) model.update(progress, row.parameters);
      const expected = geometrySnapshot(original.model, original.parent);
      const { sha256: originalHash, ...originalCounts } = expected;
      assert.match(originalHash, /^[a-f\d]{64}$/);
      assert.deepEqual(originalCounts, counts, "frozen topology inventory");
      const currentExpected = geometrySnapshot(current.model, current.parent);
      if (row.id === "parameciumDivision") {
        assert.deepEqual(
          current.model.group.children.map((o) => o.name).sort(),
          [...unchangedDivisionRoots, ...changedDivisionRoots].sort(),
          "no unreviewed division subtree may bypass the original baseline",
        );
        for (const name of [
          "anterior-oral-apparatus",
          "posterior-oral-apparatus",
        ])
          oralInvariant(current.model.group.getObjectByName(name));
        assert.deepEqual(
          unchangedDivisionSnapshot(current),
          unchangedDivisionSnapshot(original),
        );
        assert.deepEqual(
          current.model.labels.slice(2),
          original.model.labels.slice(2),
        );
        assert.deepEqual(
          current.model.group.userData,
          original.model.group.userData,
        );
        assert.deepEqual(current.model.camera, original.model.camera);
      } else if (row.id === "parameciumConjugation") {
        conjugationNonoral(current, original);
      } else {
        assert.deepEqual(
          currentExpected,
          expected,
          `${row.id} ${progress} same-runtime full frozen output`,
        );
      }
      scenes.forEach(({ model, parent }, sceneIndex) => {
        const expectedScene = sceneIndex === 0 ? expected : currentExpected;
        model.update(progress, row.parameters);
        assert.deepEqual(
          geometrySnapshot(model, parent),
          expectedScene,
          "paused pose",
        );
        model.update(0.97831, row.parameters);
        model.update(0.03197, row.parameters);
        model.update(progress, row.parameters);
        assert.deepEqual(
          geometrySnapshot(model, parent),
          expectedScene,
          "reverse seek",
        );
        const resources = inventories[sceneIndex],
          currentResources = completeResources(model);
        assert.equal(currentResources.length, resources.length);
        currentResources.forEach((value, i) =>
          assert.equal(
            value,
            resources[i],
            "update must preserve resource identity",
          ),
        );
      });
      assert(Object.hasOwn(coverage, row.id));
      coverage[row.id]++;
      states++;
    }
    for (const { model } of scenes) disposeSnapshot(model);
  }
  assert.equal(states, 196);
  assert.deepEqual(coverage, {
    parameciumFeeding: 34,
    contractileVacuole: 72,
    parameciumDivision: 28,
    parameciumConjugation: 62,
  });

  const conjugation = (
    await import("./parameciumConjugationProcess.js")
  ).default.create();
  const lineage = [];
  conjugation.group.traverse((object) => {
    if (object.name.includes("-leaf-")) lineage.push(object.geometry);
  });
  assert.equal(lineage.length, 32);
  const versions = () =>
    lineage.flatMap((geometry) => [
      geometry.attributes.position.version,
      geometry.attributes.normal.version,
    ]);
  conjugation.update(0.2);
  const before = versions();
  conjugation.update(0.6);
  assert.deepEqual(versions(), before, "constant lineage must not be rebuilt");
  conjugation.update(0.792);
  assert.notDeepEqual(versions(), before, "fission must invalidate the cache");
  const split = versions();
  conjugation.update(0.792);
  assert.deepEqual(versions(), split, "paused fission must not be rebuilt");
  disposeSnapshot(conjugation);

  const cv = (await import("./contractileVacuoleProcess.js")).default.create();
  const bladder = cv.group.getObjectByName("central-contractile-bladder");
  cv.update(0.1);
  const connected = bladder.geometry.attributes.position.version;
  cv.update(0.4);
  assert.equal(bladder.geometry.attributes.position.version, connected);
  cv.update(0.55);
  assert(bladder.geometry.attributes.position.version > connected);
  disposeSnapshot(cv);

  // Angle is part of the public inlet shape API, even though process arms use
  // fixed angles. Verify angle-only, radius-only and depth-only invalidation.
  const kit = sceneKit(),
    inlet = hollowInlet(kit, kit.group, kit.material("#ffffff"), "inlet-cache");
  const inletMesh = inlet.group.children[0];
  let previousVersion = 0;
  for (const input of [
    [0.7, 0.6, 0],
    [0.7, 0.6, 1],
    [0.8, 0.6, 1],
    [0.8, 0.5, 1],
  ]) {
    inlet.update(...input);
    assert(inletMesh.geometry.attributes.position.version > previousVersion);
    previousVersion = inletMesh.geometry.attributes.position.version;
    inlet.update(...input);
    assert.equal(
      inletMesh.geometry.attributes.position.version,
      previousVersion,
    );
  }
  disposeSnapshot({ group: kit.group });
  console.log(
    `paramecium geometry equivalence PASS: ${states} same-runtime states; feeding/CV fully frozen, conjugation nonoral and division unchanged roots exact; oral invariants at every pose, whole-scene pause/reverse/resource identity and complete shape cache invalidation`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runGeometryEquivalence();
