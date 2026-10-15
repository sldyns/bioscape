import assert from "node:assert/strict";
import test from "node:test";
import { Matrix4, Vector3 } from "three";
import actionPotential from "./actionPotentialProcess.js";
import muscle from "./muscleProcess.js";
import synapse from "./synapseProcess.js";
import ciliaryMotion from "./ciliaryMotionProcess.js";

test("updates preserve scientific state object identity", () => {
  for (const process of [actionPotential, muscle, synapse, ciliaryMotion]) {
    const scene = process.create();
    const state = scene.group.userData;
    for (const p of [0.7, 0.2, 0.7, NaN, 1]) {
      scene.update(p);
      assert.equal(scene.group.userData, state, process.id);
    }
  }
});

test("enlarged membrane leaves camera-facing channel halves exposed", () => {
  const scene = actionPotential.create();
  const detail = scene.group.getObjectByName(
    "stationary selected membrane region enlarged",
  );
  const lipids = detail.children[0];
  const matrix = new Matrix4(),
    position = new Vector3();
  let count = 0;
  lipids.traverse((mesh) => {
    if (!mesh.isInstancedMesh) return;
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      position.setFromMatrixPosition(matrix);
      assert.ok(position.z <= 1e-6);
      count++;
    }
  });
  assert.ok(count > 100);
});

test("SR cutaway exposes a continuous lumen with finite wall thickness", () => {
  const scene = muscle.create();
  const outer = scene.group.getObjectByName("SR cutaway outer membrane");
  const inner = scene.group.getObjectByName("SR exposed luminal membrane");
  assert.ok(outer && inner);
  assert.equal(outer.geometry.parameters.openEnded, true);
  assert.equal(inner.geometry.parameters.openEnded, true);
  assert.ok(
    outer.geometry.parameters.radiusTop > inner.geometry.parameters.radiusTop,
  );
  assert.equal(
    outer.geometry.parameters.height,
    inner.geometry.parameters.height,
  );
  assert.ok(outer.geometry.parameters.thetaLength < Math.PI * 2);
  assert.ok(scene.group.getObjectByName("SR open lumen rim"));
});
