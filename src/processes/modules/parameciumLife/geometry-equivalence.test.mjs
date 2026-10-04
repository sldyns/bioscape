import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import {
  geometrySnapshot,
  setupSnapshot,
  resourceInventory,
  disposeSnapshot,
} from "./geometrySnapshot.test-support.mjs";
import { sceneKit } from "../../kit.js";
import { hollowInlet } from "./scientificGeometry.js";

export async function runGeometryEquivalence() {
  const reference = JSON.parse(
    await readFile(
      new URL("./geometry-reference.json", import.meta.url),
      "utf8",
    ),
  );
  let states = 0;
  for (const row of reference.cases) {
    const definition = (await import(`./${row.id}Process.js`)).default;
    const { model, parent } = setupSnapshot(definition, row.transformed);
    const resources = resourceInventory(model);
    for (const { progress, ...expected } of row.states) {
      model.update(progress, row.parameters);
      assert.deepEqual(
        geometrySnapshot(model, parent),
        expected,
        `${row.id} ${progress} full frozen output`,
      );
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
      const current = resourceInventory(model);
      assert.equal(current.length, resources.length);
      current.forEach((value, i) =>
        assert.equal(
          value,
          resources[i],
          "update must preserve resource identity",
        ),
      );
      states++;
    }
    disposeSnapshot(model);
  }

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
    `paramecium geometry equivalence PASS: ${states} frozen states, pause/reverse seeks, complete shape cache invalidation`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await runGeometryEquivalence();
