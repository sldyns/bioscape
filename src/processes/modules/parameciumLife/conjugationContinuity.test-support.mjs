import assert from "node:assert/strict";
import * as THREE from "three";
import {
  geometrySnapshot,
  setupSnapshot,
  disposeSnapshot,
} from "./geometrySnapshot.test-support.mjs";
import {
  assertMigrationSubtrees,
  runConjugationMigrationRegression,
} from "./conjugationMigration.test-support.mjs";

const find = (scene, name) => {
  const matches = [];
  scene.model.group.traverse((object) => {
    if (object.name === name) matches.push(object);
  });
  assert.equal(matches.length, 1, `exactly one reviewed object ${name}`);
  return matches[0];
};
const visible = (object) => {
  for (let node = object; node; node = node.parent)
    if (!node.visible) return false;
  return true;
};
const pose = (scene, progress) => {
  scene.model.update(progress);
  scene.parent.updateMatrixWorld(true);
};
const subtree = (scene, name) =>
  geometrySnapshot(
    { group: find(scene, name), labels: [], camera: scene.model.camera },
    scene.parent,
  );

// Expand actual rendered vertices, including every pore/histone instance.
// A separating plane for these vertices also separates their triangle faces.
function worldVertices(root) {
  const values = [],
    point = new THREE.Vector3(),
    instance = new THREE.Matrix4(),
    matrix = new THREE.Matrix4();
  root.traverse((object) => {
    if (!object.geometry || !visible(object)) return;
    const position = object.geometry.attributes.position,
      count = object.isInstancedMesh ? object.count : 1;
    for (let item = 0; item < count; item++) {
      if (object.isInstancedMesh) {
        object.getMatrixAt(item, instance);
        matrix.multiplyMatrices(object.matrixWorld, instance);
      } else matrix.copy(object.matrixWorld);
      for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i).applyMatrix4(matrix);
        values.push(point.x, point.y, point.z);
      }
    }
  });
  assert(values.length > 0, `${root.name} has visible surface vertices`);
  return new Float64Array(values);
}
function closeSurfaces(before, after, message) {
  assert.equal(after.length, before.length, `${message}: detail vertex count`);
  for (let i = 0; i < before.length; i += 3)
    assert(
      Math.hypot(
        before[i] - after[i],
        before[i + 1] - after[i + 1],
        before[i + 2] - after[i + 2],
      ) < 3e-6,
      message,
    );
}
function assertResidentAnchor(scene) {
  const resident = find(scene, "stationary-pronucleus-0"),
    label = scene.model.labels[3],
    actual = scene.model.group
      .worldToLocal(resident.getWorldPosition(new THREE.Vector3()))
      .toArray();
  assert.equal(label.anchorTarget, resident.name);
  assert.deepEqual(label.position, actual);
}
function assertHandoff(scene) {
  const ids = [0, 1];
  pose(scene, 0.445 - 1e-7);
  const before = ids.map((id) => {
    const retained = find(scene, `meiotic-nucleus-${id}-0`);
    assert(visible(retained));
    assert(!visible(find(scene, `stationary-pronucleus-${id}`)));
    return worldVertices(retained);
  });
  for (const progress of [0.445, 0.445 + 1e-7]) {
    pose(scene, progress);
    ids.forEach((id) => {
      const resident = find(scene, `stationary-pronucleus-${id}`);
      assert(visible(resident));
      assert(!visible(find(scene, `meiotic-nucleus-${id}-0`)));
      closeSurfaces(
        before[id],
        worldVertices(resident),
        `partner ${id} retained-to-resident surface handoff at ${progress}`,
      );
    });
    assertResidentAnchor(scene);
  }
}
function assertCompletedSeparation(scene) {
  for (const id of [0, 1]) {
    const resident = find(scene, `stationary-pronucleus-${id}`),
      migrant = find(scene, `migratory-pronucleus-${id}`);
    assert(resident.isMesh && migrant.isMesh);
    assert(visible(resident) && visible(migrant));
    assert.deepEqual(resident.scale.toArray(), [0.18, 0.18, 0.18]);
    assert.deepEqual(migrant.scale.toArray(), [0.18, 0.18, 0.18]);
    assert.equal(resident.parent.name, `conjugating-partner-${id}`);
    assert.equal(migrant.parent, scene.model.group);
    const axis = migrant
      .getWorldPosition(new THREE.Vector3())
      .sub(resident.getWorldPosition(new THREE.Vector3()))
      .normalize();
    const interval = (points) => {
      let minimum = Infinity,
        maximum = -Infinity;
      for (let i = 0; i < points.length; i += 3) {
        const value =
          points[i] * axis.x + points[i + 1] * axis.y + points[i + 2] * axis.z;
        minimum = Math.min(minimum, value);
        maximum = Math.max(maximum, value);
      }
      return [minimum, maximum];
    };
    const a = interval(worldVertices(resident)),
      b = interval(worldVertices(migrant));
    assert(
      b[0] - a[1] > 1e-5,
      `partner ${id} completed pronuclear surfaces need a positive separating gap`,
    );
  }
}
function assertFusionEndpoint(current, original) {
  pose(current, 0.75);
  pose(original, 0.75);
  for (const id of [0, 1]) {
    const resident = find(current, `stationary-pronucleus-${id}`);
    assert.equal(resident.visible, false);
    assert.equal(resident.scale.lengthSq(), 0);
    assert.equal(resident.position.x, 0.3);
    assert.equal(Math.abs(resident.position.y), 0);
    assert.equal(resident.position.z, 0.54);
    assert(visible(find(current, `synkaryon-${id}`)));
    // Compare complete changed-root/synkaryon subtrees to the independent old
    // implementation, not the whole scene with its pre-existing oral-art delta.
    for (const name of [`stationary-pronucleus-${id}`, `synkaryon-${id}`])
      assert.deepEqual(
        subtree(current, name),
        subtree(original, name),
        `${name} original fusion endpoint`,
      );
  }
  assert.deepEqual(current.model.labels, original.model.labels);
}
function assertMigrantsReviewed(current, original) {
  // Preserve every original sample/detail. The two centers/scales are checked
  // against independent old/new pose contracts before exact root restoration.
  for (const progress of [
    0.44, 0.445, 0.49, 0.53, 0.55, 0.58, 0.6, 0.61, 0.64, 0.67, 0.68, 0.72,
    0.75, 1,
  ]) {
    pose(current, progress);
    pose(original, progress);
    assertMigrationSubtrees(current, original, progress);
  }
}
function assertSeekMatchesFresh(current, definition, transformed) {
  for (const progress of [
    0.75,
    0.445,
    0.53,
    0.4449999,
    0.68,
    0,
    1,
    0.53,
    0.75,
    0.67,
    0.601,
    0.55,
    0.601,
    0.621,
    0.613,
    0.588,
    0.58,
    0.584,
    0.617,
    0.601,
    NaN,
    0.601,
    Infinity,
    0.601,
    -Infinity,
    0.601,
    0.6945,
    0.725,
    0.75,
  ]) {
    pose(current, progress);
    const fresh = setupSnapshot(definition, transformed);
    try {
      pose(fresh, progress);
      assert.deepEqual(
        geometrySnapshot(current.model, current.parent),
        geometrySnapshot(fresh.model, fresh.parent),
        `nonmonotonic seek matches a new instance at ${progress}`,
      );
      assert.deepEqual(current.model.labels, fresh.model.labels);
    } finally {
      disposeSnapshot(fresh.model);
    }
  }
}

