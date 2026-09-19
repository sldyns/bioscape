// Run independently: node src/processes/modules/division/division.smoke.mjs
import * as THREE from "three";
import { build } from "esbuild";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import mitosis from "./mitosisProcess.js";
import meiosis from "./meiosisProcess.js";

function snapshot(model) {
  model.group.updateMatrixWorld(true);
  const nodes = [];
  model.group.traverse((object) =>
    nodes.push([
      object.uuid,
      object.visible,
      object.matrixWorld.elements,
      object.material?.uuid,
      object.material?.opacity,
      object.isInstancedMesh ? Array.from(object.instanceMatrix.array) : null,
      object.geometry?.attributes.position
        ? Array.from(object.geometry.attributes.position.array)
        : null,
    ]),
  );
  return JSON.stringify([nodes, model.labels, model.group.userData]);
}
for (const definition of [mitosis, meiosis]) {
  assert.equal(definition.stages[0].at, 0);
  assert(definition.stages.length >= 4 && definition.stages.length <= 7);
  for (const stage of definition.stages) {
    for (const language of ["zh", "en"]) {
      assert(stage.title[language]);
      assert(stage.description[language]);
    }
  }
  assert(
    existsSync(
      new URL(
        `../../../../public/process-thumbnails/${definition.id}.svg`,
        import.meta.url,
      ),
    ),
  );
  const model = definition.create();
  const identities = new Set();
  const inventory = new Set(model.materials);
  const structuralNames = new Set();
  let count = 0;
  model.group.traverse((object) => {
    count++;
    if (object.geometry) identities.add(object.geometry.uuid);
    if (object.material) {
      identities.add(object.material.uuid);
      assert(
        inventory.has(object.material),
        `missing inventory: ${object.name}`,
      );
    }
    structuralNames.add(object.name);
  });
  assert(structuralNames.has("condensed-chromatin-chromatid"));
  assert(structuralNames.has("layered-kinetochore"));
  assert(structuralNames.has("nine-centriole-triplets"));
  assert(structuralNames.has("kinetochore-microtubule-bundle"));
  assert(structuralNames.has("nuclear-envelope-paired-membranes-cutaway"));
  const states = new Set();
  for (const progress of [
    NaN,
    0,
    0.12,
    0.24,
    0.38,
    0.51,
    0.62,
    0.74,
    0.86,
    0.95,
    1,
  ]) {
    model.update(progress);
    model.group.updateMatrixWorld(true);
    let currentCount = 0;
    model.group.traverse((object) => {
      currentCount++;
      assert(object.matrixWorld.elements.every(Number.isFinite));
      if (object.geometry) {
        assert(identities.has(object.geometry.uuid));
        assert(
          Array.from(object.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
        );
      }
      if (object.material) assert(identities.has(object.material.uuid));
      if (object.isInstancedMesh) {
        assert(Array.from(object.instanceMatrix.array).every(Number.isFinite));
        assert(object.boundingBox && object.boundingSphere);
        assert(Number.isFinite(object.boundingSphere.radius));
      }
      if (object.geometry?.attributes.normal)
        assert(
          Array.from(object.geometry.attributes.normal.array).every(
            Number.isFinite,
          ),
        );
    });
    assert.equal(currentCount, count);
    const size = new THREE.Box3()
      .setFromObject(model.group)
      .getSize(new THREE.Vector3());
    assert(
      Math.max(size.x, size.y, size.z) > 2 &&
        Math.max(size.x, size.y, size.z) < 20,
    );
    states.add(JSON.stringify(model.group.userData));
  }
  assert(states.size > 4);
  model.update(0.7);
  const expected = snapshot(model);
  model.update(0.2);
  model.update(0.7);
  assert.equal(snapshot(model), expected);
  for (const progress of [
    0, 0.15, 0.27, 0.43, 0.54, 0.56, 0.58, 0.7, 0.82, 0.93, 0.94, 0.97, 1,
  ]) {
    model.update(progress);
    const before = snapshot(model);
    model.update(1);
    model.update(0);
    model.update(progress);
    assert.equal(
      snapshot(model),
      before,
      `repeat seek ${definition.id} at ${progress}`,
    );
  }
  if (definition.id === "mitosis") {
    model.update(1, { attachment: "unattached" });
    assert(model.group.userData.checkpointArrest);
    assert.equal(model.group.userData.sisterSeparation, 0);
    assert.equal(model.group.userData.cytokinesisComplete, false);
    const arrested = snapshot(model);
    model.update(0.1);
    model.update(1, { attachment: "unattached" });
    assert.equal(snapshot(model), arrested);
    model.update(1);
    assert.equal(model.group.userData.daughterCount, 2);
  } else {
    model.update(0.58);
    assert.equal(model.group.userData.products, 2);
    assert.equal(model.group.userData.sisterSeparation, 0);
    model.update(1);
    assert.equal(model.group.userData.products, 4);
    assert(model.group.userData.cytoplasmicBridgesRetained);
    assert.equal(model.group.userData.dnaReplicationBetweenDivisions, false);
  }
  await build({
    entryPoints: [
      new URL(`./${definition.id}Process.js`, import.meta.url).pathname,
    ],
    bundle: true,
    write: false,
    platform: "browser",
    format: "esm",
    logLevel: "silent",
  });
  console.log(
    `${definition.id}: bilingual stages, finite bounds, stable resources, deterministic seeks, biological state and esbuild passed (${count} nodes).`,
  );
}
