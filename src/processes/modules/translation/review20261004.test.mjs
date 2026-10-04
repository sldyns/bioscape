import assert from "node:assert/strict";
import * as THREE from "three";
import { processesByRoot } from "../../catalog.js";
import translation from "./translationProcess.js";
import folding from "./proteinFoldingProcess.js";
import splicing from "./alternativeSplicingProcess.js";
import nitrogen from "./nitrogenFixationProcess.js";

const roots = (id) =>
  Object.entries(processesByRoot)
    .filter(([, ids]) => ids.includes(id))
    .map(([root]) => root);
const position = (o) => o.getWorldPosition(new THREE.Vector3());
function visible(o) {
  assert(o, "missing molecular object");
  for (let n = o; n; n = n.parent) if (!n.visible) return false;
  return true;
}
function attached(bond, a, b) {
  const ends = [-0.5, 0.5].map((y) =>
    bond.localToWorld(new THREE.Vector3(0, y, 0)),
  );
  const match = (p, q) => p.distanceTo(q) < 1e-6;
  assert(
    (match(ends[0], a) && match(ends[1], b)) ||
      (match(ends[0], b) && match(ends[1], a)),
    `${bond.name}: detached endpoint`,
  );
}
function rightHanded(points) {
  assert(points.length > 6, "insufficient helix geometry");
  for (let i = 0; i < points.length - 3; i++) {
    const a = points[i + 1].clone().sub(points[i]),
      b = points[i + 2].clone().sub(points[i + 1]),
      c = points[i + 3].clone().sub(points[i + 2]);
    assert(a.dot(b.cross(c)) > 1e-10, "left-handed alpha helix");
  }
}
// Calibrate the sign with a known right-handed curve and its mirror.
const control = Array.from(
  { length: 12 },
  (_, i) => new THREE.Vector3(i * 0.2, Math.cos(i * 0.2), Math.sin(i * 0.2)),
);
rightHanded(control);
assert.throws(
  () => rightHanded(control.map((p) => new THREE.Vector3(p.x, -p.y, p.z))),
  /left-handed/,
);
function tubeCenters(mesh) {
  // Average actual TubeGeometry ring vertices, not a name or metadata flag.
  const { radialSegments, tubularSegments } = mesh.geometry.parameters,
    attr = mesh.geometry.attributes.position,
    points = [];
  for (let j = 3; j < tubularSegments - 3; j++) {
    const p = new THREE.Vector3();
    for (let i = 0; i < radialSegments; i++)
      p.add(
        new THREE.Vector3().fromBufferAttribute(
          attr,
          j * (radialSegments + 1) + i,
        ),
      );
    points.push(mesh.localToWorld(p.multiplyScalar(1 / radialSegments)));
  }
  return points;
}
function state(s) {
  s.group.updateMatrixWorld(true);
  const values = [];
  s.group.traverse((o) => {
    values.push(
      o.uuid,
      o.visible,
      ...o.matrix.elements,
      o.material?.color?.getHex(),
    );
    if (o.isInstancedMesh) values.push(...o.instanceMatrix.array);
  });
  return JSON.stringify([values, s.labels, s.group.userData]);
}
function inventory(s) {
  const values = [];
  s.group.traverse((o) =>
    values.push(o.uuid, o.geometry?.uuid, o.material?.uuid),
  );
  return values;
}
function seekAndInventory(s, condition) {
  const before = inventory(s);
  s.update(0.615, condition);
  const saved = state(s);
  for (const p of [0, 0.989999, 0.99, 1, 0.339999, 0.59, 0.24, 0.615]) {
    s.update(p, condition);
    s.group.updateMatrixWorld(true);
    assert.deepEqual(inventory(s), before, "update changed resource inventory");
    s.group.traverse((o) => {
      for (const x of o.matrixWorld.elements) assert(Number.isFinite(x));
      if (o.isInstancedMesh)
        for (const x of o.instanceMatrix.array) assert(Number.isFinite(x));
    });
  }
  assert.equal(state(s), saved, "irregular seeking changed final state");
}

function retainedTranslationComplex(s) {
  for (const name of ["A-tRNA", "release-factor-symbol"])
    assert(visible(s.group.getObjectByName(name)), `${name}: terminal pop`);
}
for (const rootId of roots(translation.id)) {
  const s = translation.create({ rootId });
  let previous;
  for (const p of [0.989999, 0.99, 0.999999, 1]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    retainedTranslationComplex(s);
    const pose = [
      "A-tRNA-3prime-CCA",
      "A-tRNA-anticodon",
      "release-factor-symbol",
    ].map((name) => position(s.group.getObjectByName(name)).toArray());
    if (previous)
      assert.deepEqual(pose, previous, "terminal complex moved abruptly");
    previous = pose;
  }
  seekAndInventory(s, {});
}
const terminalMutation = translation.create();
terminalMutation.update(0.99);
terminalMutation.group.getObjectByName("A-tRNA").visible = false;
assert.throws(
  () => retainedTranslationComplex(terminalMutation),
  /terminal pop/,
);

