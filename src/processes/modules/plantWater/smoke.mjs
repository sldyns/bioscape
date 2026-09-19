import assert from "node:assert/strict";
import fs from "node:fs";
import * as THREE from "three";
import plasmolysis from "./plasmolysisProcess.js";
import stomata from "./stomataProcess.js";
import xylem from "./plantLongDistanceTransportProcess.js";
import chloroplast from "./chloroplastMovementProcess.js";
function signature(model) {
  model.group.updateMatrixWorld(true);
  const r = [];
  model.group.traverse((n) => {
    r.push(n.uuid, n.visible, ...n.matrix.elements);
    if (n.geometry) {
      const a = n.geometry.attributes.position.array;
      r.push(
        Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString("base64"),
      );
    }
    if (n.instanceMatrix) {
      const a = n.instanceMatrix.array;
      r.push(
        Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString("base64"),
      );
    }
  });
  return JSON.stringify(r);
}
for (const process of [plasmolysis, stomata, xylem, chloroplast]) {
  assert.equal(process.stages[0].at, 0);
  assert(process.stages.at(-1).at < 1);
  for (const stage of process.stages) {
    assert(
      stage.title.zh &&
        stage.title.en &&
        stage.description.zh &&
        stage.description.en,
    );
  }
  assert(fs.existsSync(`public/process-thumbnails/${process.id}.svg`));
  const model = process.create();
  const identities = [];
  model.group.traverse((n) => identities.push([n, n.geometry, n.material]));
  for (const option of process.controls[0].options) {
    const params = { [process.controls[0].id]: option.value };
    const samples = [];
    for (const p of [0, 0.15, 0.35, 0.5, 0.7, 0.95, 1, NaN, -1, 2]) {
      model.update(p, params);
      const bounds = new THREE.Box3().setFromObject(model.group);
      const size = bounds.getSize(new THREE.Vector3());
      assert([size.x, size.y, size.z].every(Number.isFinite));
      assert(
        Math.max(size.x, size.y, size.z) > 2 &&
          Math.max(size.x, size.y, size.z) < 20,
      );
      model.group.traverse((n) => {
        if (n.geometry)
          for (const a of Object.values(n.geometry.attributes))
            assert([...a.array].every(Number.isFinite));
        if (n.instanceMatrix)
          assert([...n.instanceMatrix.array].every(Number.isFinite));
      });
      if (Number.isFinite(p)) samples.push(signature(model));
    }
    assert(new Set(samples).size > 4);
    model.update(0.7, params);
    const a = signature(model);
    model.update(0.2, params);
    model.update(0.7, params);
    assert.equal(signature(model), a);
    for (const [n, g, m] of identities) {
      assert.equal(n.geometry, g);
      assert.equal(n.material, m);
    }
    let nodes = 0;
    model.group.traverse(() => nodes++);
    assert.equal(nodes, identities.length);
  }
  console.log(
    process.id,
    "PASS: bilingual stages, finite bounds, stage variation, deterministic seeks, stable scene and geometry identities",
  );
}
const p = plasmolysis.create();
p.update(0.5);
assert(p.group.userData.protoplastVolumeRelative < 0.6);
assert(p.group.userData.membraneIntact);
p.update(1, { bath: "recover" });
assert.equal(p.group.userData.protoplastVolumeRelative, 1);
p.update(1, { bath: "hold" });
assert(p.group.userData.plasmolysed);
const s = stomata.create();
s.update(0.5);
const open = s.group.userData.poreWidth;
s.update(1, { signal: "aba" });
assert(s.group.userData.poreWidth < open);
s.update(1, { signal: "light" });
assert.equal(s.group.userData.poreWidth, open);
console.log("Branch mechanisms PASS");

const x = xylem.create();
x.update(1, { stomata: "open" });
const flow = x.group.userData.relativeFlow;
x.update(1, { stomata: "close" });
assert(x.group.userData.relativeFlow < flow);
assert(x.group.userData.continuousWaterColumn);
const c = chloroplast.create();
c.update(1, { genotype: "wild" });
assert.equal(c.group.userData.avoidanceFraction, 1);
c.update(1, { genotype: "phot2" });
assert.equal(c.group.userData.avoidanceFraction, 0);
console.log("Second pair branch mechanisms PASS");
