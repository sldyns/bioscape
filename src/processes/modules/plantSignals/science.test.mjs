import assert from "node:assert/strict";
import * as THREE from "three";
import { build } from "esbuild";
import auxin from "./auxinProcess.js";
import defense from "./plantDefenseProcess.js";
import pocket from "./2p1q-pocket.json" with { type: "json" };

const world = (s) => s.group.updateMatrixWorld(true);
function triangles(mesh) {
  const result = [],
    p = mesh.geometry.attributes.position,
    index = mesh.geometry.index,
    instance = new THREE.Matrix4(),
    matrix = new THREE.Matrix4();
  for (let j = 0; j < (mesh.isInstancedMesh ? mesh.count : 1); j++) {
    if (mesh.isInstancedMesh) {
      mesh.getMatrixAt(j, instance);
      matrix.multiplyMatrices(mesh.matrixWorld, instance);
    } else matrix.copy(mesh.matrixWorld);
    for (let i = 0; i < (index ? index.count : p.count); i += 3) {
      const t = new THREE.Triangle();
      for (const [v, q] of [
        [t.a, 0],
        [t.b, 1],
        [t.c, 2],
      ])
        v.fromBufferAttribute(
          p,
          index ? index.getX(i + q) : i + q,
        ).applyMatrix4(matrix);
      result.push(t);
    }
  }
  return result;
}
function atomSurfaceGaps(atomMesh, targetMesh) {
  const ts = triangles(targetMesh),
    matrix = new THREE.Matrix4(),
    combined = new THREE.Matrix4(),
    center = new THREE.Vector3(),
    scale = new THREE.Vector3(),
    q = new THREE.Quaternion(),
    closest = new THREE.Vector3(),
    gaps = [];
  for (let i = 0; i < atomMesh.count; i++) {
    atomMesh.getMatrixAt(i, matrix);
    combined.multiplyMatrices(atomMesh.matrixWorld, matrix);
    combined.decompose(center, q, scale);
    let d = Infinity;
    for (const t of ts) {
      t.closestPointToPoint(center, closest);
      d = Math.min(d, closest.distanceTo(center));
    }
    gaps.push(d - scale.x);
  }
  return gaps;
}
const a = auxin.create();
a.update(0.4, { auxin: "present" });
world(a);
const protein = a.group.getObjectByName("tir1-pocket-surface"),
  ligand = a.group.getObjectByName("auxin-2p1q-atoms"),
  degron = a.group.getObjectByName("iaa7-degron");
assert(
  protein && ligand && degron,
  "experimental ternary partner meshes are required",
);
for (const [mesh, key] of [
  [protein, "tir1"],
  [ligand, "auxin"],
  [degron, "degron"],
]) {
  assert.equal(mesh.count, pocket[key].length);
  const matrix = new THREE.Matrix4(),
    p = new THREE.Vector3();
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, matrix);
    p.setFromMatrixPosition(matrix).applyMatrix4(mesh.matrixWorld);
    const expected = pocket.basis.map(
      (axis) =>
        axis.reduce(
          (n, v, j) => n + v * (pocket[key][i].xyz[j] - pocket.center[j]),
          0,
        ) * pocket.scale,
    );
    expected[0] -= 2.3;
    expected[1] += 1.25;
    expected[2] += 0.15;
    assert(
      p.distanceTo(new THREE.Vector3(...expected)) < 1e-6,
      "all partners preserve one source coordinate transform",
    );
  }
}
const receptorGaps = atomSurfaceGaps(ligand, protein),
  degronGaps = atomSurfaceGaps(ligand, degron);
