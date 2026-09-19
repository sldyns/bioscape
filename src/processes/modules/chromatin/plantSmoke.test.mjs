import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import * as THREE from "three";
import genome from "./plantGenomeProcess.js";
import rddm from "./plantRdDMProcess.js";
function snapshot(m) {
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
      h.update(Buffer.from(o.geometry.attributes.position.array.buffer));
  });
  h.update(JSON.stringify(m.group.userData));
  h.update(JSON.stringify(m.labels));
  return h.digest("hex");
}
for (const definition of [genome, rddm]) {
  for (const text of [
    definition.title,
    definition.intro,
    ...definition.stages.flatMap((s) => [s.title, s.description]),
  ])
    assert.ok(text.zh && text.en);
  assert.equal(definition.stages[0].at, 0);
  assert.ok(definition.stages.at(-1).at < 1);
  assert.ok(existsSync(`public/process-thumbnails/${definition.id}.svg`));
  const c = definition.controls[0];
  for (const o of c.options) {
    const m = definition.create({ rootId: "plant" }),
      params = { [c.id]: o.value },
      resources = [];
    m.group.traverse((o) => resources.push([o, o.geometry, o.material]));
    const states = [];
    for (const p of [0, 0.15, 0.35, 0.5, 0.7, 0.85, 1, NaN, -1, 2]) {
      m.update(p, params);
      m.group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(m.group);
      const size = box.getSize(new THREE.Vector3());
      assert.ok(size.toArray().every(Number.isFinite));
      assert.ok(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
      m.group.traverse((o) => {
        assert.ok(o.matrix.elements.every(Number.isFinite));
        if (o.geometry)
          for (const attr of Object.values(o.geometry.attributes))
            assert.ok(attr.array.every(Number.isFinite));
      });
      states.push(snapshot(m));
    }
    assert.notEqual(states[0], states[4]);
    m.update(0.7, params);
    const s = snapshot(m);
    m.update(0.2, params);
    m.update(0.7, params);
    assert.equal(snapshot(m), s);
    m.update(NaN, params);
    const z = snapshot(m);
    m.update(0, params);
    assert.equal(snapshot(m), z);
    const final = [];
    m.group.traverse((o) => final.push([o, o.geometry, o.material]));
    assert.deepEqual(final, resources);
  }
}
const g = genome.create();
g.update(1);
assert.equal(g.group.userData.proteinImported, true);
g.update(1, { targeting: "removed" });
assert.equal(g.group.userData.proteinImported, false);
assert.equal(g.group.userData.organelleLocalProducts, true);
assert.equal(g.group.userData.nuclearRNAImportedIntoOrganelles, false);
const r = rddm.create();
r.update(1);
assert.equal(r.group.userData.newMethylMarks, 7);
r.update(1, { drm2: "inactive" });
assert.equal(r.group.userData.newMethylMarks, 0);
assert.equal(r.group.userData.scaffoldPaired, true);
assert.equal(r.group.userData.drm2Recruited, true);
assert.equal(r.group.userData.sequenceChanged, false);
assert.equal(r.group.userData.guideScaffoldOrientation, "antiparallel");
console.log(
  "Plant chromatin pair: 4 conditions, bilingual stages, finite geometry/normals/bounds, repeated seeks, stable resources and import/RdDM branch assertions passed.",
);