function assertDeltaRejectsUnrelatedEdits(current, original, equivalent) {
  pose(current, 0.55);
  pose(original, 0.55);
  equivalent(current, original, 0.55);
  const baseline = geometrySnapshot(current.model, current.parent),
    labels = structuredClone(current.model.labels),
    frozen = geometrySnapshot(original.model, original.parent),
    frozenLabels = structuredClone(original.model.labels);
  const rejects = (description, mutate, restore) => {
    try {
      mutate();
      current.parent.updateMatrixWorld(true);
      assert.throws(
        () => equivalent(current, original, 0.55),
        (error) => error.code === "ERR_ASSERTION",
        description,
      );
    } finally {
      restore();
      current.parent.updateMatrixWorld(true);
    }
    assert.deepEqual(
      geometrySnapshot(current.model, current.parent),
      baseline,
      `${description}: restored scene`,
    );
    assert.deepEqual(
      current.model.labels,
      labels,
      `${description}: restored complete labels`,
    );
    assert.deepEqual(
      geometrySnapshot(original.model, original.parent),
      frozen,
      `${description}: original untouched`,
    );
    assert.deepEqual(original.model.labels, frozenLabels);
    equivalent(current, original, 0.55);
  };
  const resident = find(current, "stationary-pronucleus-0"),
    migrant = find(current, "migratory-pronucleus-0"),
    detail = resident.children.find((object) => object.isInstancedMesh),
    label = current.model.labels[3],
    otherLabel = current.model.labels[2];
  assert(detail && detail.count > 0);
  const x = resident.position.x,
    scale = resident.scale.x,
    material = resident.material,
    geometry = resident.geometry,
    partner = resident.parent,
    name = resident.name,
    count = detail.count,
    migrantX = migrant.position.x,
    labelX = label.position[0],
    wording = label.text.en,
    target = label.anchorTarget,
    otherX = otherLabel.position[0];
  let changedMaterial, changedGeometry, duplicate;
  rejects(
    "incorrect resident x",
    () => {
      resident.position.x += 0.01;
    },
    () => {
      resident.position.x = x;
    },
  );
  rejects(
    "resident identity",
    () => {
      resident.name = "stationary-pronucleus-1";
    },
    () => {
      resident.name = name;
    },
  );
  rejects(
    "resident count",
    () => {
      duplicate = resident.clone(false);
      partner.add(duplicate);
    },
    () => {
      partner.remove(duplicate);
      // clone(false) shares the original geometry/material: do not dispose them.
    },
  );
  rejects(
    "resident scale",
    () => {
      resident.scale.x *= 0.9;
    },
    () => {
      resident.scale.x = scale;
    },
  );
  rejects(
    "resident material",
    () => {
      changedMaterial = material.clone();
      changedMaterial.opacity = 0.5;
      resident.material = changedMaterial;
    },
    () => {
      resident.material = material;
      changedMaterial?.dispose();
    },
  );
  rejects(
    "nuclear shell vertices",
    () => {
      changedGeometry = geometry.clone();
      changedGeometry.attributes.position.array[0] += 0.01;
      resident.geometry = changedGeometry;
    },
    () => {
      resident.geometry = geometry;
      changedGeometry?.dispose();
    },
  );
  rejects(
    "nuclear detail instance count",
    () => {
      detail.count--;
    },
    () => {
      detail.count = count;
    },
  );
  rejects(
    "migrant path",
    () => {
      migrant.position.x += 0.01;
    },
    () => {
      migrant.position.x = migrantX;
    },
  );
  rejects(
    "resident label position",
    () => {
      label.position[0] += 0.01;
    },
    () => {
      label.position[0] = labelX;
    },
  );
  rejects(
    "resident label wording",
    () => {
      label.text.en += " altered";
    },
    () => {
      label.text.en = wording;
    },
  );
  rejects(
    "resident label identity",
    () => {
      label.anchorTarget = "migratory-pronucleus-0";
    },
    () => {
      label.anchorTarget = target;
    },
  );
  rejects(
    "other label position",
    () => {
      otherLabel.position[0] += 0.01;
    },
    () => {
      otherLabel.position[0] = otherX;
    },
  );

  // A real non-exempt reference pose must still reject an x edit.
  pose(current, 0.42);
  pose(original, 0.42);
  const strictBefore = geometrySnapshot(current.model, current.parent),
    strictLabels = structuredClone(current.model.labels),
    strictX = resident.position.x;
  equivalent(current, original, 0.42);
  try {
    resident.position.x -= 0.14;
    current.parent.updateMatrixWorld(true);
    assert.throws(
      () => equivalent(current, original, 0.42),
      (error) => error.code === "ERR_ASSERTION",
    );
  } finally {
    resident.position.x = strictX;
    current.parent.updateMatrixWorld(true);
  }
  assert.deepEqual(
    geometrySnapshot(current.model, current.parent),
    strictBefore,
  );
  assert.deepEqual(current.model.labels, strictLabels);
  equivalent(current, original, 0.42);
}

export function runConjugationContinuityRegression(
  definition,
  originalDefinition,
  equivalent,
) {
  for (const transformed of [false, true]) {
    const current = setupSnapshot(definition, transformed),
      original = setupSnapshot(originalDefinition, transformed);
    try {
      assertHandoff(current);
      for (const progress of [0.53, 0.54]) {
        pose(current, progress);
        assertCompletedSeparation(current);
        assertResidentAnchor(current);
      }
      // A defect-sensitive negative control uses actual historical model vertices.
      pose(original, 0.53);
      assert.throws(
        () => assertCompletedSeparation(original),
        /completed pronuclear surfaces/,
        "the original overlapping completed pose must not satisfy the new geometry gate",
      );
      assertFusionEndpoint(current, original);
      assertMigrantsReviewed(current, original);
      assertSeekMatchesFresh(current, definition, transformed);
      assertDeltaRejectsUnrelatedEdits(current, original, equivalent);
      runConjugationMigrationRegression(current, original);
    } finally {
      disposeSnapshot(current.model);
      disposeSnapshot(original.model);
    }
  }
}