assert(
  receptorGaps.filter((v) => v < 0.035).length >= 3,
  "IAA contacts receptor triangle surface",
);
assert(
  degronGaps.filter((v) => v < 0.04).length >= 2,
  "degron caps ligand at the shared site",
);
assert(
  Math.min(...receptorGaps) > -0.06,
  "no gross receptor–ligand interpenetration",
);
console.log(
  "plantSignals-01: common 2P1Q transform and triangle-surface ternary contacts PASS",
  Math.min(...receptorGaps).toFixed(5),
  Math.min(...degronGaps).toFixed(5),
);
const chain = a.group.getObjectByName("ubiquitin-chain"),
  ubiquitins = chain.children.filter((o) => /^ubiquitin-\d$/.test(o.name)),
  link = a.group.getObjectByName("ubiquitin-substrate-link");
assert.equal(ubiquitins.length, 4);
const ubIds = ubiquitins.map((o) => o.uuid);
for (let step = 48; step <= 80; step++) {
  a.update(step / 100, { auxin: "present" });
  world(a);
  assert(chain.visible);
  assert.deepEqual(
    ubiquitins.map((o) => o.uuid),
    ubIds,
  );
  for (const ub of ubiquitins) {
    const scale = ub.getWorldScale(new THREE.Vector3());
    assert(
      Math.abs(scale.x - 0.085) < 1e-8,
      "ubiquitin does not shrink with substrate",
    );
  }
  if (step >= 63)
    assert(!link.visible, "recycled chain has no substrate attachment");
}
assert.equal(
  a.group.children.filter((o) => o.name === "ubiquitin-chain").length,
  1,
);
a.update(0.7, { auxin: "low" });
assert(!chain.visible);
console.log(
  "plantSignals-02: same four ubiquitins, fixed physical scale, exclusive attachment/recycling PASS",
);

// Ray/triangle intersections inspect an actual common protein interface; this
// is not an AABB overlap or a metadata-only claim. Distances are schematic units.
function contactGap(g1, g2, axis, range1, range2) {
  const ray = new THREE.Raycaster(),
    dir = new THREE.Vector3(),
    origin = new THREE.Vector3(),
    saved = new Map();
  dir.setComponent(axis, 1);
  for (const g of [g1, g2])
    g.traverse((o) => {
      if (o.material && !saved.has(o.material)) {
        saved.set(o.material, o.material.side);
        o.material.side = THREE.DoubleSide;
      }
    });
  let gap = Infinity;
  for (const u of range1)
    for (const v of range2) {
      origin.set(-5, -5, -5);
      origin.setComponent((axis + 1) % 3, u);
      origin.setComponent((axis + 2) % 3, v);
      ray.set(origin, dir);
      const hits1 = ray
          .intersectObject(g1, true)
          .map((h) => h.point.getComponent(axis)),
        hits2 = ray
          .intersectObject(g2, true)
          .map((h) => h.point.getComponent(axis));
      if (hits1.length && hits2.length)
        gap = Math.min(
          gap,
          Math.max(Math.min(...hits1), Math.min(...hits2)) -
            Math.min(Math.max(...hits1), Math.max(...hits2)),
        );
    }
  for (const [m, side] of saved) m.side = side;
  return gap;
}
const d = defense.create();
for (const [p, left, right, axis, r1, r2, mark] of [
  [
    0.49,
    "fls2-kinase",
    "bak1-kinase",
    0,
    [-0.7, -0.65, -0.6, -0.55],
    [-0.1, -0.05, 0],
    0,
  ],
  [
    0.51,
    "fls2-kinase",
    "bik1",
    1,
    [-0.12, -0.06, 0, 0.06],
    [-2.45, -2.4, -2.35, -2.3, -2.25, -2.2],
    2,
  ],
  [
    0.68,
    "bik1",
    "rbohd",
    0,
    [-1.1, -1, -0.95, -0.9, -0.85],
    [0.06, 0.1, 0.14, 0.18, 0.22],
    3,
  ],
]) {
  d.update(p, { ligand: "flg22" });
  world(d);
  const gap = contactGap(
    d.group.getObjectByName(left),
    d.group.getObjectByName(right),
    axis,
    r1,
    r2,
  );
  assert(
    gap < 0.02 && gap > -0.06,
    `${left}–${right} actual contact gap ${gap}`,
  );
  assert(d.group.getObjectByName(`phosphorylation-${mark}`).visible);
  d.update(p - 0.0001, { ligand: "flg22" });
  assert(
    !d.group.getObjectByName(`phosphorylation-${mark}`).visible,
    "mark appears only at completed contact step",
  );
  console.log(
    "plantSignals-03:",
    left,
    right,
    "interface PASS",
    gap.toFixed(5),
  );
}
for (const p of [0, 0.4, 0.49, 0.51, 0.68, 1]) {
  d.update(p, { ligand: "absent" });
  for (let i = 0; i < 5; i++)
    assert(!d.group.getObjectByName(`phosphorylation-${i}`).visible);
}
const matrix = new THREE.Matrix4(),
  position = new THREE.Vector3(),
  scale = new THREE.Vector3(),
  rotation = new THREE.Quaternion();
