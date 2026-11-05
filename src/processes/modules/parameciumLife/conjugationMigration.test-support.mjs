import assert from "node:assert/strict";
import * as THREE from "three";
import {
  geometrySnapshot,
  resourceInventory,
} from "./geometrySnapshot.test-support.mjs";

// Independent review oracle: never import the candidate's motion/shape helpers.
// The original fixture remains immutable. Only the two named migrant roots may
// have the position/scale delta specified here; all their detail still hashes.
const EPS = 1e-12;
const UNIT_RADIUS = 1.018 + 1e-6;
const RADIUS = 0.18 * UNIT_RADIUS;
const finiteProgress = (value) =>
  Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
const smooth = (value) => {
  const t = finiteProgress(value);
  return 3 * t * t - 2 * t * t * t;
};
const phase = (p, start, end) => smooth((p - start) / (end - start));
const smoother = (t) => 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;
const shapeWeight = (p) => {
  if (p <= 0.58 || p >= 0.621) return 0;
  if (p >= 0.588 && p <= 0.613) return 1;
  return p < 0.588
    ? smoother((p - 0.58) / (0.588 - 0.58))
    : 1 - smoother((p - 0.613) / (0.621 - 0.613));
};
const E0 = phase(0.621, 0.55, 0.67);
const A0 = -0.45 + 1.16 * E0;
const DOCK = 0.46;
const K = (0.71 - A0) / (DOCK - A0);
const dockPolynomial = (u) =>
  K * u + (10 - 6 * K) * u ** 3 + (-15 + 8 * K) * u ** 4 + (6 - 3 * K) * u ** 5;

function near(actual, expected, message, epsilon = EPS) {
  assert(Number.isFinite(actual) && Number.isFinite(expected), message);
  assert(
    Math.abs(actual - expected) <= epsilon,
    `${message}: ${actual} vs ${expected}`,
  );
}
function nearArray(actual, expected, message) {
  assert.equal(actual.length, expected.length, message);
  actual.forEach((value, index) =>
    near(value, expected[index], `${message}[${index}]`),
  );
}
function find(scene, name) {
  const matches = [];
  scene.model.group.traverse((object) => {
    if (object.name === name) matches.push(object);
  });
  assert.equal(matches.length, 1, `unique reviewed root ${name}`);
  return matches[0];
}
const pose = (scene, p) => {
  scene.model.update(p);
  scene.parent.updateMatrixWorld(true);
};
const subtree = (scene, root) =>
  geometrySnapshot(
    { group: root, labels: [], camera: scene.model.camera },
    scene.parent,
  );

function reviewedPose(progress, id) {
  const p = finiteProgress(progress);
  const sign = id === 0 ? -1 : 1;
  const targetSign = -sign;
  const cx = 1.55 - 0.48 * phase(p, 0, 0.12) + 0.52 * phase(p, 0.74, 0.84);
  const pronuclear = phase(p, 0.44, 0.53);
  const exchange = phase(p, 0.55, 0.67);
  const fusion = phase(p, 0.68, 0.75);
  const remaining = 1 - fusion;
  const weight = shapeWeight(p);
  const q = 1 - 0.4 * weight;
  const scalar = 0.18 * phase(p, 0.445, 0.53) * remaining;
  const source = sign * (cx - 0.36 - 0.26 * pronuclear);
  const destination = -sign * (cx - 0.36);
  const oldPosition = [
    (1 - exchange) * source + exchange * destination,
    (-0.13 * (1 - pronuclear) + sign * 0.12 * pronuclear) * remaining,
    0.54 + 0.03 * pronuclear,
  ];
  let position;
  if (p >= 0.68) {
    position = [
      targetSign * (cx - 0.22 - 0.08 * fusion - 0.39 * remaining ** 2),
      -0.13 * remaining + 0.13 * remaining ** 2,
      0.54 + 0.03 * remaining ** 2,
    ];
  } else {
    const x =
      p <= 0.621
        ? oldPosition[0]
        : targetSign *
          (p >= 0.67
            ? DOCK
            : A0 + (DOCK - A0) * dockPolynomial((exchange - E0) / (1 - E0)));
    position = [
      x,
      -0.13 * (1 - pronuclear) + sign * 0.12 * pronuclear * weight,
      oldPosition[2],
    ];
  }
  return {
    p,
    q,
    weight,
    scalar,
    fusion,
    position,
    oldPosition,
    scale: [scalar / q, scalar * q, scalar],
    oldScale: [scalar, scalar, scalar],
    visible: p >= 0.445 && p < 0.75,
  };
}

