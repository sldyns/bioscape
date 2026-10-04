import assert from "node:assert/strict";
import * as THREE from "three";
import { build } from "esbuild";
import auxin from "./auxinProcess.js";
import defense from "./plantDefenseProcess.js";
import pocket from "./2p1q-pocket.json" with { type: "json" };
import { helix } from "./structures.js";
import { sceneKit } from "../../kit.js";

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

// 2026-10-04: protein helices must retain experimental handedness. These are
// deposited 2P1Q chain-A CA coordinates, residues 19-22 in HELIX 1 (class 1).
function handedness(points) {
  const a = points[1].clone().sub(points[0]),
    b = points[2].clone().sub(points[1]),
    c = points[3].clone().sub(points[2]);
  return a.cross(b).dot(c);
}
const referenceHelix = [
  [26.866, -175.921, -38.112],
  [30.21, -174.558, -36.979],
  [29.375, -170.989, -38.108],
  [26.196, -171.048, -35.991],
].map((p) => new THREE.Vector3(...p));
assert(handedness(referenceHelix) > 0);
for (const [from, to, radius, turns] of [
  [[0, -0.37, 0], [0, 0.43, 0], 0.072, 6],
  [[0.2, -0.7, 0.8], [0.9, 0.5, -0.2], 0.04, 3],
]) {
  const k = sceneKit(),
    h = helix(k, k.group, from, to, radius, k.material("#65958e"), turns);
  k.group.updateMatrixWorld(true);
  const points = h.geometry.parameters.path.points.map((p) =>
    p.clone().applyMatrix4(h.matrixWorld),
  );
  assert(
    handedness(points) > 0,
    "20261004-plantSignals-01: right-handed helix",
  );
  const radial = new THREE.Vector3(radius, 0, 0).applyQuaternion(h.quaternion);
  for (const [point, end] of [
    [points[0], from],
    [points.at(-1), to],
  ])
    assert(
      point.distanceTo(new THREE.Vector3(...end).add(radial)) < 1e-8,
      "helix handedness correction preserves its original endpoints",
    );
}
for (const model of [auxin, defense]) {
  const s = model.create();
  s.update(0.4);
  world(s);
  let count = 0;
  s.group.traverse((o) => {
    const parameters = o.geometry?.parameters;
    if (
      parameters?.tubularSegments !== 96 ||
      parameters.path?.points?.length !== 65
    )
      return;
    const points = parameters.path.points
      .slice(0, 4)
      .map((p) => p.clone().applyMatrix4(o.matrixWorld));
    assert(handedness(points) > 0, "every drawn helper helix is right-handed");
    count++;
  });
  assert(count > 20);
  console.log(
    "20261004-plantSignals-01:",
    model.id,
    count,
    "right-handed helices PASS",
  );
}

// The low-auxin partner domains meet at surfaces, instead of one swallowing
// the other. Also inspect the departure interval to preserve that separation.
const correctedAuxin = auxin.create(),
  body = correctedAuxin.group.getObjectByName("aux-iaa-body"),
  pb1 = correctedAuxin.group.getObjectByName("arf-pb1");
assert(body && pb1);
for (const condition of ["low", "present"])
  for (const p of condition === "low"
    ? [0, 0.34, 0.7, 1]
    : [0, 0.14, 0.145, 0.15, 0.16, 0.18]) {
    correctedAuxin.update(p, { auxin: condition });
    world(correctedAuxin);
    const gap = contactGap(
      pb1,
      body,
      1,
      [-0.15, -0.1, -0.05, 0, 0.05],
      [-1.54, -1.5, -1.46, -1.42, -1.38],
    );
    assert(
      gap > -0.002,
      "20261004-plantSignals-02: no bulk PB1 interpenetration",
    );
    if (condition === "low" || p <= 0.14)
      assert(gap < 0.02, "repressed domains have an actual contact interface");
  }
console.log(
  "20261004-plantSignals-02: distinct touching ARF/Aux-IAA domains PASS",
);

const substrate = correctedAuxin.group.getObjectByName("unfolded-aux-iaa"),
  joints = correctedAuxin.group.getObjectByName("unfolded-aux-iaa-joints");
