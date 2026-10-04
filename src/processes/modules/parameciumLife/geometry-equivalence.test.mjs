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

export async function runGeometryEquivalence() {
  const referenceBytes = await readFile(
      new URL("./geometry-reference.json", import.meta.url),
    ),
    reference = JSON.parse(referenceBytes),
    originals = await frozenDefinitions(reference, referenceBytes);
  assert.equal(reference.cases.length, 10);
  let states = 0;
  for (const row of reference.cases) {
    const definition = (await import(`./${row.id}Process.js`)).default;
    const current = setupSnapshot(definition, row.transformed),
      original = setupSnapshot(originals.get(row.id), row.transformed),
      scenes = [original, current],
      inventories = scenes.map(({ model }) => resourceInventory(model));
    for (const { progress, sha256: historicalHash, ...counts } of row.states) {
      // Historical hashes remain evidence, not cross-platform expected values.
      // Compare every existing numeric/binary field against the original code
      // executing now; no tolerances, rounding, field omissions or bypasses.
      assert.match(historicalHash, /^[a-f\d]{64}$/);
      for (const { model } of scenes) model.update(progress, row.parameters);
      const expected = geometrySnapshot(original.model, original.parent);
      const { sha256: originalHash, ...originalCounts } = expected;
      assert.match(originalHash, /^[a-f\d]{64}$/);
      assert.deepEqual(originalCounts, counts, "frozen topology inventory");
      assert.deepEqual(
        geometrySnapshot(current.model, current.parent),
        expected,
        `${row.id} ${progress} same-runtime full frozen output`,
      );
      scenes.forEach(({ model, parent }, sceneIndex) => {
        model.update(progress, row.parameters);
        assert.deepEqual(
          geometrySnapshot(model, parent),
          expected,
          "paused pose",
        );
        model.update(0.97831, row.parameters);
        model.update(0.03197, row.parameters);
        model.update(progress, row.parameters);
        assert.deepEqual(
          geometrySnapshot(model, parent),
          expected,
          "reverse seek",
        );
        const resources = inventories[sceneIndex],
          currentResources = resourceInventory(model);
        assert.equal(currentResources.length, resources.length);
        currentResources.forEach((value, i) =>
          assert.equal(
            value,
            resources[i],
            "update must preserve resource identity",
          ),
        );
      });
      states++;
    }
    for (const { model } of scenes) disposeSnapshot(model);
  }
  assert.equal(states, 196);

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
    `paramecium geometry equivalence PASS: ${states} strict same-runtime frozen states, pause/reverse seeks, complete shape cache invalidation`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runGeometryEquivalence();
