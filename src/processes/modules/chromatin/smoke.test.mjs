import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import * as THREE from "three";
import access from "./chromatinAccessProcess.js";
import tad from "./tadProcess.js";

function signature(model) {
  const h = createHash("sha256");
  model.group.updateMatrixWorld(true);
  model.group.traverse((o) => {
    h.update(JSON.stringify([o.uuid, o.visible, o.matrix.elements]));
    if (o.geometry)
      h.update(Buffer.from(o.geometry.attributes.position.array.buffer));
  });
  h.update(JSON.stringify(model.group.userData));
  h.update(JSON.stringify(model.labels));
  return h.digest("hex");
}
for (const definition of [access, tad]) {
  assert.equal(definition.stages[0].at, 0);
  assert.ok(definition.stages.at(-1).at < 1);
  assert.ok(existsSync(`public/process-thumbnails/${definition.id}.svg`));
  for (const item of [
    definition.title,
    definition.intro,
    ...definition.stages.flatMap((s) => [s.title, s.description]),
  ])
    assert.ok(item.zh && item.en);
  const control = definition.controls[0];
  for (const rootId of definition === access
    ? ["cell", "plant", "yeast"]
    : ["cell"])
    for (const option of control.options) {
      const model = definition.create({ rootId }),
        parameters = { [control.id]: option.value };
      const initial = [];
      model.group.traverse((o) => initial.push([o, o.geometry, o.material]));
      const states = [];
      for (const p of [0, 0.2, 0.5, 0.7, 1, NaN, -1, 2]) {
        model.update(p, parameters);
        model.group.updateMatrixWorld(true);
        const size = new THREE.Box3()
          .setFromObject(model.group)
          .getSize(new THREE.Vector3());
        assert.ok(size.toArray().every(Number.isFinite));
        assert.ok(
          Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
        );
        model.group.traverse((o) => {
          assert.ok(o.matrix.elements.every(Number.isFinite));
          if (o.geometry)
            assert.ok(
              o.geometry.attributes.position.array.every(Number.isFinite),
            );
        });
        states.push(signature(model));
      }
      assert.notEqual(states[0], states[2]);
      model.update(0.7, parameters);
      const a = signature(model);
      model.update(0.2, parameters);
      model.update(0.7, parameters);
      assert.equal(signature(model), a);
      model.update(NaN, parameters);
      const bad = signature(model);
      model.update(0, parameters);
      assert.equal(signature(model), bad);
      const after = [];
      model.group.traverse((o) => after.push([o, o.geometry, o.material]));
      assert.deepEqual(after, initial);
    }
}
const accessModel = access.create();
accessModel.update(1);
assert.equal(accessModel.group.userData.siteAccessible, true);
assert.equal(accessModel.group.userData.factorBound, true);
accessModel.update(1, { hydrolysis: "disabled" });
assert.equal(accessModel.group.userData.siteAccessible, false);
assert.equal(accessModel.group.userData.nucleosomeDisplacement, 0);
const tadModel = tad.create();
tadModel.update(1);
assert.equal(tadModel.group.userData.boundaryCrossed, false);
const normalSpan = tadModel.group.userData.loopSpan;
tadModel.update(1, { condition: "boundaryDeleted" });
assert.equal(tadModel.group.userData.boundaryCrossed, true);
assert.ok(tadModel.group.userData.loopSpan > normalSpan);
tadModel.update(1, { condition: "cohesinDepleted" });
assert.equal(tadModel.group.userData.cohesinPresent, false);
assert.ok(tadModel.group.userData.loopSpan < normalSpan);
assert.equal(tadModel.group.userData.membraneBound, false);
console.log(
  "Chromatin pair: bilingual stages, 9 root/scenario combinations, finite bounds/buffers, seeks, stable resources and mechanism branches passed.",
);
