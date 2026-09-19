import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as THREE from "three";
import division from "./plantDivisionProcess.js";
import growth from "./cellWallGrowthProcess.js";
import fertilization from "./doubleFertilizationProcess.js";
import hyphae from "./fungalHyphaeProcess.js";
const state = (group) => {
  const result = [];
  group.traverse((n) => {
    result.push([
      n.uuid,
      n.visible,
      ...n.position.toArray(),
      ...n.quaternion.toArray(),
      ...n.scale.toArray(),
    ]);
  });
  return JSON.stringify(result);
};
for (const model of [division, growth, fertilization, hyphae]) {
  assert.equal(model.stages[0].at, 0);
  assert(model.stages.length >= 4 && model.stages.length <= 7);
  for (const s of model.stages)
    for (const lang of ["zh", "en"]) {
      assert(s.title[lang]);
      assert(s.description[lang]);
    }
  assert(existsSync(`public/process-thumbnails/${model.id}.svg`));
  const view = model.create({ rootId: "plant" }),
    nodeIds = [],
    geometries = [],
    materials = [];
  view.group.traverse((n) => {
    nodeIds.push(n.uuid);
    if (n.geometry) geometries.push(n.geometry.uuid);
    if (n.material) materials.push(n.material.uuid);
  });
  const samples = [];
  for (const p of [0, 0.2, 0.5, 0.7, 1, NaN, -1, 2]) {
    view.update(p);
    view.group.updateMatrixWorld(true);
    view.group.traverse((n) => {
      if (n.geometry)
        for (const attr of Object.values(n.geometry.attributes))
          assert(
            Array.from(attr.array).every(Number.isFinite),
            `${model.id}: finite geometry attributes`,
          );
      if (n.isInstancedMesh)
        assert(
          Array.from(n.instanceMatrix.array).every(Number.isFinite),
          `${model.id}: finite instance matrices`,
        );
    });
    const box = new THREE.Box3().setFromObject(view.group),
      size = box.getSize(new THREE.Vector3());
    assert([...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite));
    assert(Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20);
    samples.push(state(view.group));
  }
  assert.notEqual(samples[0], samples[2]);
  view.update(0.7);
  const target = state(view.group);
  view.update(0.2);
  view.update(0.7);
  assert.equal(state(view.group), target);
  const nodesNow = [],
    geosNow = [],
    matsNow = [];
  view.group.traverse((n) => {
    nodesNow.push(n.uuid);
    if (n.geometry) geosNow.push(n.geometry.uuid);
    if (n.material) matsNow.push(n.material.uuid);
  });
  assert.deepEqual(nodesNow, nodeIds);
  assert.deepEqual(geosNow, geometries);
  assert.deepEqual(matsNow, materials);
  if (model.id === "plantDivision") {
    view.update(1);
    assert.equal(view.group.userData.plateConnectedToParentalWall, true);
    assert.equal(view.group.userData.hasCentrioles, false);
    assert.equal(view.group.userData.daughterNuclei, 2);
  } else if (model.id === "cellWallGrowth") {
    view.update(1, { extensibility: "restrained" });
    assert.equal(view.group.userData.longitudinalExtension, 0);
    const deposit = view.group.userData.celluloseDeposited;
    view.update(1);
    assert(view.group.userData.longitudinalExtension > 0);
    assert.equal(view.group.userData.celluloseDeposited, deposit);
  }
  if (model.id === "doubleFertilization") {
    view.update(1);
    assert.equal(view.group.userData.embryoPloidy, 2);
    assert.equal(view.group.userData.endospermPloidy, 3);
    view.update(0.6, { assignment: "frontEgg" });
    const normal = state(view.group);
    view.update(0.6, { assignment: "frontCentral" });
    assert.notEqual(state(view.group), normal);
  }
  if (model.id === "fungalHyphae") {
    view.update(1);
    const full = view.group.userData.extension;
    view.update(1, { delivery: "reduced" });
    assert(view.group.userData.extension < full);
    assert.equal(view.group.userData.septaHavePores, true);
  }
  console.log(
    model.id,
    "passed: bilingual stages, finite bounds, distinct state, stable geometry/material/node identities, deterministic seek, scientific conditions",
  );
}
