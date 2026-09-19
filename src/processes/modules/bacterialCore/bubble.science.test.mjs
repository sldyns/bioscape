import assert from "node:assert/strict";
import * as THREE from "three";
import expression from "./bacterialExpressionProcess.js";
import { ease } from "../../kit.js";
import { segmentWriter } from "./bacterialGeometry.js";

// Finite-segment distance: independently vary both parameters, including endpoints.
// This is a capsule upper envelope of each actual closed 16-sided cylinder,
// so positive clearance proves the rendered tube surfaces cannot intersect.
function closest(p, q, a, b) {
  const u = q.clone().sub(p),
    v = b.clone().sub(a),
    w = p.clone().sub(a);
  const A = u.dot(u),
    B = u.dot(v),
    C = v.dot(v),
    D = u.dot(w),
    E = v.dot(w);
  const clamp = (t) => Math.max(0, Math.min(1, t));
  let result = { distance: Infinity, s: 0, t: 0 };
  const check = (s, t) => {
    const distance = w
      .clone()
      .addScaledVector(u, s)
      .addScaledVector(v, -t)
      .length();
    if (distance < result.distance) result = { distance, s, t };
  };
  check(0, C ? clamp(E / C) : 0);
  check(1, C ? clamp((B + E) / C) : 0);
  check(A ? clamp(-D / A) : 0, 0);
  check(A ? clamp((B - D) / A) : 0, 1);
  const det = A * C - B * B;
  if (det > 1e-15) {
    const s = (B * E - C * D) / det,
      t = (A * E - B * D) / det;
    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) check(s, t);
  }
  return result;
}
function tube(mesh) {
  const a = mesh.localToWorld(new THREE.Vector3(0, -0.5, 0)),
    b = mesh.localToWorld(new THREE.Vector3(0, 0.5, 0));
  const scale = mesh.getWorldScale(new THREE.Vector3());
  return { a, b, r: Math.max(scale.x, scale.z), mesh };
}
function xgap(a, b) {
  return Math.max(
    Math.min(a.a.x, a.b.x) - Math.max(b.a.x, b.b.x),
    Math.min(b.a.x, b.b.x) - Math.max(a.a.x, a.b.x),
  );
}
// When rounded capsule envelopes overlap at nearby joints, use SAT on the
// actual polygonal cylinder prisms. Their flat caps can remain separated.
let exactSolidChecks = 0;
function solidIntersects(a, b) {
  exactSolidChecks++;
  const prism = (mesh) => {
    const count = mesh.geometry.parameters.radialSegments,
      attribute = mesh.geometry.attributes.position;
    const vertices = [];
    for (let row = 0; row < 2; row++)
      for (let i = 0; i < count; i++)
        vertices.push(
          new THREE.Vector3()
            .fromBufferAttribute(attribute, row * (count + 1) + i)
            .applyMatrix4(mesh.matrixWorld),
        );
    const axial = vertices[count].clone().sub(vertices[0]).normalize(),
      edges = [axial],
      normals = [axial];
    for (let i = 0; i < count; i++) {
      const edge = vertices[(i + 1) % count]
        .clone()
        .sub(vertices[i])
        .normalize();
      edges.push(edge);
      normals.push(new THREE.Vector3().crossVectors(axial, edge).normalize());
    }
    return { vertices, edges, normals };
  };
  const p = prism(a.mesh),
    q = prism(b.mesh),
    axes = [...p.normals, ...q.normals];
  for (const u of p.edges)
    for (const v of q.edges) {
      const axis = new THREE.Vector3().crossVectors(u, v);
      if (axis.lengthSq() > 1e-15) axes.push(axis.normalize());
    }
  for (const axis of axes) {
    const x = p.vertices.map((v) => v.dot(axis)),
      y = q.vertices.map((v) => v.dot(axis));
    if (
      Math.max(...x) < Math.min(...y) - 1e-9 ||
      Math.max(...y) < Math.min(...x) - 1e-9
    )
      return false;
  }
  return true;
}
function assertSeparate(a, b, distance, message) {
  assert(distance > a.r + b.r + 1e-5 || !solidIntersects(a, b), message);
}
function inspect(scene) {
  const strands = [0, 1].map((side) =>
    Array.from({ length: 98 }, (_, i) =>
      tube(scene.group.getObjectByName(`DNA-strand-${side}-${i}`)),
    ),
  );
  const min = {
    cross: Infinity,
    self: Infinity,
    phosphateCross: Infinity,
    phosphateToOtherTube: Infinity,
  };
  for (let side = 0; side < 2; side++)
    for (let i = 0; i < 98; i++)
      for (let j = side === 0 ? 0 : i + 2; j < 98; j++) {
        const a = strands[side][i],
          b = strands[1][j];
        // Cross-strand pairs use all i,j; self-strand pairs exclude only adjacent
        // cylinders, whose shared end is the intended continuous covalent backbone.
        if (side === 1 && j <= i + 1) continue;
        if (xgap(a, b) > 0.5) continue;
        const d = closest(a.a, a.b, b.a, b.b).distance;
        const kind = side === 0 ? "cross" : "self";
        min[kind] = Math.min(min[kind], d - a.r - b.r);
        assertSeparate(
          a,
          b,
          d,
          `${kind} DNA tubes ${i}/${j}: distance ${d}, radii ${a.r + b.r}`,
        );
      }
  // The first loop handles cross pairs and strand 1 self pairs; also inspect strand 0.
  for (let i = 0; i < 98; i++)
    for (let j = i + 2; j < 98; j++) {
      const a = strands[0][i],
        b = strands[0][j];
      if (xgap(a, b) > 0.5) continue;
      const d = closest(a.a, a.b, b.a, b.b).distance;
      min.self = Math.min(min.self, d - a.r - b.r);
      assertSeparate(a, b, d, `strand 0 self tubes ${i}/${j}: distance ${d}`);
    }
  const phosphate = scene.group.getObjectByName("DNA-sugar-phosphate-groups"),
    matrix = new THREE.Matrix4();
  const heads = [[], []];
  for (let i = 0; i < phosphate.count; i++) {
    phosphate.getMatrixAt(i, matrix);
    matrix.premultiply(phosphate.matrixWorld);
    const center = new THREE.Vector3().setFromMatrixPosition(matrix),
      scale = new THREE.Vector3().setFromMatrixScale(matrix);
    heads[i % 2].push({ center, r: Math.max(scale.x, scale.y, scale.z) });
  }
  for (const a of heads[0])
    for (const b of heads[1]) {
      if (Math.abs(a.center.x - b.center.x) > 0.5) continue;
      const clearance = a.center.distanceTo(b.center) - a.r - b.r;
      min.phosphateCross = Math.min(min.phosphateCross, clearance);
      assert(clearance > 1e-5, "opposite-strand phosphate envelopes intersect");
    }
  for (let side = 0; side < 2; side++)
    for (const head of heads[side])
      for (const segment of strands[1 - side]) {
        if (
          head.center.x < Math.min(segment.a.x, segment.b.x) - 0.5 ||
          head.center.x > Math.max(segment.a.x, segment.b.x) + 0.5
        )
          continue;
        const point = new THREE.Line3(segment.a, segment.b).closestPointToPoint(
          head.center,
          true,
          new THREE.Vector3(),
        );
        const clearance = head.center.distanceTo(point) - head.r - segment.r;
        min.phosphateToOtherTube = Math.min(
          min.phosphateToOtherTube,
          clearance,
        );
        assert(
          clearance > 1e-5,
          "phosphate envelope intersects opposite DNA tube",
        );
      }
  return min;
}
const scene = expression.create();
for (const sigma of ["present", "absent"]) {
  const minimum = {
    cross: Infinity,
    self: Infinity,
    phosphateCross: Infinity,
    phosphateToOtherTube: Infinity,
  };
  for (let frame = 0; frame <= 1000; frame++) {
    scene.update(frame / 1000, { sigma });
    scene.group.updateMatrixWorld(true);
    const rnaStart = scene.group.getObjectByName("nascent-RNA-0"),
      activeSite = scene.group.getObjectByName("RNAP-active-3prime");
    if (sigma === "present" && rnaStart.visible) {
      assert(
        tube(rnaStart).a.distanceTo(
          activeSite.getWorldPosition(new THREE.Vector3()),
        ) < 1e-8,
        "moving DNA frame retains RNA 3-prime/active-site connection",
      );
    } else if (sigma === "absent")
      assert(!rnaStart.visible, "sigma-negative control has no RNA");
    const current = inspect(scene);
    for (const key of Object.keys(minimum))
      minimum[key] = Math.min(minimum[key], current[key]);
  }
  console.log(
    `${sigma}: 1001 actual-mesh states; min capsule/sphere envelope clearances (negative self gap uses exact prism SAT) ${JSON.stringify(minimum)}`,
  );
}
// Negative control: restore both actual cylinders at the peer's p=.521 witness
// to the old ±Y Cartesian interpolation and confirm strict solid containment.
const p = 0.521,
  px = -2.35 + 5.08 * ease(p, 0.43, 1),
  opening = ease(p, 0.18, 0.38),
  write = segmentWriter();