for (const rootId of roots(folding.id)) {
  const s = folding.create({ rootId });
  for (const cycle of ["complete", "hold"]) {
    for (const p of [0, 0.23, 0.34, 0.5, 0.69, 0.83, 0.94, 1]) {
      s.update(p, { cycle });
      s.group.updateMatrixWorld(true);
      for (let j = 0; j < 3; j++)
        rightHanded(
          tubeCenters(s.group.getObjectByName(`Hsp70-lid-helix-${j}`)),
        );
      if (cycle === "complete" && p >= 0.94)
        rightHanded(
          Array.from({ length: 24 }, (_, i) =>
            position(s.group.getObjectByName(`folding-chain-residue-${i}`)),
          ),
        );
      for (let i = 0; i < 75; i++)
        attached(
          s.group.getObjectByName(`folding-chain-backbone-${i}`),
          position(s.group.getObjectByName(`folding-chain-residue-${i}`)),
          position(s.group.getObjectByName(`folding-chain-residue-${i + 1}`)),
        );
    }
    seekAndInventory(s, { cycle });
  }
}
const foldMutation = folding.create();
foldMutation.update(1, { cycle: "complete" });
const oldHandedness = Array.from({ length: 24 }, (_, i) => {
  const p = position(
    foldMutation.group.getObjectByName(`folding-chain-residue-${i}`),
  );
  p.y = 0.9 - p.y;
  return p;
});
assert.throws(() => rightHanded(oldHandedness), /left-handed/);

function verifySplicing(s, p, isoform) {
  const skip = isoform === "skip",
    bead = (i) => position(s.group.getObjectByName(`splice-rna-residue-${i}`)),
    pairs = skip
      ? [[15, 65]]
      : [
          [15, 32],
          [48, 65],
        ],
    branches = skip
      ? [[16, 54]]
      : [
          [16, 28],
          [49, 61],
        ];
  for (let i = 0; i < 80; i++) {
    const link = s.group.getObjectByName(`splice-rna-backbone-${i}`);
    if (visible(link)) attached(link, bead(i), bead(i + 1));
  }
  for (let j = 0; j < 2; j++) {
    const branch = s.group.getObjectByName(`splice-branch-bond-${j}`),
      junction = s.group.getObjectByName(`splice-exon-junction-${j}`);
    assert.equal(visible(branch), p >= 0.34 && j < branches.length);
    assert.equal(visible(junction), p >= 0.59 && j < pairs.length);
    if (j < branches.length) {
      const [a, b] = branches[j];
      // The substrates are already adjacent before the first bond exchange.
      if (p >= 0.33)
        assert(bead(a).distanceTo(bead(b)) < 0.100001, "remote branch bond");
      if (visible(branch)) attached(branch, bead(a), bead(b));
    }
    if (j < pairs.length) {
      const [a, b] = pairs[j];
      // This also rejects a correct final frame reached through a long tether.
      if (p >= 0.56)
        assert(bead(a).distanceTo(bead(b)) < 0.100001, "remote exon ligation");
      if (visible(junction)) attached(junction, bead(a), bead(b));
    }
  }
  const donors = skip ? [15] : [15, 48],
    acceptors = skip ? [64] : [31, 64];
  for (const i of donors) {
    const link = s.group.getObjectByName(`splice-rna-backbone-${i}`);
    assert.equal(visible(link), p < 0.34, "donor cleavage order");
    if (visible(link))
      assert(bead(i).distanceTo(bead(i + 1)) < 0.15, "stretched donor bond");
  }
  for (const i of acceptors) {
    const link = s.group.getObjectByName(`splice-rna-backbone-${i}`);
    assert.equal(visible(link), p < 0.59, "acceptor cleavage order");
    if (visible(link))
      assert(bead(i).distanceTo(bead(i + 1)) < 0.15, "stretched acceptor bond");
  }
}
for (const rootId of roots(splicing.id)) {
  const s = splicing.create({ rootId });
  const samples = new Set([
    ...Array.from({ length: 201 }, (_, i) => i / 200),
    0.329999,
    0.33,
    0.339999,
    0.34,
    0.340001,
    0.349,
    0.559999,
    0.56,
    0.589999,
    0.59,
    0.590001,
    0.62,
    0.73,
    0.77,
  ]);
  for (const isoform of ["include", "skip"]) {
    for (const p of samples) {
      s.update(p, { isoform });
      s.group.updateMatrixWorld(true);
      verifySplicing(s, p, isoform);
    }
    seekAndInventory(s, { isoform });
  }
}
const spliceMutation = splicing.create();
spliceMutation.update(0.59, { isoform: "skip" });
spliceMutation.group.getObjectByName("splice-rna-residue-65").position.x += 4.3;
// Reattach both affected cylinders so this fault tests remote chemistry rather
// than merely triggering a detached-endpoint assertion.
for (const [name, a, b] of [
  ["splice-rna-backbone-65", 65, 66],
  ["splice-exon-junction-0", 15, 65],
]) {
  const bond = spliceMutation.group.getObjectByName(name),
    start = spliceMutation.group.getObjectByName(
      `splice-rna-residue-${a}`,
    ).position,
    end = spliceMutation.group.getObjectByName(
      `splice-rna-residue-${b}`,
    ).position,
    delta = end.clone().sub(start);
  bond.position.copy(start).add(end).multiplyScalar(0.5);
  bond.scale.y = delta.length();
  bond.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.normalize(),
  );
}
spliceMutation.group.updateMatrixWorld(true);
assert.throws(
  () => verifySplicing(spliceMutation, 0.59, "skip"),
  /remote exon ligation/,
);