function assertRootPose(scene, root, expected, original, id) {
  assert.equal(root, find(scene, `migratory-pronucleus-${id}`));
  assert(root.isMesh && !root.isInstancedMesh);
  assert.equal(root.parent, scene.model.group);
  assert.equal(root.visible, expected.visible);
  nearArray(
    root.position.toArray(),
    original ? expected.oldPosition : expected.position,
    "reviewed migrant center",
  );
  nearArray(
    root.scale.toArray(),
    original ? expected.oldScale : expected.scale,
    "reviewed migrant scale",
  );
  assert.deepEqual(root.quaternion.toArray(), [0, 0, 0, 1]);
  for (const matrix of [root.matrix, root.matrixWorld])
    assert(matrix.elements.every(Number.isFinite), "finite migrant transform");
  near(
    root.matrix.determinant(),
    expected.scalar ** 3,
    "root determinant retains original scalar volume",
  );
  if (expected.scalar > 0) {
    near(
      (root.scale.x / root.scale.z) * (root.scale.y / root.scale.z),
      1,
      "relative affine determinant one",
    );
  } else assert.deepEqual(root.scale.toArray(), [0, 0, 0]);
}

// This is an exact, named position+scale adapter, not a matrix-field omission.
// Both actual poses are checked before touching the candidate. Restoring the
// old root pose then hashes every local transform, attribute, index, instance,
// material, shared resource and derived descendant world matrix as before.
export function migrationPoseDelta(
  current,
  migrant,
  original,
  frozenMigrant,
  progress,
) {
  const match = /^migratory-pronucleus-([01])$/.exec(migrant.name);
  assert(match, "only two named migration roots have a reviewed delta");
  assert.equal(frozenMigrant.name, migrant.name);
  const id = Number(match[1]);
  const expected = reviewedPose(progress, id);
  assertRootPose(current, migrant, expected, false, id);
  assertRootPose(original, frozenMigrant, expected, true, id);
  if (expected.scalar > 0)
    near(
      migrant.matrixWorld.determinant() /
        frozenMigrant.matrixWorld.determinant(),
      1,
      "world determinant ratio",
    );
  const before = subtree(current, migrant);
  const originalBefore = subtree(original, frozenMigrant);
  const labels = structuredClone(current.model.labels);
  const originalLabels = structuredClone(original.model.labels);
  const position = migrant.position.clone();
  const scale = migrant.scale.clone();
  try {
    migrant.position.copy(frozenMigrant.position);
    migrant.scale.copy(frozenMigrant.scale);
    return subtree(current, migrant);
  } finally {
    migrant.position.copy(position);
    migrant.scale.copy(scale);
    current.parent.updateMatrixWorld(true);
    assert.deepEqual(
      subtree(current, migrant),
      before,
      "restore actual candidate subtree",
    );
    assert.deepEqual(
      subtree(original, frozenMigrant),
      originalBefore,
      "frozen subtree untouched",
    );
    assert.deepEqual(
      current.model.labels,
      labels,
      "candidate labels untouched",
    );
    assert.deepEqual(
      original.model.labels,
      originalLabels,
      "frozen labels untouched",
    );
  }
}

export function assertMigrationSubtrees(current, original, progress) {
  for (const id of [0, 1]) {
    const a = find(current, `migratory-pronucleus-${id}`);
    const b = find(original, `migratory-pronucleus-${id}`);
    assert.deepEqual(
      migrationPoseDelta(current, a, original, b, progress),
      subtree(original, b),
      `migration ${id} keeps every detail beyond its reviewed center/scale at ${progress}`,
    );
  }
}

