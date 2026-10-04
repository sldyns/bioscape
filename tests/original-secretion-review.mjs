import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import * as THREE from "three";

// The optional module/case overrides exercise these invariants against the
// retained pre-repair source as a negative control; ordinary runs check both.
const moduleUrl = process.env.BIOSCAPE_SECRETION_REVIEW_MODULE
  ? pathToFileURL(resolve(process.env.BIOSCAPE_SECRETION_REVIEW_MODULE))
  : new URL("../src/processes/secretionProcess.js", import.meta.url);
const { default: definition } = await import(moduleUrl);
const onlyCase = process.env.BIOSCAPE_SECRETION_REVIEW_CASE;
const model = definition.create();
const { group } = model;
const incoming = group.getObjectByName("ER-carrier");
const outgoing = group.getObjectByName("secretory-carrier");
const persistent = group.getObjectByName("persistent-carrier-membrane-lipids");
const fusion = group.getObjectByName("continuous-fusion-shell");
const incomingLipids = incoming.children.find((o) => o.isGroup);
const matrix = new THREE.Matrix4();
const seek = (p) => {
  model.update(p);
  group.updateMatrixWorld(true);
};
const instancePoints = (parent) => {
  const points = [];
  for (const mesh of parent.children.filter((o) => o.isInstancedMesh))
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      // Tail tips as well as instance origins detect a sudden basis change.
      for (const y of mesh.geometry.type === "CylinderGeometry"
        ? [-0.5, 0, 0.5]
        : [0])
        points.push(
          new THREE.Vector3(0, y, 0)
            .applyMatrix4(matrix)
            .applyMatrix4(mesh.matrixWorld),
        );
    }
  return points;
};
const maxDelta = (a, b) => {
  assert.equal(a.length, b.length, "Tracked membrane identities are retained");
  return a.reduce((max, point, i) => Math.max(max, point.distanceTo(b[i])), 0);
};
const boundaryDelta = (parent, p, epsilon) => {
  seek(p - epsilon);
  const before = instancePoints(parent);
  seek(p + epsilon);
  return maxDelta(before, instancePoints(parent));
};
const vertices = (mesh) =>
  Array.from({ length: mesh.geometry.attributes.position.count }, (_, i) =>
    new THREE.Vector3()
      .fromBufferAttribute(mesh.geometry.attributes.position, i)
      .applyMatrix4(mesh.matrixWorld),
  );
const triangles = (mesh) => {
  const points = vertices(mesh),
    index = mesh.geometry.index.array,
    result = [];
  for (let i = 0; i < index.length; i += 3) {
    const triangle = new THREE.Triangle(
      points[index[i]],
      points[index[i + 1]],
      points[index[i + 2]],
    );
    if (triangle.getArea() > 1e-14) result.push(triangle);
  }
  return result;
};
const nearestTriangle = (point, faces) => {
  const candidate = new THREE.Vector3();
  return faces.reduce((best, triangle) => {
    triangle.closestPointToPoint(point, candidate);
    return Math.min(best, point.distanceTo(candidate));
  }, Infinity);
};

if (!onlyCase || onlyCase === "departure") {
  const wide = boundaryDelta(incomingLipids, 0.2, 1e-4);
  const narrow = boundaryDelta(incomingLipids, 0.2, 1e-8);
  assert.ok(
    narrow < 1e-6 && narrow < wide * 0.01,
    `ER departure must preserve every visible lipid world coordinate: ${narrow}`,
  );
  assert.ok(
    boundaryDelta(incomingLipids, 0.34, 1e-8) < 1e-6,
    "The continuous rotation must finish before the Golgi pore opens",
  );

  // Compare the last actual neck ring with the polygonal carrier mouth, not an
  // ideal sphere or a metadata anchor. Both open docking directions are covered.
  const closest = new THREE.Vector3();
  for (const [p, carrier, name] of [
    [0.12, incoming, "continuous-ER-carrier-neck"],
    [0.19, incoming, "continuous-ER-carrier-neck"],
    [0.34, incoming, "continuous-Golgi-carrier-neck"],
    [0.37, incoming, "continuous-Golgi-carrier-neck"],
    [0.41, incoming, "continuous-Golgi-carrier-neck"],
    [0.67, outgoing, "continuous-Golgi-carrier-neck"],
    [0.72, outgoing, "continuous-Golgi-carrier-neck"],
    [0.779, outgoing, "continuous-Golgi-carrier-neck"],
  ]) {
    seek(p);
    const open = carrier.getObjectByName("open-carrier-membrane");
    assert.equal(open.visible, true);
    const columns = open.geometry.parameters.widthSegments + 1;
    const mouth = vertices(open).slice(-columns);
    const edges = mouth
      .slice(0, -1)
      .map((v, i) => new THREE.Line3(v, mouth[i + 1]));
    const neck = group.getObjectByName(name);
    assert.equal(neck.visible, true);
    const lastRing = vertices(neck).slice(-289);
    for (const point of lastRing) {
      const distance = Math.min(
        ...edges.map((edge) => {
          edge.closestPointToPoint(point, true, closest);
          return closest.distanceTo(point);
        }),
      );
      assert.ok(distance < 5e-7, `Open neck/carrier gap at ${p}: ${distance}`);
    }
  }
}

