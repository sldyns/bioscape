import assert from "node:assert/strict";
import * as THREE from "three";
import lac from "./lacOperonProcess.js";
import trp from "./trpOperonProcess.js";
import gal from "./yeastGalProcess.js";
import hog from "./yeastOsmoregulationProcess.js";

const matrix = new THREE.Matrix4(),
  local = new THREE.Matrix4();
function segments(mesh) {
  const rows = [];
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, local);
    matrix.multiplyMatrices(mesh.matrixWorld, local);
    const a = new THREE.Vector3(0, -0.5, 0).applyMatrix4(matrix);
    const b = new THREE.Vector3(0, 0.5, 0).applyMatrix4(matrix);
    // The unit cylinder's true radial extent comes from its geometry and both
    // transformed radial axes. A swept sphere bounds its complete surface.
    const e = matrix.elements;
    const r =
      Math.max(
        mesh.geometry.parameters.radiusTop,
        mesh.geometry.parameters.radiusBottom,
      ) * Math.max(Math.hypot(e[0], e[1], e[2]), Math.hypot(e[8], e[9], e[10]));
    rows.push({ a, b, r });
  }
  return rows;
}
// Exact finite segment minimum: four clamped edge extrema plus the interior
// stationary point. s and t are independent, not a matching-index comparison.
function distanceSquared(p, q, a, b) {
  const ux = q.x - p.x,
    uy = q.y - p.y,
    uz = q.z - p.z,
    vx = b.x - a.x,
    vy = b.y - a.y,
    vz = b.z - a.z,
    wx = p.x - a.x,
    wy = p.y - a.y,
    wz = p.z - a.z;
  const A = ux * ux + uy * uy + uz * uz,
    B = ux * vx + uy * vy + uz * vz,
    C = vx * vx + vy * vy + vz * vz,
    D = ux * wx + uy * wy + uz * wz,
    E = vx * wx + vy * wy + vz * wz;
  const clamp = (x) => Math.min(1, Math.max(0, x));
  let best = Infinity;
  const check = (s, t) => {
    const x = wx + s * ux - t * vx,
      y = wy + s * uy - t * vy,
      z = wz + s * uz - t * vz;
    best = Math.min(best, x * x + y * y + z * z);
  };
  check(0, C ? clamp(E / C) : 0);
  check(1, C ? clamp((B + E) / C) : 0);
  check(A ? clamp(-D / A) : 0, 0);
  check(A ? clamp((B - D) / A) : 0, 1);
  const den = A * C - B * B;
  if (den > 1e-15) {
    const s = (B * E - C * D) / den,
      t = (A * E - B * D) / den;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) check(s, t);
  }
  return best;
}
const scenarios = (m) =>
  m.controls.reduce(
    (rows, c) =>
      rows.flatMap((r) => c.options.map((o) => ({ ...r, [c.id]: o.value }))),
    [{}],
  );
export function verifyDuplexClearance(model, frames = null) {
  const scene = model.create(),
    rails = [0, 1].map((i) => scene.group.getObjectByName(`DNA backbone ${i}`));
  assert(rails.every(Boolean));
  let minimumMargin = Infinity;
  const times = frames ?? [
    ...Array.from({ length: 1001 }, (_, i) => i / 1000),
    0.7385,
  ];
  for (const params of scenarios(model))
    for (const progress of times) {
      scene.update(progress, params);
      scene.group.updateMatrixWorld(true);
      const paths = rails.map(segments);
      for (const path of paths)
        for (let i = 1; i < path.length; i++)
          assert(
            path[i - 1].b.distanceTo(path[i].a) < 2e-6,
            "material backbone segments must stay connected",
          );
      for (let i = 0; i < paths[0].length; i++)
        for (let j = 0; j < paths[1].length; j++) {
          const p = paths[0][i],
            q = paths[1][j],
            required = p.r + q.r + 0.001;
          // Conservative AABB lower bound; every possibly touching pair reaches
          // the finite-segment test, including different nucleotide parameters.
          if (
            ["x", "y", "z"].some(
              (axis) =>
                Math.max(p.a[axis], p.b[axis]) + required <
                  Math.min(q.a[axis], q.b[axis]) ||
                Math.max(q.a[axis], q.b[axis]) + required <
                  Math.min(p.a[axis], p.b[axis]),
            )
          )
            continue;
          const distance = Math.sqrt(distanceSquared(p.a, p.b, q.a, q.b));
          minimumMargin = Math.min(minimumMargin, distance - p.r - q.r);
          assert(
            distance >= required,
            `peer-operons-01: ${model.id} p=${progress}, ${JSON.stringify(params)}, segments ${i}/${j}, axis gap=${distance}, rendered radii=${p.r + q.r}`,
          );
        }
    }
  return minimumMargin;
}
for (const model of [lac, trp, gal, hog]) verifyDuplexClearance(model);
console.log(
  "operons duplex: 1002 times x 16 conditions; independent segment parameters, true cylinder radius bounds, connected chains PASS",
);