function inventory(root) {
  const values = resourceInventory({ group: root });
  root.traverse((object) => {
    if (object.geometry?.index)
      values.push(
        object.geometry.index.array,
        object.geometry.index.array.buffer,
      );
    values.push(
      ...(Array.isArray(object.material) ? object.material : [object.material]),
    );
    if (object.instanceColor)
      values.push(
        object.instanceColor,
        object.instanceColor.array,
        object.instanceColor.array.buffer,
      );
  });
  return values;
}
function sameInventory(root, expected) {
  const actual = inventory(root);
  assert.equal(actual.length, expected.length);
  actual.forEach((value, index) =>
    assert.equal(
      value,
      expected[index],
      "same-instance complete detail identity",
    ),
  );
}

function completeLocalVertices(root) {
  assert.equal(root.children.length, 8, "complete migrant child inventory");
  const nodes = [root, ...root.children];
  const expected = [
    [759, 4032, 1],
    [759, 4032, 1],
    [585, 3072, 1],
    [585, 3072, 1],
    [425, 2160, 36],
    [459, 2400, 1],
    [459, 2400, 1],
    [459, 2400, 1],
    [91, 432, 10],
  ];
  assert.equal(
    root.geometry,
    root.children[0].geometry,
    "shared inner/outer shell",
  );
  assert.equal(
    root.children[1].geometry,
    root.children[2].geometry,
    "shared cut-edge geometry",
  );
  const points = [];
  const identity = new THREE.Matrix4();
  const instance = new THREE.Matrix4();
  const transform = new THREE.Matrix4();
  const point = new THREE.Vector3();
  nodes.forEach((object, ordinal) => {
    if (ordinal > 0)
      assert.equal(
        object.children.length,
        0,
        "reviewed one-level detail hierarchy",
      );
    const [vertexCount, indexCount, count] = expected[ordinal];
    assert.equal(object.geometry.attributes.position.count, vertexCount);
    assert.equal(object.geometry.index.count, indexCount);
    assert.equal(object.isInstancedMesh ? object.count : 1, count);
    assert.equal(!!object.isInstancedMesh, ordinal === 4 || ordinal === 8);
    if (ordinal > 0) {
      assert.deepEqual(object.position.toArray(), [0, 0, 0]);
      assert.deepEqual(object.quaternion.toArray(), [0, 0, 0, 1]);
      const s = ordinal === 1 || ordinal === 3 ? 0.93 : 1;
      assert.deepEqual(object.scale.toArray(), [s, s, s]);
    }
    for (const attribute of Object.values(object.geometry.attributes))
      assert(
        attribute.array.every(Number.isFinite),
        "finite complete geometry attributes",
      );
    const attribute = object.geometry.attributes.position;
    const quantization = 2 ** -24;
    assert(
      attribute.array.every((v) => Math.abs(v) <= 1.018 + quantization),
      "predeclared Float32 coordinate budget",
    );
    for (let index = 0; index < count; index++) {
      transform.copy(ordinal === 0 ? identity : object.matrix);
      if (object.isInstancedMesh) {
        object.getMatrixAt(index, instance);
        assert(instance.elements.every(Number.isFinite));
        for (const j of [0, 1, 2, 4, 5, 6, 8, 9, 10])
          assert(Math.abs(instance.elements[j]) <= 1 + quantization);
        for (const j of [12, 13, 14])
          assert(Math.abs(instance.elements[j]) <= 0.83 + quantization);
        assert.deepEqual(
          [
            instance.elements[3],
            instance.elements[7],
            instance.elements[11],
            instance.elements[15],
          ],
          [0, 0, 0, 1],
        );
        transform.multiply(instance);
      }
      for (let vertex = 0; vertex < vertexCount; vertex++) {
        point.fromBufferAttribute(attribute, vertex).applyMatrix4(transform);
        assert(point.toArray().every(Number.isFinite));
        assert(
          point.length() <= UNIT_RADIUS,
          "complete detail fits the fixed outward-rounded local sphere",
        );
        points.push(point.clone());
      }
    }
  });
  assert.equal(
    points.length,
    20275,
    "all 36 histones, 10 pores and three chromatin tubes expanded",
  );
  return points;
}

function interval(points, root, axis) {
  let low = Infinity,
    high = -Infinity;
  const value = new THREE.Vector3();
  for (const point of points) {
    value.copy(point).applyMatrix4(root.matrix);
    const projection = value.dot(axis);
    low = Math.min(low, projection);
    high = Math.max(high, projection);
    assert(
      value.toArray().every(Number.isFinite),
      "finite actual complete transformed vertices",
    );
    value.copy(point).applyMatrix4(root.matrixWorld);
    assert(
      value.toArray().every(Number.isFinite),
      "finite actual world vertices under either parent",
    );
  }
  return [low, high];
}