if (!onlyCase || onlyCase === "fusion") {
  const wide = boundaryDelta(persistent, 0.9, 1e-4);
  const narrow = boundaryDelta(persistent, 0.9, 1e-8);
  assert.ok(
    narrow < 1e-6 && narrow < wide * 0.01,
    `Fusion must retain all visible lipid heads and tail branches: ${narrow}`,
  );
  seek(0.9 - 1e-8);
  const closed = outgoing.getObjectByName("closed-carrier-membrane");
  const oldPoints = vertices(closed);
  const oldOpacity = closed.material.opacity;
  seek(0.9 + 1e-8);
  assert.ok(
    maxDelta(oldPoints, vertices(fusion)) < 1e-6,
    "The travelling sphere and first fusion frame must share actual surface vertices",
  );
  assert.ok(
    Math.abs(fusion.material.opacity - oldOpacity) < 1e-7,
    "The surface handoff must not change membrane opacity",
  );

  const heads = persistent.children.find(
    (o) => o.isInstancedMesh && o.geometry.type === "SphereGeometry",
  );
  let attachmentMax = 0;
  for (const p of [
    0.78, 0.8999, 0.9, 0.9001, 0.905, 0.9125, 0.92, 0.925, 0.94, 0.963, 0.975,
    0.9919, 0.992, 1,
  ]) {
    seek(p);
    const surface = p < 0.9 ? closed : fusion;
    const faces = triangles(surface);
    for (let i = 0; i < heads.count; i += 2) {
      heads.getMatrixAt(i, matrix);
      const midpoint = new THREE.Vector3().setFromMatrixPosition(matrix);
      heads.getMatrixAt(i + 1, matrix);
      midpoint
        .add(new THREE.Vector3().setFromMatrixPosition(matrix))
        .multiplyScalar(0.5)
        .applyMatrix4(heads.matrixWorld);
      attachmentMax = Math.max(attachmentMax, nearestTriangle(midpoint, faces));
    }
  }
  assert.ok(
    attachmentMax < 5e-7,
    `Both leaflet midpoints must remain on rendered membrane triangles: ${attachmentMax}`,
  );

  const patch = group.getObjectByName("receiving-membrane-pore-patch");
  assert.ok(patch, "The receiving membrane needs a matching opening patch");
  seek(0.992 - 1e-8);
  const flattenedOpacity = fusion.material.opacity;
  seek(0.992);
  assert.ok(
    Math.abs(patch.material.opacity - flattenedOpacity) < 1e-7,
    "The flattened carrier must match the final receiving membrane opacity",
  );
  const columns = fusion.geometry.parameters.widthSegments + 1;
  let previousRadius = -1;
  for (const p of [0.9, 0.9025, 0.905, 0.91, 0.915, 0.92, 0.9249]) {
    seek(p);
    assert.equal(patch.visible, true);
    const mouth = vertices(fusion).slice(0, columns);
    const receiver = vertices(patch).slice(0, columns);
    assert.ok(
      maxDelta(mouth, receiver) < 5e-7,
      "Fusion-pore and receiving-annulus boundaries must share their polygon",
    );
    const radius = Math.hypot(mouth[0].y, mouth[0].z);
    assert.ok(radius >= previousRadius, "The pore opens continuously outward");
    if (p === 0.9)
      assert.ok(
        radius < 1e-7,
        "The first frame retains the closed compartment",
      );
    previousRadius = radius;
  }
  seek(0.925);
  assert.equal(patch.visible, false);
  assert.ok(
    Math.abs(Math.hypot(...vertices(fusion)[0].toArray().slice(1)) - 0.3) <
      1e-6,
  );

  const cargo = group.children.find(
    (o) =>
      o.isGroup &&
      o.children.some((child) => child.material?.emissiveIntensity === 0.26),
  );
  assert.ok(cargo);
  for (let frame = 0; frame <= 100; frame++) {
    const p = 0.9 + frame / 1000;
    seek(p);
    cargo.traverse((object) => {
      if (!object.isMesh || object.geometry.type === "TorusGeometry") return;
      for (const point of vertices(object)) {
        if (Math.abs(point.x - 2.98) < 0.04) {
          assert.ok(
            p >= 0.925 && p < 0.992,
            "Cargo crosses only while the pore is open",
          );
          assert.ok(
            Math.hypot(point.y, point.z) < 0.29,
            "Physical protein stays inside the pore, away from membrane leaflets",
          );
        }
      }
    });
  }
}

if (!onlyCase) {
  const resources = [];
  group.traverse((o) => resources.push([o, o.geometry, o.material]));
  const snapshot = () => {
    const hash = createHash("sha256");
    let index = 0;
    group.traverse((o) => {
      assert.deepEqual(
        [o, o.geometry, o.material],
        resources[index++],
        "No node, geometry or material allocation during update",
      );
      hash.update(
        JSON.stringify([
          o.visible,
          o.matrix.toArray(),
          o.material?.color?.toArray(),
          o.material?.opacity,
        ]),
      );
      for (const array of [
        ...Object.values(o.geometry?.attributes ?? {}).map((a) => a.array),
        o.instanceMatrix?.array,
      ].filter(Boolean)) {
        assert.ok(
          array.every(Number.isFinite),
          `Finite rendered buffer: ${o.name}`,
        );
        hash.update(
          Buffer.from(array.buffer, array.byteOffset, array.byteLength),
        );
      }
    });
    return hash.digest("hex");
  };
  for (const p of [
    0,
    0.12,
    0.2,
    0.26,
    0.32,
    0.34,
    0.42,
    0.67,
    0.78,
    0.8999,
    0.9,
    0.905,
    0.9125,
    0.925,
    0.963,
    0.98,
    0.992,
    1,
    NaN,
    -1,
    2,
  ]) {
    seek(p);
    const expected = snapshot();
    seek(0.997);
    seek(0.11);
    seek(0.913);
    seek(p);
    assert.equal(snapshot(), expected, `Deterministic arbitrary seek: ${p}`);
  }
}
console.log(
  "Original secretion review: lipid/surface continuity, welded neck/pore boundaries, triangle attachment, cargo passage and stable deterministic resources PASS",
);
