import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import access from "./chromatinAccessProcess.js";
import tad from "./tadProcess.js";
import genome from "./plantGenomeProcess.js";
import rddm from "./plantRdDMProcess.js";
function state(m) {
  const h = createHash("sha256");
  m.group.updateMatrixWorld(true);
  m.group.traverse((o) => {
    h.update(
      JSON.stringify([
        o.uuid,
        o.visible,
        o.matrix.elements,
        o.geometry?.drawRange,
      ]),
    );
    if (o.geometry)
      for (const a of Object.values(o.geometry.attributes)) {
        assert.ok(a.array.every(Number.isFinite));
        h.update(Buffer.from(a.array.buffer));
      }
    if (o.instanceMatrix) {
      assert.ok(o.instanceMatrix.array.every(Number.isFinite));
      h.update(Buffer.from(o.instanceMatrix.array.buffer));
      assert.ok(o.boundingSphere && Number.isFinite(o.boundingSphere.radius));
    }
  });
  h.update(JSON.stringify(m.group.userData));
  return h.digest("hex");
}
for (const d of [access, tad, genome, rddm])
  for (const option of d.controls[0].options) {
    const m = d.create({ rootId: d === tad ? "cell" : "plant" }),
      parameters = { [d.controls[0].id]: option.value },
      resources = [];
    let instances = 0;
    m.group.traverse((o) => {
      resources.push([o, o.geometry, o.material]);
      if (o.isInstancedMesh) instances++;
    });
    assert.ok(instances >= 4, `${d.id} structural detail is instanced`);
    for (const p of [0, 0.17, 0.34, 0.49, 0.65, 0.83, 0.97, 1, NaN]) {
      m.update(p, parameters);
      state(m);
      const size = new THREE.Box3()
        .setFromObject(m.group)
        .getSize(new THREE.Vector3());
      assert.ok(size.toArray().every(Number.isFinite));
      assert.ok(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
    }
    m.update(0.83, parameters);
    const expected = state(m);
    m.update(0.1, parameters);
    m.update(0.83, parameters);
    assert.equal(state(m), expected);
    const final = [];
    m.group.traverse((o) => final.push([o, o.geometry, o.material]));
    assert.deepEqual(final, resources);
    console.log(
      `${d.id}/${option.value}: ${instances} instance batches, buffers/normals/matrices/bounds/seeks/resources pass`,
    );
  }
const model = rddm.create();
model.update(0.88);
assert.ok(model.group.userData.targetBaseFlip > 0.8);
model.update(1);
assert.equal(model.group.userData.targetBaseFlip, 0);
model.update(0.88, { drm2: "inactive" });
assert.equal(model.group.userData.newMethylMarks, 0);
assert.ok(model.group.userData.targetBaseFlip > 0.8);
