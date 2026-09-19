import assert from "node:assert/strict";
import * as THREE from "three";
import promoter from "./promoterRegulationProcess.js";
import enhancer from "./enhancerRegulationProcess.js";
import transcription from "../../transcriptionProcess.js";

const matrix = new THREE.Matrix4();
function centerline(mesh) {
  const result = [];
  if (mesh.isInstancedMesh) {
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      if (!i)
        result.push(
          new THREE.Vector3(0, -0.5, 0)
            .applyMatrix4(matrix)
            .applyMatrix4(mesh.matrixWorld),
        );
      result.push(
        new THREE.Vector3(0, 0.5, 0)
          .applyMatrix4(matrix)
          .applyMatrix4(mesh.matrixWorld),
      );
    }
  } else {
    const attr = mesh.geometry.attributes.position;
    for (let i = 0; i < attr.count / 8; i++) {
      const v = new THREE.Vector3();
      for (let j = 0; j < 8; j++)
        v.add(new THREE.Vector3().fromBufferAttribute(attr, i * 8 + j));
      result.push(v.divideScalar(8).applyMatrix4(mesh.matrixWorld));
    }
  }
  return result;
}
// Exact closest distance between two finite centerline segments, including
// different sampling parameters; comparing only corresponding vertices misses
// the old linker collision. Closest points are clamped to BOTH segment ranges.
function distanceSquared(p, q, a, b) {
  const ux = q.x - p.x,
    uy = q.y - p.y,
    uz = q.z - p.z;
  const vx = b.x - a.x,
    vy = b.y - a.y,
    vz = b.z - a.z;
  const wx = p.x - a.x,
    wy = p.y - a.y,
    wz = p.z - a.z;
  const A = ux * ux + uy * uy + uz * uz,
    B = ux * vx + uy * vy + uz * vz;
  const C = vx * vx + vy * vy + vz * vz,
    D = ux * wx + uy * wy + uz * wz,
    E = vx * wx + vy * wy + vz * wz;
  const clamp = (x) => Math.max(0, Math.min(1, x));
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
function separate(a, b, radius, message) {
  for (let i = 0; i < a.length - 1; i++)
    for (let j = 0; j < b.length - 1; j++) {
      const p = a[i],
        q = a[i + 1],
        r = b[j],
        s = b[j + 1];
      // AABB lower bound is used only to skip pairs already farther than the
      // required clearance; nearby pairs always get a full segment calculation.
      if (
        Math.max(p.x, q.x) + radius < Math.min(r.x, s.x) ||
        Math.max(r.x, s.x) + radius < Math.min(p.x, q.x) ||
        Math.max(p.y, q.y) + radius < Math.min(r.y, s.y) ||
        Math.max(r.y, s.y) + radius < Math.min(p.y, q.y) ||
        Math.max(p.z, q.z) + radius < Math.min(r.z, s.z) ||
        Math.max(r.z, s.z) + radius < Math.min(p.z, q.z)
      )
        continue;
      const d = distanceSquared(p, q, r, s);
      assert.ok(
        d >= radius * radius,
        `${message}; segments ${i}/${j}, distance ${Math.sqrt(d)}, required ${radius}`,
      );
    }
}
for (const [definition, names, radius, variants] of [
  [
    promoter,
    ["Promoter coding backbone", "Promoter template backbone"],
    0.088,
    [{ bindingSite: "intact" }, { bindingSite: "altered" }],
  ],
  [transcription, ["template-backbone", "coding-backbone"], 0.084, [{}]],
]) {
  const m = definition.create();
  for (const params of variants)
    for (let frame = 0; frame <= 200; frame++) {
      const p = frame / 200;
      m.update(p, params);
      m.group.updateMatrixWorld(true);
      separate(
        centerline(m.group.getObjectByName(names[0])),
        centerline(m.group.getObjectByName(names[1])),
        radius,
        `${definition.id} p=${p}`,
      );
    }
}
const e = enhancer.create();
for (const coactivator of ["competent", "impaired"])
  for (let frame = 0; frame <= 200; frame++) {
    const p = frame / 200;
    e.update(p, { coactivator });
    e.group.updateMatrixWorld(true);
    for (let link = 1; link <= 8; link++) {
      const lines = [1, 2].map((strand) =>
        centerline(e.group.getObjectByName(`Linker ${link} strand ${strand}`)),
      );
      separate(
        lines[0],
        lines[1],
        0.032,
        `enhancer ${coactivator} p=${p} linker=${link}`,
      );
      for (let strand = 1; strand <= 2; strand++) {
        if (link > 1) {
          const previous = e.group.children.find((o) =>
            o.name.startsWith(`Nucleosome ${link - 1} —`),
          );
          const wrapped = centerline(
            previous.getObjectByName(`Nucleosome DNA strand ${strand}`),
          );
          assert.ok(
            lines[strand - 1][0].distanceTo(wrapped.at(-1)) < 1e-6,
            "Linker starts at the same strand of the preceding wrapped DNA",
          );
        }
        if (link <= 7) {
          const next = e.group.children.find((o) =>
            o.name.startsWith(`Nucleosome ${link} —`),
          );
          const wrapped = centerline(
            next.getObjectByName(`Nucleosome DNA strand ${strand}`),
          );
          assert.ok(
            lines[strand - 1].at(-1).distanceTo(wrapped[0]) < 1e-6,
            "Linker ends at the same strand of the following wrapped DNA",
          );
        }
      }
    }
  }
console.log(
  "regulation duplex geometry: 201 frames per control; full segment distances and all 8 linker endpoints PASS",
);
