import assert from "node:assert/strict";
import * as THREE from "three";
import crispr from "./crisprProcess.js";
import sos from "./bacterialRepairProcess.js";

// Closest points on CLOSED segments, with independent parameters s and t.
// A cylinder is contained by its centerline capsule. Disjoint capsules therefore
// prove disjoint rendered cylinder volumes, without using nearest mesh vertices.
function segmentDistance(a, b, c, d) {
  const ux = b[0] - a[0],
    uy = b[1] - a[1],
    uz = b[2] - a[2];
  const vx = d[0] - c[0],
    vy = d[1] - c[1],
    vz = d[2] - c[2];
  const wx = a[0] - c[0],
    wy = a[1] - c[1],
    wz = a[2] - c[2];
  const aa = ux * ux + uy * uy + uz * uz,
    bb = ux * vx + uy * vy + uz * vz,
    cc = vx * vx + vy * vy + vz * vz;
  const dd = ux * wx + uy * wy + uz * wz,
    ee = vx * wx + vy * wy + vz * wz;
  let s = 0,
    t = 0;
  if (aa < 1e-20) t = cc > 1e-20 ? Math.max(0, Math.min(1, ee / cc)) : 0;
  else if (cc < 1e-20) s = Math.max(0, Math.min(1, -dd / aa));
  else {
    const denominator = aa * cc - bb * bb;
    if (denominator > 1e-20)
      s = Math.max(0, Math.min(1, (bb * ee - cc * dd) / denominator));
    t = (bb * s + ee) / cc;
    if (t < 0) {
      t = 0;
      s = Math.max(0, Math.min(1, -dd / aa));
    } else if (t > 1) {
      t = 1;
      s = Math.max(0, Math.min(1, (bb - dd) / aa));
    }
  }
  return Math.hypot(
    wx + s * ux - t * vx,
    wy + s * uy - t * vy,
    wz + s * uz - t * vz,
  );
}
assert.equal(
  segmentDistance([0, 0, 0], [4, 0, 0], [1, -3, 0], [1, 1, 0]),
  0,
  "independent closest parameters .25 and .75",
);
assert.equal(
  segmentDistance([0, 0, 0], [0, 0, 0], [1, 0, 0], [3, 0, 0]),
  1,
  "degenerate point segment",
);

function line(mesh) {
  const a = mesh.localToWorld(new THREE.Vector3(0, -0.5, 0)).toArray();
  const b = mesh.localToWorld(new THREE.Vector3(0, 0.5, 0)).toArray();
  const scale = mesh.getWorldScale(new THREE.Vector3());
  return { a, b, r: Math.max(scale.x, scale.z), mesh };
}
function nucleotides(scene, name) {
  const mesh = scene.group.getObjectByName(name);
  assert.ok(mesh, name);
  mesh.geometry.computeBoundingSphere();
  const baseRadius = mesh.geometry.boundingSphere.radius;
  return Array.from({ length: mesh.count }, (_, i) => {
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(i, matrix);
    matrix.premultiply(mesh.matrixWorld);
    const center = new THREE.Vector3().setFromMatrixPosition(matrix).toArray();
    const scale = new THREE.Vector3().setFromMatrixScale(matrix);
    return {
      a: center,
      b: center,
      r: baseRadius * Math.max(scale.x, scale.y, scale.z),
    };
  });
}
function possible(a, b) {
  const gap = Math.max(
    Math.min(a.a[0], a.b[0]) - Math.max(b.a[0], b.b[0]),
    Math.min(b.a[0], b.b[0]) - Math.max(a.a[0], a.b[0]),
  );
  return gap <= a.r + b.r + 0.001;
}
const cases = [
  {
    def: crispr,
    prefix: "Cas9 DNA backbone",
    n: 52,
    controls: ["matched", "mismatch", "noPam"],
    key: "target",
    phosphate: (s) => `DNA strand ${s} phosphates`,
    sugar: (s) => `DNA strand ${s} deoxyribose`,
  },
  {
    def: sos,
    prefix: "SOS DNA backbone",
    n: 60,
    controls: ["wildtype", "noncleavable"],
    key: "lexA",
    phosphate: (s) => `SOS locus strand ${s} phosphates`,
    sugar: (s) => `SOS locus strand ${s} sugars`,
  },
];
for (const item of cases) {
  const scene = item.def.create();
  const rows = [0, 1].map((s) =>
    Array.from({ length: item.n }, (_, i) => {
      const m = scene.group.getObjectByName(`${item.prefix} ${s} ${i}`);
      assert.ok(m);
      return m;
    }),
  );
  for (const condition of item.controls) {
    let minDNA = Infinity,
      minMargin = Infinity,
      checked = 0;
    for (let frame = 0; frame <= 1000; frame++) {
      const p = frame / 1000;
      scene.update(p, { [item.key]: condition });
      scene.group.updateMatrixWorld(true);
      const rails = rows.map((row) =>
        row.map((m) => (m.visible ? line(m) : null)),
      );
      const nodes = [0, 1].map((s) => [
        ...nucleotides(scene, item.phosphate(s)),
        ...nucleotides(scene, item.sugar(s)),
      ]);
      const check = (a, b, context, track = false) => {
        if (!possible(a, b)) return;
        const distance = segmentDistance(a.a, a.b, b.a, b.b),
          margin = distance - a.r - b.r;
        assert.ok(
          margin > 1e-6,
          `${item.def.id}/${condition} p=${p} ${context}: distance=${distance}, radii=${a.r + b.r}`,
        );
        minMargin = Math.min(minMargin, margin);
        if (track) minDNA = Math.min(minDNA, distance);
        checked++;
      };
      // Every i,j is considered, using only a proven disjoint x envelope to skip.
      for (let i = 0; i < item.n; i++)
        for (let j = 0; j < item.n; j++)
          if (rails[0][i] && rails[1][j])
            check(
              rails[0][i],
              rails[1][j],
              `cross-strand tubes ${i}/${j}`,
              true,
            );
      for (let s = 0; s < 2; s++) {
        for (let i = 0; i < item.n; i++)
          for (let j = i + 2; j < item.n; j++)
            if (rails[s][i] && rails[s][j])
              check(
                rails[s][i],
                rails[s][j],
                `nonadjacent self tubes ${s}:${i}/${j}`,
              );
        for (let i = 0; i < nodes[s].length; i++) {
          for (let j = 0; j < item.n; j++)
            if (rails[1 - s][j])
              check(
                nodes[s][i],
                rails[1 - s][j],
                `phosphate/sugar to opposite tube ${s}:${i}/${j}`,
              );
          // Same-strand covalent endpoints are expected to intersect their incident bond.
          const nucleotideIndex = i % (item.n + 1);
          for (let j = 0; j < item.n; j++)
            if (
              rails[s][j] &&
              j !== nucleotideIndex &&
              j + 1 !== nucleotideIndex
            )
              check(
                nodes[s][i],
                rails[s][j],
                `nonincident own nucleotide/tube ${s}:${i}/${j}`,
              );
        }
      }
      for (let i = 0; i < nodes[0].length; i++)
        for (let j = 0; j < nodes[1].length; j++)
          check(
            nodes[0][i],
            nodes[1][j],
            `opposite nucleotide envelopes ${i}/${j}`,
          );
    }
    console.log(
      `${item.def.id}/${condition}: 1001 frames, independent segment parameters, self/cross tube and sugar/phosphate envelopes PASS; min DNA distance=${minDNA.toFixed(6)}, min tested envelope margin=${minMargin.toFixed(6)}, comparisons=${checked}`,
    );
  }
}
