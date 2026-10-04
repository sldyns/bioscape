import assert from "node:assert/strict";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import signal from "./signalTransductionProcess.js";
import apoptosis from "./apoptosisProcess.js";
import differentiation from "./differentiationProcess.js";
import immune from "./immuneResponseProcess.js";

// Test actual named-structure solids as well as the transform relationship.
// This rejects the old floating label endpoints even if label text is correct.
const trees = new WeakMap();
let checked = 0;
for (const spec of [signal, apoptosis, differentiation, immune]) {
  const model = spec.create();
  const control = spec.controls[0];
  for (const option of control.options) {
    for (const p of [
      0, 0.16, 0.23, 0.36, 0.46, 0.56, 0.65, 0.76, 0.85, 0.94, 1, 0.82, 0.44, 0,
    ]) {
      model.update(p, { [control.id]: option.value });
      model.group.updateMatrixWorld(true);
      for (const binding of model.science.labelAnchors) {
        const { label, target, local = [0, 0, 0], region } = binding;
        const actual = new THREE.Vector3().fromArray(label.position);
        const expected = new THREE.Vector3()
          .fromArray(local)
          .applyMatrix4(target.matrixWorld);
        assert(
          actual.distanceTo(expected) < 1e-8,
          `${spec.id}: label endpoint follows actual target transform`,
        );
        if (label.active === false) continue;
        for (let ancestor = target; ancestor; ancestor = ancestor.parent)
          assert(
            ancestor.visible,
            `${spec.id}: active callout cannot point to hidden target`,
          );
        if (!region) {
          assert(
            target.isMesh,
            `${spec.id}: named target must be an actual mesh`,
          );
          if (!trees.has(target.geometry))
            trees.set(target.geometry, new MeshBVH(target.geometry.clone()));
          const ray = new THREE.Ray(
            new THREE.Vector3().fromArray(local),
            new THREE.Vector3(1, 0.273, 0.129).normalize(),
          );
          const distances = trees
            .get(target.geometry)
            .raycast(ray, THREE.DoubleSide)
            .map((hit) => hit.distance)
            .sort((a, b) => a - b);
          const unique = distances.filter(
            (distance, i) => !i || distance - distances[i - 1] > 1e-6,
          );
          assert(
            unique.length % 2 === 1,
            `${spec.id}: named callout endpoint is inside the target mesh`,
          );
        }
        checked++;
      }
      if (spec === differentiation && model.labels[5].active)
        assert(
          Math.abs(model.science.plasma.field(...model.labels[5].position)) <
            2e-6,
          "constriction callout meets the actual membrane field",
        );
      if (spec === immune) {
        const [x, y] = model.labels[2].position;
        assert(
          ((x + 2.1) / 1.2) ** 2 + ((y - 0.8) / 0.51) ** 2 < 1,
          "ER-lumen endpoint is inside ER",
        );
      }
    }
  }
}
console.log(
  `signals-labels: ${checked} active endpoint checks across four models, all nine conditions and reverse seeks PASS`,
);
