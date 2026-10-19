import assert from "node:assert/strict";
import * as THREE from "three";

// Inspect actual instance geometry, without repeating the animation formulas.
export function assertAuxinBaseContinuity(model) {
  const pairs = [0, 1].map((strand) => ({
    bases: model.group.getObjectByName(`auxin-DNA-${strand}-bases`),
    phosphates: model.group.getObjectByName(`auxin-DNA-${strand}-phosphates`),
  }));
  for (const { bases, phosphates } of pairs) {
    assert(bases?.isInstancedMesh && phosphates?.isInstancedMesh);
    assert.equal(bases.count, 52);
    assert.equal(phosphates.count, 52);
    assert.equal(bases.geometry.parameters.height, 1);
  }
  const matrix = new THREE.Matrix4(),
    combined = new THREE.Matrix4(),
    point = new THREE.Vector3(),
    anchor = new THREE.Vector3();
  const result = {
    states: 0,
    maxAttachmentError: 0,
    maxStep: 0,
    maxBoundaryStep: 0,
  };
  const read = (mesh, index, target, y = 0) => {
    mesh.getMatrixAt(index, matrix);
    combined.multiplyMatrices(mesh.matrixWorld, matrix);
    return target.set(0, y, 0).applyMatrix4(combined);
  };
  const sample = (progress, condition) => {
    model.update(progress, { auxin: condition });
    model.group.updateMatrixWorld(true);
    const values = [];
    for (const { bases, phosphates } of pairs)
      for (let i = 0; i < bases.count; i++) {
        read(bases, i, point, -0.5);
        read(phosphates, i, anchor);
        const error = point.distanceTo(anchor);
        assert(
          error < 1e-6,
          "Auxin base must remain attached to its phosphate",
        );
        result.maxAttachmentError = Math.max(result.maxAttachmentError, error);
        values.push(point.x, point.y, point.z);
        read(bases, i, point, 0.5);
        values.push(point.x, point.y, point.z);
      }
    result.states++;
    return values;
  };
  const difference = (a, b) => {
    let max = 0;
    for (let i = 0; i < a.length; i += 3)
      max = Math.max(
        max,
        Math.hypot(a[i] - b[i], a[i + 1] - b[i + 1], a[i + 2] - b[i + 2]),
      );
    return max;
  };
  for (const condition of ["present", "low"]) {
    const initial = sample(0, condition);
    let previous = initial;
    // A dense independent sweep catches moving-window discontinuities too.
    for (let i = 1; i <= 2048; i++) {
      const next = sample(i / 2048, condition),
        delta = difference(previous, next);
      assert(
        delta < 0.015,
        `${condition}: finite DNA-base jump at ${i / 2048}`,
      );
      if (condition === "low") assert.equal(delta, 0);
      result.maxStep = Math.max(result.maxStep, delta);
      previous = next;
    }
    if (condition === "present")
      assert(
        difference(initial, previous) > 0.05,
        "Transcription bubble must still move and open",
      );
    for (const progress of [0.695, 0.71, 0.748, 0.88]) {
      const left = sample(progress - 1e-8, condition),
        right = sample(progress + 1e-8, condition),
        delta = difference(left, right);
      assert(
        delta < 1e-5,
        `${condition}: DNA-base event discontinuity at ${progress}`,
      );
      result.maxBoundaryStep = Math.max(result.maxBoundaryStep, delta);
      assert.deepEqual(
        sample(progress - 1e-8, condition),
        left,
        "Backward seek must restore exact endpoints",
      );
    }
  }
  return result;
}