scene.update(p, { sigma: "present" });
const oldPoint = (x, side) => {
  const phase = (x + 4) * 3.8 + side * Math.PI,
    b = opening * Math.exp(-(((x - px) / 0.47) ** 4));
  return [
    x,
    0.95 + Math.cos(phase) * 0.2 * (1 - b) + (side ? -0.35 : 0.35) * b,
    Math.sin(phase) * 0.2 * (1 - b),
  ];
};
const witnesses = [0, 1].map((side) => {
  const mesh = scene.group.getObjectByName(`DNA-strand-${side}-31`);
  write(
    mesh,
    oldPoint(-4.25 + (31 * 8.5) / 98, side),
    oldPoint(-4.25 + (32 * 8.5) / 98, side),
    0.047,
  );
  return mesh;
});
scene.group.updateMatrixWorld(true);
const [a, b] = witnesses.map(tube),
  hit = closest(a.a, a.b, b.a, b.b);
const middle = a.a
  .clone()
  .lerp(a.b, hit.s)
  .add(b.a.clone().lerp(b.b, hit.t))
  .multiplyScalar(0.5);
for (const mesh of witnesses) {
  const local = mesh.worldToLocal(middle.clone());
  assert(
    Math.abs(local.y) < 0.5 &&
      Math.hypot(local.x, local.z) < Math.cos(Math.PI / 16),
    "negative witness is strictly inside both actual polygonal cylinder solids",
  );
}
assert.throws(
  () => inspect(scene),
  assert.AssertionError,
  "old bubble must fail different-index/full-segment collision checks",
);
console.log(
  `bubble-extension-01: old mesh witness rejected (axis distance ${hit.distance}); strict intersection confirmed inside both 16-sided solids`,
);

console.log(
  `Exact polygonal-prism SAT checks: ${exactSolidChecks}; no actual solid intersection in corrected states.`,
);
