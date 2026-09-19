import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import promoter from "./promoterRegulationProcess.js";
import enhancer from "./enhancerRegulationProcess.js";
import transcription from "../../transcriptionProcess.js";

// Read actual mesh centerlines/instance transforms, not the model's userData.
const matrix = new THREE.Matrix4();
const point = (mesh, index, y = 0) => {
  mesh.getMatrixAt(index, matrix);
  return new THREE.Vector3(0, y, 0)
    .applyMatrix4(matrix)
    .applyMatrix4(mesh.matrixWorld);
};
const segments = (mesh) => {
  if (!mesh.visible) return [];
  return Array.from({ length: mesh.count }, (_, i) => {
    mesh.getMatrixAt(i, matrix);
    const width = new THREE.Vector3().setFromMatrixColumn(matrix, 0).length();
    return width > 1e-7 ? [point(mesh, i, -0.5), point(mesh, i, 0.5)] : null;
  }).filter(Boolean);
};
const centerline = (mesh) => {
  const attr = mesh.geometry.attributes.position;
  return Array.from({ length: attr.count / 8 }, (_, ring) => {
    const v = new THREE.Vector3();
    for (let j = 0; j < 8; j++)
      v.add(new THREE.Vector3().fromBufferAttribute(attr, ring * 8 + j));
    return mesh.localToWorld(v.divideScalar(8));
  });
};
const rnaMesh = (m, name = "Nascent RNA — backbone and nucleotides") =>
  m.group.getObjectByName(name).children[0];
const near = (a, b, tolerance, message) =>
  assert.ok(a.distanceTo(b) <= tolerance, `${message}: ${a.distanceTo(b)}`);
const seek = (m, p, parameters = {}) => {
  m.update(p, parameters);
  m.group.updateMatrixWorld(true);
};
const nearest = (p, points) => Math.min(...points.map((v) => v.distanceTo(p)));
const resourceSet = (m) => {
  const result = new Set();
  m.group.traverse((o) => {
    if (o.geometry) result.add(o.geometry.uuid);
    for (const material of Array.isArray(o.material)
      ? o.material
      : o.material
        ? [o.material]
        : [])
      result.add(material.uuid);
  });
  return [...result].sort();
};
const snapshot = (m) => {
  const hash = createHash("sha256");
  m.group.traverse((o) => {
    hash.update(
      JSON.stringify([
        o.visible,
        o.position.toArray(),
        o.quaternion.toArray(),
        o.scale.toArray(),
      ]),
    );
    for (const a of [
      o.geometry?.attributes.position?.array,
      o.instanceMatrix?.array,
    ])
      if (a) {
        assert.ok(a.every(Number.isFinite), `Non-finite geometry: ${o.name}`);
        hash.update(Buffer.from(a.buffer, a.byteOffset, a.byteLength));
      }
  });
  return hash.digest("hex");
};
function anchor(m) {
  const active = m.group.getObjectByName("Catalytic center schematic");
  near(
    centerline(rnaMesh(m))[0],
    active.getWorldPosition(new THREE.Vector3()),
    1e-6,
    "RNA 3′ must be at the actual catalytic center",
  );
  return active;
}

const p = promoter.create();
for (const t of [0.755, 0.81, 0.9, 0.985]) {
  seek(p, t, { bindingSite: "intact" });
  anchor(p);
  const line = centerline(rnaMesh(p));
  const template = centerline(
    p.group.getObjectByName("Promoter template backbone"),
  );
  for (const r of line.filter((r) => line[0].x - r.x < 0.18)) {
    assert.ok(
      nearest(r.clone().add(new THREE.Vector3(0, -0.12, 0)), template) < 0.035,
      "A short RNA segment must remain alongside the opened template",
    );
  }
}
for (const t of [0.2, 0.55, 0.85, 1]) {
  seek(p, t, { bindingSite: "altered" });
  assert.equal(
    rnaMesh(p).parent.visible,
    false,
    "Failed recognition must not produce RNA",
  );
}