assert(substrate && joints);
function threadSample(p) {
  correctedAuxin.update(p, { auxin: "present" });
  world(correctedAuxin);
  const points = [],
    m = new THREE.Matrix4(),
    scale = new THREE.Vector3();
  for (let i = 0; i < joints.count; i++) {
    joints.getMatrixAt(i, m);
    points.push(
      new THREE.Vector3()
        .setFromMatrixPosition(m)
        .applyMatrix4(joints.matrixWorld),
    );
  }
  joints.getMatrixAt(0, m);
  scale.setFromMatrixScale(m);
  const length = points
    .slice(1)
    .reduce((sum, point, i) => sum + point.distanceTo(points[i]), 0);
  return {
    start: points[0],
    length: substrate.visible ? length : 0,
    radius: substrate.visible ? scale.x : 0,
  };
}
for (const p of [0.625, 0.635882638957527, 0.694117361042473, 0.7]) {
  const left = threadSample(p - 1e-7),
    right = threadSample(p + 1e-7);
  assert(
    Math.abs(left.length - right.length) < 1e-4,
    "20261004-plantSignals-03: strand cannot appear/disappear at finite length",
  );
  assert(Math.abs(left.radius - right.radius) < 1e-5);
}
for (let i = 0; i <= 20; i++) {
  const sample = threadSample(0.63 + i * 0.003);
  assert(
    sample.start.distanceTo(body.getWorldPosition(new THREE.Vector3())) < 1e-6,
    "substrate thread stays attached to remaining compact Aux/IAA",
  );
}
assert.equal(threadSample(0.7).length, 0);
const developedThread = threadSample(0.66);
assert(
  developedThread.length > 0.6 && developedThread.radius > 0.03,
  "the degradation strand remains fully depicted between transitions",
);
correctedAuxin.update(0.65, { auxin: "low" });
assert(!substrate.visible);
console.log(
  "20261004-plantSignals-03: continuous attached substrate reveal/consumption PASS",
);

const correctedDefense = defense.create(),
  flsEcto = correctedDefense.group.getObjectByName("fls2-ectodomain"),
  bakEcto = correctedDefense.group.getObjectByName("bak1-ectodomain"),
  flg22 = correctedDefense.group.getObjectByName("flg22");
assert(flsEcto && bakEcto && flg22);
for (let i = 0; i <= 32; i++) {
  const p = 0.34 + i * 0.005;
  correctedDefense.update(p, { ligand: "flg22" });
  world(correctedDefense);
  // Restrict to the closed main solids, not broad boxes or decorative helices.
  const gap = contactGap(
    flsEcto.children[0],
    bakEcto.children[0],
    2,
    [-3.18, -3.1, -3.02, -2.94, -2.86],
    [0.63, 0.71, 0.79, 0.87, 0.95, 1.03, 1.11, 1.19, 1.27, 1.35],
  );
  assert(
    gap > -0.002,
    "20261004-plantSignals-04: ectodomain solids cannot overlap",
  );
  if (p >= 0.48)
    assert(gap < 0.02, "docked FLS2 and BAK1 ectodomains meet at surfaces");
}
function ligandSurfaceGaps(partner) {
  const surface = [];
  partner.traverse((o) => {
    if (o.geometry) surface.push(...triangles(o));
  });
  const closest = new THREE.Vector3();
  return flg22.children
    .filter((o) => o.geometry?.type === "SphereGeometry")
    .map((o) => {
      const center = o.getWorldPosition(new THREE.Vector3()),
        radius = o.getWorldScale(new THREE.Vector3()).x;
      let gap = Infinity;
      for (const triangle of surface) {
        triangle.closestPointToPoint(center, closest);
        gap = Math.min(gap, closest.distanceTo(center) - radius);
      }
      return gap;
    });
}
const flsLigandGaps = ligandSurfaceGaps(flsEcto),
  bakLigandGaps = ligandSurfaceGaps(bakEcto);