function assertContinuousCertificate() {
  const required = (2 * RADIUS) ** 2;
  // Each ramp is partitioned into 32 intervals. d and q are monotone in
  // opposite endpoint choices; w/q is monotone. These are interval lower
  // bounds on d^2 q^2 + (.24 w/q)^2, not 64 sampled model frames.
  for (let index = 0; index < 32; index++) {
    const a = index / 32,
      b = (index + 1) / 32;
    const upW0 = smoother(a),
      upW1 = smoother(b);
    const upQ0 = 1 - 0.4 * upW0,
      upQ1 = 1 - 0.4 * upW1;
    const upD = 0.9 - 2.32 * smooth(0.25 + b / 15);
    const upLower = upD ** 2 * upQ1 ** 2 + 0.0576 * (upW0 / upQ0) ** 2;
    const downW0 = 1 - smoother(a),
      downW1 = 1 - smoother(b);
    const downQ0 = 1 - 0.4 * downW0,
      downQ1 = 1 - 0.4 * downW1;
    const downD = 2.32 * smooth(21 / 40 + a / 15) - 0.9;
    const downLower =
      downD ** 2 * downQ0 ** 2 + 0.0576 * (downW1 / downQ1) ** 2;
    assert(
      upLower > 0.13692 && upLower > required,
      `entering interval ${index} separates all p`,
    );
    assert(
      downLower > 0.1423 && downLower > required,
      `leaving interval ${index} separates all p`,
    );
  }
  assert((0.24 / 0.6) ** 2 > required, "whole plateau separates by y");
  assert(
    0.5375 > 2 * RADIUS && 2 * A0 > 2 * RADIUS,
    "centered spherical segments separate",
  );
  assert(
    K > 2 && K < 2.5 && 30 - 12 * K > 0,
    "C2 docking polynomial is monotone and cannot overshoot",
  );
  near(dockPolynomial(0), 0, "docking start");
  near(dockPolynomial(1), 1, "docking end");
  assert(0.4 - 2 * RADIUS > 0.0335, "completed birth-to-shape resident x gap");
  assert(
    0.85 - A0 - RADIUS / 0.6 - RADIUS > 0.07364,
    "shape-window resident x support",
  );
  assert(
    0.85 - DOCK - 2 * RADIUS > 0.0235,
    "arrival holds positive resident gap until fusion",
  );
}

function assertBounds(scene) {
  const size = new THREE.Box3()
    .setFromObject(scene.model.group)
    .getSize(new THREE.Vector3())
    .toArray();
  assert(
    size.every(Number.isFinite) &&
      Math.max(...size) > 2 &&
      Math.max(...size) < 20,
    "unchanged whole-scene bounds gate",
  );
}

function assertMutationRejection(current, original) {
  const p = 0.601;
  pose(current, p);
  pose(original, p);
  const root = find(current, "migratory-pronucleus-0");
  const baseline = geometrySnapshot(current.model, current.parent);
  const frozen = geometrySnapshot(original.model, original.parent);
  const labels = structuredClone(current.model.labels);
  const rejects = (message, mutate, restore) => {
    try {
      mutate();
      current.parent.updateMatrixWorld(true);
      assert.throws(
        () => assertMigrationSubtrees(current, original, p),
        (error) => error.code === "ERR_ASSERTION",
        message,
      );
    } finally {
      restore();
      current.parent.updateMatrixWorld(true);
    }
    assert.deepEqual(
      geometrySnapshot(current.model, current.parent),
      baseline,
      `${message}: candidate restored`,
    );
    assert.deepEqual(
      geometrySnapshot(original.model, original.parent),
      frozen,
      `${message}: frozen untouched`,
    );
    assert.deepEqual(current.model.labels, labels);
    assertMigrationSubtrees(current, original, p);
  };
  const scale = root.scale.clone(),
    position = root.position.clone();
  rejects(
    "wrong volume-preserving q",
    () => root.scale.set(0.18 / 0.61, 0.18 * 0.61, 0.18),
    () => root.scale.copy(scale),
  );
  rejects(
    "unreviewed migrant center",
    () => {
      root.position.x += 0.01;
    },
    () => root.position.copy(position),
  );
  const detail = root.children[4 - 1],
    count = detail.count;
  assert(detail.isInstancedMesh && count === 36);
  rejects(
    "lost nuclear instance",
    () => {
      detail.count--;
    },
    () => {
      detail.count = count;
    },
  );
  const geometry = root.geometry;
  let changed;
  rejects(
    "changed shell index",
    () => {
      changed = geometry.clone();
      changed.index.array[0] =
        (changed.index.array[0] + 1) % changed.attributes.position.count;
      root.geometry = changed;
    },
    () => {
      root.geometry = geometry;
      changed?.dispose();
    },
  );
  const opacity = root.material.opacity;
  rejects(
    "changed nuclear material",
    () => {
      root.material.opacity = opacity * 0.9;
    },
    () => {
      root.material.opacity = opacity;
    },
  );
}