for (const condition of ["flg22", "absent"])
  for (let i = 0; i <= 100; i++) {
    d.update(i / 100, { ligand: condition });
    world(d);
    const bak = d.group.getObjectByName("bak1");
    assert(
      Math.abs(bak.position.z) + 0.1 < 0.61,
      "TM span remains within membrane patch",
    );
    for (const side of [-1, 1]) {
      const heads = d.group.getObjectByName(`membrane-${side}-phosphate-heads`);
      for (let j = 0; j < heads.count; j++) {
        heads.getMatrixAt(j, matrix);
        matrix.decompose(position, rotation, scale);
        const blocked =
          Math.hypot(position.x - bak.position.x, position.z - bak.position.z) <
          0.2;
        assert.equal(
          scale.x < 0.001,
          blocked,
          "only current BAK1 footprint excludes otherwise unoccupied lipids",
        );
      }
    }
  }
console.log(
  "plantSignals-04: both branches, 202 frames, membrane containment and vacated-hole refill PASS",
);

function snapshot(s) {
  world(s);
  const out = [];
  s.group.traverse((o) =>
    out.push([
      o.uuid,
      o.visible,
      o.matrix.toArray(),
      o.instanceMatrix ? Array.from(o.instanceMatrix.array) : null,
    ]),
  );
  return JSON.stringify(out);
}
for (const model of [auxin, defense]) {
  const s = model.create(),
    ids = [];
  s.group.traverse((o) =>
    ids.push([o.uuid, o.geometry?.uuid, o.material?.uuid]),
  );
  for (const option of model.controls[0].options) {
    const params = { [model.controls[0].id]: option.value };
    for (const p of [
      NaN,
      0,
      0.16,
      0.34,
      0.49,
      0.52,
      0.61,
      0.65,
      0.71,
      0.88,
      1,
    ]) {
      s.update(p, params);
      world(s);
      const current = [];
      s.group.traverse((o) => {
        current.push([o.uuid, o.geometry?.uuid, o.material?.uuid]);
        for (const buffer of [
          o.position.toArray(),
          o.quaternion.toArray(),
          o.scale.toArray(),
          o.geometry?.attributes.position.array ?? [],
          o.instanceMatrix?.array ?? [],
        ])
          assert([...buffer].every(Number.isFinite));
      });
      assert.deepEqual(current, ids);
      const size = new THREE.Box3()
        .setFromObject(s.group)
        .getSize(new THREE.Vector3());
      assert(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
    }
    s.update(0.65, params);
    const expected = snapshot(s);
    s.update(0, params);
    s.update(0.9, params);
    s.update(0.65, params);
    assert.equal(snapshot(s), expected);
  }
  await build({
    entryPoints: [new URL(`./${model.id}Process.js`, import.meta.url).pathname],
    bundle: true,
    write: false,
    platform: "browser",
    logLevel: "silent",
  });
  console.log(
    model.id,
    ": finite bounds/buffers, deterministic seeking, stable resources and esbuild PASS",
  );
}