assert(
  flsLigandGaps.every((gap) => gap < 0.02 && gap > -0.02),
  "flg22 follows and contacts the FLS2 inner surface along its length",
);
assert(
  bakLigandGaps.filter((gap) => Math.abs(gap) < 0.025).length >= 3,
  "BAK1 also contacts the FLS2-bound peptide",
);
console.log(
  "20261004-plantSignals-04: separated ectodomains and both ligand interfaces PASS",
);

for (let i = 0; i < 5; i++)
  for (let cycle = 1; cycle <= 3; cycle++) {
    const p = (cycle - i / 5) / 2.6;
    if (p <= 0.7 || p > 1) continue;
    const electron = correctedDefense.group.getObjectByName(
      `rbohd-electron-${i}`,
    );
    for (const near of [p - 1e-7, p, p + 1e-7]) {
      correctedDefense.update(near, { ligand: "flg22" });
      assert(
        electron.scale.x < 1e-9,
        "20261004-plantSignals-05: electron can reset only at zero visible size",
      );
    }
  }
for (const p of [0.7, 0.700001]) {
  correctedDefense.update(p, { ligand: "flg22" });
  for (let i = 0; i < 5; i++)
    assert(
      correctedDefense.group.getObjectByName(`rbohd-electron-${i}`).scale.x <
        1e-12,
      "induced electron flow begins at zero visible weight",
    );
}
correctedDefense.update(0.8, { ligand: "flg22" });
assert(
  Array.from({ length: 5 }, (_, i) =>
    correctedDefense.group.getObjectByName(`rbohd-electron-${i}`),
  ).filter((e) => e.visible && e.scale.x > 0.03).length >= 3,
  "active electron flow remains visible between resets",
);
for (const p of [0.7, 0.700001, 0.9]) {
  correctedDefense.update(p, { ligand: "absent" });
  for (let i = 0; i < 5; i++)
    assert(
      !correctedDefense.group.getObjectByName(`rbohd-electron-${i}`).visible,
    );
}
console.log(
  "20261004-plantSignals-05: smooth electron onset and invisible wrap resets PASS",
);

// Rendered review: named leaders must end on their current molecular/instance
// surface. Context-only compartment labels deliberately remain in empty space.
const localSurfaces = new WeakMap();
function annotationSurfaceDistance(position, mesh) {
  if (!localSurfaces.has(mesh.geometry)) {
    const geometry = mesh.geometry,
      vertices = geometry.attributes.position,
      index = geometry.index,
      surface = [];
    for (let i = 0; i < (index ? index.count : vertices.count); i += 3) {
      const triangle = new THREE.Triangle();
      for (const [v, j] of [
        [triangle.a, 0],
        [triangle.b, 1],
        [triangle.c, 2],
      ])
        v.fromBufferAttribute(vertices, index ? index.getX(i + j) : i + j);
      surface.push(triangle);
    }
    geometry.computeBoundingBox();
    localSurfaces.set(geometry, {
      surface,
      bounds: geometry.boundingBox.clone().expandByScalar(1e-4),
    });
  }
  const { surface, bounds } = localSurfaces.get(mesh.geometry),
    instance = new THREE.Matrix4(),
    matrix = new THREE.Matrix4(),
    inverse = new THREE.Matrix4(),
    point = new THREE.Vector3(...position),
    local = new THREE.Vector3(),
    closest = new THREE.Vector3();
  let distance = Infinity;
  for (let i = 0; i < (mesh.isInstancedMesh ? mesh.count : 1); i++) {
    matrix.copy(mesh.matrixWorld);
    if (mesh.isInstancedMesh) {
      mesh.getMatrixAt(i, instance);
      matrix.multiply(instance);
    }
    if (Math.abs(matrix.determinant()) < 1e-15) continue;
    inverse.copy(matrix).invert();
    local.copy(point).applyMatrix4(inverse);
    if (!bounds.containsPoint(local)) continue;
    for (const triangle of surface) {
      triangle.closestPointToPoint(local, closest);
      distance = Math.min(
        distance,
        closest.applyMatrix4(matrix).distanceTo(point),
      );
    }
  }
  return distance;
}
const renderAuxin = auxin.create(),
  renderDefense = defense.create();
