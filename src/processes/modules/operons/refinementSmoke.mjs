import assert from "node:assert/strict";
import * as THREE from "three";
import lac from "./lacOperonProcess.js";
import trp from "./trpOperonProcess.js";
import gal from "./yeastGalProcess.js";
import hog from "./yeastOsmoregulationProcess.js";
const snapshot = (scene) => {
  const result = [];
  scene.group.traverse((o) =>
    result.push([
      o.uuid,
      o.visible,
      o.position.toArray(),
      o.quaternion.toArray(),
      o.scale.toArray(),
      o.material?.uuid,
      o.geometry?.drawRange.count,
      o.count,
      o.instanceMatrix ? Array.from(o.instanceMatrix.array) : null,
    ]),
  );
  return JSON.stringify(result);
};
for (const model of [lac, trp, gal, hog]) {
  const scene = model.create();
  const baseline = [];
  scene.group.traverse((o) => baseline.push([o.uuid, o.geometry?.uuid]));
  const knownMaterials = new Set(scene.materials.map((m) => m.uuid));
  let instanceCount = 0;
  scene.group.traverse((o) => {
    if (o.isInstancedMesh) instanceCount++;
  });
  assert(instanceCount >= 8);
  for (const first of model.controls[0].options)
    for (const second of model.controls[1].options) {
      const params = {
        [model.controls[0].id]: first.value,
        [model.controls[1].id]: second.value,
      };
      for (const p of [0, 0.18, 0.37, 0.56, 0.73, 0.92, 1, NaN]) {
        scene.update(p, params);
        scene.group.updateMatrixWorld(true);
        const current = [];
        scene.group.traverse((o) => {
          current.push([o.uuid, o.geometry?.uuid]);
          if (o.material)
            assert(
              knownMaterials.has(o.material.uuid),
              `${model.id}: material omitted`,
            );
          if (o.instanceMatrix)
            assert(Array.from(o.instanceMatrix.array).every(Number.isFinite));
          if (o.geometry)
            assert(
              Array.from(o.geometry.attributes.position.array).every(
                Number.isFinite,
              ),
            );
        });
        assert.deepEqual(current, baseline);
        const box = new THREE.Box3().setFromObject(scene.group),
          size = box.getSize(new THREE.Vector3()).toArray();
        assert(size.every(Number.isFinite));
        assert(Math.max(...size) > 2 && Math.max(...size) < 20);
      }
      scene.update(0.73, params);
      const expected = snapshot(scene);
      scene.update(0.2, params);
      scene.update(0.92, params);
      scene.update(0, params);
      scene.update(0.73, params);
      assert.equal(
        snapshot(scene),
        expected,
        `${model.id}: instanced seeking differs`,
      );
    }
  console.log(
    `${model.id}: refined geometry PASS (${instanceCount} instanced meshes; full material inventory)`,
  );
}
