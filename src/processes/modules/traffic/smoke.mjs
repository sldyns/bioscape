import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import * as THREE from "three";
import endocytosis from "./endocytosisProcess.js";
import autophagy from "./autophagyProcess.js";
function snapshot(model) {
  const result = [];
  model.group.traverse((o) => {
    result.push(o.uuid, o.visible, ...o.position, ...o.scale, ...o.quaternion);
    if (o.geometry) result.push(...o.geometry.attributes.position.array);
    if (o.material) result.push(o.material.opacity, o.material.transparent);
    if (o.instanceMatrix) result.push(...o.instanceMatrix.array);
  });
  return result;
}
for (const process of [endocytosis, autophagy]) {
  assert.equal(process.stages[0].at, 0);
  assert(process.stages.at(-1).at < 1);
  for (const stage of process.stages)
    for (const name of ["title", "description"])
      for (const lang of ["zh", "en"]) assert(stage[name][lang]);
  assert(existsSync(`public/process-thumbnails/${process.id}.svg`));
  const model = process.create({ rootId: "cell" }),
    geometry = new Set(),
    material = new Set(),
    nodes = new Set();
  model.group.traverse((o) => {
    nodes.add(o.uuid);
    if (o.geometry) geometry.add(o.geometry.uuid);
    if (o.material) material.add(o.material.uuid);
  });
  const states = [];
  for (const p of [0, 0.17, 0.37, 0.5, 0.7, 0.84, 1, NaN, -1, 2]) {
    model.update(p);
    model.group.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model.group),
      size = box.getSize(new THREE.Vector3());
    assert([...size, ...box.min, ...box.max].every(Number.isFinite));
    assert(Math.max(...size) > 2 && Math.max(...size) < 20);
    model.group.traverse((o) => {
      assert(nodes.has(o.uuid));
      if (o.geometry) {
        assert(geometry.has(o.geometry.uuid));
        assert(
          [...o.geometry.attributes.position.array].every(Number.isFinite),
        );
      }
      if (o.material) assert(material.has(o.material.uuid));
      if (o.instanceMatrix) {
        assert(o.instanceMatrix.array.every(Number.isFinite));
        assert(o.boundingSphere && Number.isFinite(o.boundingSphere.radius));
      }
      if (o.geometry)
        for (const attribute of Object.values(o.geometry.attributes))
          assert(attribute.array.every(Number.isFinite));
    });
    states.push(JSON.stringify(model.group.userData));
  }
  assert(new Set(states).size > 5);
  model.update(0.7);
  const a = snapshot(model);
  model.update(0.2);
  model.update(0.7);
  assert.deepEqual(snapshot(model), a);
  if (process.id === "endocytosis") {
    model.update(0.3);
    assert(model.group.userData.pitConnectedToExterior);
    assert.equal(model.group.userData.clathrinCageVertices, 60);
    assert.equal(model.group.userData.clathrinCageEdges, 90);
    assert.equal(model.group.userData.lipidBilayerLeaflets, 2);
    assert.equal(model.group.userData.LDLMonolayer, true);
    model.update(0.6);
    assert(model.group.userData.coatRemoved);
    model.update(0.9);
    assert.equal(model.group.userData.cargoCompartment, "early endosome lumen");
  } else {
    model.update(0.5);
    assert.equal(model.group.userData.membraneCount, 2);
    assert.equal(model.group.userData.leafletCountPerMembrane, 2);
    assert.equal(model.group.userData.cargoBackboneReference, "1HTI");
    assert.equal(model.group.userData.lysosomalProteaseReference, "1LYA");
    model.update(0.7);
    assert(model.group.userData.outerMembraneFused);
    assert(model.group.userData.innerMembraneIntact);
    model.update(1);
    assert.equal(model.group.userData.membraneCount, 1);
  }
  let vertices = 0,
    instances = 0;
  model.group.traverse((o) => {
    vertices += o.geometry?.attributes.position.count ?? 0;
    instances += o.count ?? 0;
  });
  console.log({
    process: process.id,
    nodes: nodes.size,
    geometries: geometry.size,
    vertices,
    instances,
  });
  console.log(
    process.id,
    ": bilingual metadata, finite bounds, distinct state, stable resources and repeated seeks passed",
  );
}