const proteasomeFront = renderAuxin.group
  .getObjectByName("26s-proteasome")
  .children.filter((o) => o.geometry?.type === "SphereGeometry")
  .reduce(
    (front, o) => (!front || o.position.z > front.position.z ? o : front),
    null,
  );
const insetWall = renderAuxin.group.getObjectByName("shoot-cell-wall-1-2");
const annotationTargets = [
  [
    auxin,
    renderAuxin,
    "20261004-plantSignals-06",
    [
      [0, renderAuxin.group.getObjectByName("tir1-pocket-surface")],
      [1, proteasomeFront],
      [2, renderAuxin.group.getObjectByName("arf-dna-domain").children[0]],
      [3, renderAuxin.group.getObjectByName("aux-iaa-body").children[0]],
      [4, renderAuxin.group.getObjectByName("auxin-nascent-RNA-nucleotides")],
      [5, insetWall],
      [7, renderAuxin.group.getObjectByName("auxin-2p1q-atoms")],
    ],
  ],
  [
    defense,
    renderDefense,
    "20261004-plantSignals-07",
    [
      [2, renderDefense.group.getObjectByName("fls2-ectodomain").children[0]],
      [3, renderDefense.group.getObjectByName("bak1-ectodomain").children[0]],
      [4, renderDefense.group.getObjectByName("bik1-domain").children[0]],
      [5, renderDefense.group.getObjectByName("rbohd-fad-domain").children[0]],
      [6, renderDefense.group.getObjectByName("flg22").children[9]],
      [7, renderDefense.group.getObjectByName("apoplastic-ros-0").children[1]],
      [8, renderDefense.group.getObjectByName("nadph-donor").children[0]],
      [9, renderDefense.group.getObjectByName("membrane-1-phosphate-heads")],
    ],
  ],
];
for (const [model, s, issue, targets] of annotationTargets) {
  let maxDistance = 0,
    checked = 0;
  for (const option of model.controls[0].options) {
    const params = { [model.controls[0].id]: option.value };
    for (const p of [0, 0.175, 0.355, 0.525, 0.65, 0.715, 0.725, 0.895, 1]) {
      s.update(p, params);
      world(s);
      for (const [index, target] of targets) {
        const label = s.labels[index];
        if (label.active === false) continue;
        for (let current = target; current; current = current.parent)
          assert(
            current.visible,
            `${issue}: an active label cannot target a hidden object`,
          );
        const distance = annotationSurfaceDistance(label.position, target);
        assert(
          distance < 1e-6,
          `${issue}: ${label.text.en} misses its actual surface by ${distance}`,
        );
        maxDistance = Math.max(maxDistance, distance);
        checked++;
      }
      const expected = JSON.stringify(s.labels);
      s.update(0.93, params);
      s.update(0.04, params);
      s.update(p, params);
      assert.equal(
        JSON.stringify(s.labels),
        expected,
        `${issue}: anchors must support arbitrary seeking`,
      );
      if (model.id === "auxin") {
        const low = option.value === "low";
        if (low) {
          assert.equal(s.labels[7].active, false);
          assert.equal(s.labels[4].active, false);
          assert.equal(s.labels[3].active, true);
        }
        if (!low && p >= 0.715) assert.equal(s.labels[3].active, false);
        const [x, y] = s.labels[6].position;
        assert(
          ((x + 1.05) / (3.35 * 1.08)) ** 2 +
            ((y + 0.05) / (3.35 * 0.94)) ** 2 <
            1,
          "nuclear context caption anchors inside the schematic nuclear region",
        );
      } else {
        assert(
          s.labels[0].position[1] > 0.24 && s.labels[1].position[1] < -0.24,
          "apoplast/cytosol captions name their regions, not protein surfaces",
        );
        if (option.value === "absent")
          for (const i of [6, 7, 8]) assert.equal(s.labels[i].active, false);
        if (p <= 0.715)
          assert.equal(
            s.labels[7].active,
            false,
            "no ROS label before represented output",
          );
      }
    }
  }
  console.log(
    issue,
    ":",
    checked,
    "active anchors on triangles; max world gap",
    maxDistance,
    "PASS",
  );
}