function nitrogenAtoms(s) {
  const atoms = [];
  s.group.traverse((o) => {
    if (
      o.geometry?.type === "SphereGeometry" &&
      o.material?.color?.getHex() === 0x7f9dbd &&
      visible(o)
    )
      atoms.push(o);
  });
  assert.equal(atoms.length, 2, "nitrogen atom duplicated or lost");
  return atoms;
}
for (const rootId of roots(nitrogen.id)) {
  const s = nitrogen.create({ rootId });
  const originalIds = nitrogenAtoms(s).map((o) => o.uuid);
  for (const oxygen of ["protected", "exposed"]) {
    const samples = new Set([
      ...Array.from({ length: 101 }, (_, i) => i / 100),
      0.79999999,
      0.8,
      0.80000001,
      0.805,
      0.80999999,
      0.81,
      0.81000001,
    ]);
    for (const p of samples) {
      s.update(p, { oxygen });
      s.group.updateMatrixWorld(true);
      assert.deepEqual(
        nitrogenAtoms(s).map((o) => o.uuid),
        originalIds,
        "nitrogen identity replaced",
      );
      const forming = oxygen === "protected" && p > 0.8;
      for (let i = 0; i < 2; i++) {
        const product = s.group.getObjectByName(`ammonia-product-${i}`);
        assert.equal(visible(product), forming);
        if (forming)
          assert(
            position(product).distanceTo(
              position(s.group.getObjectByName(`nitrogen-atom-${i}`)),
            ) < 1e-8,
          );
      }
      assert.equal(
        visible(s.group.getObjectByName("hydrogen-coproduct")),
        forming,
      );
      assert.equal(
        visible(s.group.getObjectByName("dinitrogen-bond-symbol")),
        oxygen === "exposed" || p < 0.8,
      );
    }
    seekAndInventory(s, { oxygen });
  }
  s.update(0.8 - 1e-8, { oxygen: "protected" });
  const before = nitrogenAtoms(s).map((o) => ({
    position: position(o),
    radius: o.scale.x,
  }));
  s.update(0.8 + 1e-8, { oxygen: "protected" });
  nitrogenAtoms(s).forEach((o, i) => {
    assert(
      position(o).distanceTo(before[i].position) < 1e-6,
      "nitrogen position jumps at conversion",
    );
    assert(
      Math.abs(o.scale.x - before[i].radius) < 1e-6,
      "nitrogen size jumps at conversion",
    );
  });
}
const nitrogenMutation = nitrogen.create();
nitrogenMutation.update(0.805);
nitrogenMutation.group.add(
  nitrogenMutation.group.getObjectByName("nitrogen-atom-0").clone(),
);
assert.throws(
  () => nitrogenAtoms(nitrogenMutation),
  /nitrogen atom duplicated/,
);
console.log(
  "PASS: 2026-10-04 translation group: terminal hold, actual helix chirality, adjacent splice chemistry, conserved nitrogen identity; all registered roots and controls; mutation rejection and deterministic seeking.",
);