export function runConjugationMigrationRegression(current, original) {
  assertContinuousCertificate();
  pose(current, 0.53);
  const roots = [0, 1].map((id) => find(current, `migratory-pronucleus-${id}`));
  const points = roots.map(completeLocalVertices);
  const resources = roots.map(inventory);
  const boundaries = [0.58, 0.588, 0.613, 0.621, 0.67, 0.68, 0.75];
  const samples = [
    0,
    0.445,
    0.49,
    0.53,
    0.55,
    0.584,
    0.601,
    0.617,
    0.64,
    0.6945,
    0.7,
    0.725,
    1,
    ...boundaries.flatMap((p) => [p - 1e-7, p, p + 1e-7]),
  ];
  for (const p of samples) {
    pose(current, p);
    pose(original, p);
    assertMigrationSubtrees(current, original, p);
    roots.forEach((root, index) => sameInventory(root, resources[index]));
    assertBounds(current);
    assertBounds(original);
    if (p >= 0.53 && p <= 0.68) {
      const expected = reviewedPose(p, 0);
      const delta = roots[1].position.clone().sub(roots[0].position);
      const axis = new THREE.Vector3(
        delta.x * expected.q ** 2,
        delta.y / expected.q ** 2,
        delta.z,
      ).normalize();
      const a = interval(points[0], roots[0], axis);
      const b = interval(points[1], roots[1], axis);
      assert(
        b[0] - a[1] > 1e-5,
        "actual complete migrant subtrees have a positive separating plane",
      );
      for (const root of roots)
        for (const id of [0, 1]) {
          const resident = find(current, `stationary-pronucleus-${id}`);
          const center = current.model.group.worldToLocal(
            resident.getWorldPosition(new THREE.Vector3()),
          );
          const xGap =
            Math.abs(center.x - root.position.x) - RADIUS / expected.q - RADIUS;
          assert(
            xGap > 0.0235,
            "complete incoming/resident support stays separated after birth and before fusion",
          );
        }
    }
    if (p >= 0.68 && p <= 0.75) {
      const expected = reviewedPose(p, 0);
      const remaining = 1 - expected.fusion;
      for (const id of [0, 1]) {
        const resident = find(current, `stationary-pronucleus-${1 - id}`);
        const center = current.model.group.worldToLocal(
          resident.getWorldPosition(new THREE.Vector3()),
        );
        near(
          roots[id].position.distanceTo(center),
          Math.hypot(0.39, 0.13, 0.03) * remaining ** 2,
          "fusion uses quadratic relative approach",
        );
      }
    }
  }
  pose(current, 0.75);
  pose(original, 0.75);
  for (const id of [0, 1]) {
    const syn = find(current, `synkaryon-${1 - id}`);
    const center = current.model.group.worldToLocal(
      syn.getWorldPosition(new THREE.Vector3()),
    );
    near(
      roots[id].position.distanceTo(center),
      0,
      "incoming truly reaches target synkaryon center",
    );
    assert.equal(roots[id].visible, false);
    assert.equal(roots[id].scale.lengthSq(), 0);
    assert(
      find(original, `migratory-pronucleus-${id}`).position.distanceTo(center) >
        0.06,
      "historical unfinished endpoint is a defect-sensitive negative control",
    );
  }
  assertMutationRejection(current, original);
}