const e = enhancer.create();
function openBonds(m) {
  const bonds = m.group.getObjectByName("Linker 7 base pairing");
  let opened = 0;
  for (let i = 0; i < bonds.count; i++) {
    bonds.getMatrixAt(i, matrix);
    if (new THREE.Vector3().setFromMatrixColumn(matrix, 0).length() < 0.0001)
      opened++;
  }
  return opened;
}
function templateIndex(m, active) {
  const sugars = m.group.getObjectByName("Linker 7 template sugars");
  const center = active.getWorldPosition(new THREE.Vector3());
  const y = new THREE.Vector3(0, 1, 0).applyQuaternion(
    active.parent.quaternion,
  );
  const target = center.clone().addScaledVector(y, -0.1);
  const rail = centerline(m.group.getObjectByName("Linker 7 strand 2"));
  assert.ok(
    nearest(target, rail) < 0.03,
    "Exposed template must pass beside the RNA catalytic end",
  );
  const distances = Array.from({ length: sugars.count }, (_, i) =>
    point(sugars, i).distanceTo(target),
  );
  return distances.indexOf(Math.min(...distances));
}
const indexes = [];
for (const t of [0.6, 0.68, 0.735, 0.88, 0.94, 0.985]) {
  seek(e, t, { coactivator: "competent" });
  const active = anchor(e);
  assert.ok(openBonds(e) >= 6, "RNA synthesis needs a local unpaired bubble");
  indexes.push(templateIndex(e, active));
}
assert.ok(
  indexes[2] - indexes[0] >= 7 && indexes[5] - indexes[3] >= 7,
  "Pol II must advance past actual template nucleotide instances in both bursts",
);
for (const end of [0.74, 0.99]) {
  seek(e, end - 1e-7);
  const before = centerline(rnaMesh(e));
  seek(e, end);
  const released = centerline(
    rnaMesh(e, `Released RNA from burst ${end === 0.74 ? 1 : 2}`),
  );
  before.forEach((v, i) =>
    near(v, released[i], 1e-5, "Release must preserve the existing RNA path"),
  );
}
for (const t of [0.25, 0.6, 0.73, 0.9, 1]) {
  seek(e, t, { coactivator: "competent" });
  const cores = e.group.children
    .filter((o) => o.name.startsWith("Nucleosome "))
    .map((o) => o.matrixWorld.toArray());
  seek(e, t, { coactivator: "impaired" });
  assert.equal(
    openBonds(e),
    0,
    "Impaired initiation cannot open a productive bubble",
  );
  assert.equal(rnaMesh(e).parent.visible, false);
  for (let i = 1; i <= 2; i++)
    assert.equal(
      e.group.getObjectByName(`Released RNA from burst ${i}`).visible,
      false,
    );
  assert.deepEqual(
    e.group.children
      .filter((o) => o.name.startsWith("Nucleosome "))
      .map((o) => o.matrixWorld.toArray()),
    cores,
    "Global chromatin trajectories stay equal across recruitment conditions",
  );
}

const tr = transcription.create();
const main = tr.group.getObjectByName("nascent-rna-backbone");
const downstream = tr.group.getObjectByName("downstream-rna-after-cleavage");
const beads = tr.group.getObjectByName("rna-nucleotides");
const length = (edges) =>
  edges.reduce((sum, [a, b]) => sum + a.distanceTo(b), 0);
seek(tr, 0.86 - 1e-8);
const beforeLength = length(segments(main));
const beforeBeads = Array.from({ length: beads.count }, (_, i) =>
  point(beads, i),
);
seek(tr, 0.86);
const upstream = segments(main),
  remnant = segments(downstream);
near(
  upstream[0][0],
  remnant.at(-1)[1],
  1e-6,
  "Both products must meet at the pre-existing cut coordinate",
);
assert.ok(
  Math.abs(length(upstream) + length(remnant) - beforeLength) < 0.0002,
  "Cleavage must partition RNA, not duplicate its near-active-site segment",
);
beforeBeads.forEach((v, i) =>
  near(
    v,
    point(beads, i),
    1e-6,
    "Cleavage preserves each existing nucleotide position",
  ),
);
assert.ok(
  upstream[0][0].distanceTo(remnant[0][0]) > 0.2,
  "Released 3′ end must be the cut end, not a copied catalytic end",
);
for (const t of [0.861, 0.88, 0.91, 0.95, 0.97]) {
  seek(tr, t);
  const pol = tr.group.getObjectByName("RNA-polymerase-II-schematic");
  near(
    segments(downstream)[0][0],
    new THREE.Vector3(0, -0.47, 0.32).applyMatrix4(pol.matrixWorld),
    1e-6,
    "Downstream RNA must follow the full catalytic transform until resolved",
  );
  near(
    pol.position,
    new THREE.Vector3(pol.position.x, 0.08, 0),
    1e-6,
    "Pol II must remain template-engaged while downstream RNA persists",
  );
}
for (const t of [0.98, 0.99, 1]) {
  seek(tr, t);
  assert.equal(
    downstream.visible,
    false,
    "No attached downstream RNA remains during Pol II departure",
  );
}
seek(tr, 1);
assert.equal(downstream.visible, false);
assert.equal(main.visible, true);

// Deterministic seeks and finite geometry on both controls; fixed GPU resources.
for (const [m, variants] of [
  [p, [{ bindingSite: "intact" }, { bindingSite: "altered" }]],
  [e, [{ coactivator: "competent" }, { coactivator: "impaired" }]],
  [tr, [{}]],
]) {
  const resources = resourceSet(m);
  for (const params of variants) {
    for (const t of [
      0, 0.17, 0.35, 0.53, 0.66, 0.739999, 0.74, 0.8, 0.86, 0.91, 0.99, 1,
    ]) {
      seek(m, t, params);
      const expected = snapshot(m);
      seek(m, 0.97, variants.at(-1));
      seek(m, 0.03, variants[0]);
      seek(m, t, params);
      assert.equal(
        snapshot(m),
        expected,
        "Seeking must reconstruct geometry without stale branch state",
      );
      assert.deepEqual(
        resourceSet(m),
        resources,
        "Updates must not replace GPU resources",
      );
    }
  }
}
console.log(
  "regulation science: 3 issues verified against actual geometry, both controls and deterministic seeks",
);

// Independent peer findings also require cross-parameter strand clearance.
await import("./duplexGeometry.test.mjs");
