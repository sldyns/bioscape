import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { build } from "esbuild";
import { entries } from "./entries.js";
const hash = (a) =>
  createHash("sha256")
    .update(new Uint8Array(a.buffer, a.byteOffset, a.byteLength))
    .digest("hex");
function capture(scene) {
  const nodes = [],
    geometries = new Map(),
    materials = new Map();
  scene.group.traverse((o) => {
    nodes.push([
      o.uuid,
      o.visible,
      o.position.toArray(),
      o.quaternion.toArray(),
      o.scale.toArray(),
      o.geometry?.uuid,
      o.material?.uuid,
      o.instanceMatrix ? hash(o.instanceMatrix.array) : null,
    ]);
    if (o.geometry && !geometries.has(o.geometry.uuid))
      geometries.set(
        o.geometry.uuid,
        Object.entries(o.geometry.attributes).map(([name, a]) => [
          name,
          hash(a.array),
        ]),
      );
    if (o.material && !materials.has(o.material.uuid))
      materials.set(o.material.uuid, [
        o.material.color?.getHex(),
        o.material.opacity,
      ]);
  });
  return JSON.stringify([
    nodes,
    [...geometries],
    [...materials],
    scene.group.userData,
    scene.labels,
  ]);
}
function inventory(scene) {
  const ids = [];
  scene.group.traverse((o) =>
    ids.push([o.uuid, o.geometry?.uuid, o.material?.uuid]),
  );
  return JSON.stringify(ids);
}
for (const entry of entries) {
  const model = (await import(`./${entry.id}Process.js`)).default,
    scene = model.create();
  const original = inventory(scene);
  let instances = 0,
    nodes = 0;
  scene.group.traverse((o) => {
    nodes++;
    if (o.isInstancedMesh) instances += o.count;
  });
  for (const opt of model.controls[0].options) {
    const parameters = { [model.controls[0].id]: opt.value },
      states = new Set();
    for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1, NaN, -2, 2]) {
      scene.update(p, parameters);
      scene.group.updateMatrixWorld(true);
      const size = new THREE.Box3()
        .setFromObject(scene.group)
        .getSize(new THREE.Vector3());
      assert(size.toArray().every(Number.isFinite));
      assert(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
      const checked = new Set();
      scene.group.traverse((o) => {
        assert(
          [...o.position, ...o.scale, ...o.quaternion].every(Number.isFinite),
        );
        if (o.geometry && !checked.has(o.geometry)) {
          checked.add(o.geometry);
          for (const attr of Object.values(o.geometry.attributes))
            assert(attr.array.every(Number.isFinite));
        }
        if (o.isInstancedMesh)
          assert(o.instanceMatrix.array.every(Number.isFinite));
      });
      assert.equal(inventory(scene), original);
      states.add(capture(scene));
    }
    assert(states.size >= (opt.value === model.controls[0].default ? 5 : 2));
    scene.update(0.7, parameters);
    const a = capture(scene);
    scene.update(0, parameters);
    scene.update(0.2, parameters);
    scene.update(0.7, parameters);
    assert.equal(capture(scene), a);
    scene.update(1, parameters);
    if (entry.id === "photorespiration") {
      assert.equal(
        scene.group.userData.carbonReleased +
          scene.group.userData.carbonRetained,
        4,
      );
      assert.equal(
        scene.group.userData.carbonReturnedToCalvin,
        opt.value === "active" ? 3 : 0,
      );
    }
    if (entry.id === "plantTransport")
      assert.equal(
        scene.group.userData.transportedSucrose,
        opt.value === "available" ? 1 : 0,
      );
    if (entry.id === "plasmodesmata")
      assert.equal(
        scene.group.userData.smallSoluteCompleted,
        opt.value === "open" ? 4 : 1,
      );
    if (entry.id === "c4cam")
      assert.equal(scene.group.userData.vacuolarStorage, 0);
  }
  await build({
    entryPoints: [new URL(`./${entry.id}Process.js`, import.meta.url).pathname],
    bundle: true,
    write: false,
    platform: "browser",
    format: "esm",
    logLevel: "silent",
  });
  console.log(
    `PASS ${entry.id}: ${nodes} nodes, ${instances} structural instances; finite buffers/bounds, distinct stages, both controls, deterministic seeks, stable geometry/material/node identities, esbuild`,
  );
}
