import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { build } from "esbuild";
import * as THREE from "three";

// Inspect rendered geometry, retaining the project runtime's Three precision.
// A source override permits the same test to reject the archived old factory.
const compiled = await build({
  entryPoints: [
    process.env.BIOSCAPE_CAPSID_REVIEW_SOURCE ??
      new URL("../src/scene/phageDetails.js", import.meta.url).pathname,
  ],
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  logLevel: "silent",
  plugins: [
    {
      name: "shared-three-runtime",
      setup(builder) {
        builder.onResolve({ filter: /^three(?:\/.*)?$/ }, ({ path }) => ({
          path: import.meta.resolve(path),
          external: true,
        }));
      },
    },
  ],
});
const { phageDetail } = await import(
  `data:text/javascript,${encodeURIComponent(compiled.outputFiles[0].text)}`
);
const vector = (...v) => new THREE.Vector3(...v);
const head = phageDetail("phageHead");
head.updateMatrixWorld(true);
const surfaces = (color) =>
  head.children.filter((o) => o.isMesh && o.material.color.getHex() === color);
const outer = surfaces(0xa4b4c7),
  inner = surfaces(0x8e9fb4);
assert.equal(outer.length, 2, "both sides of the outer cutaway remain");
assert.equal(inner.length, 2, "both sides of the inner cutaway remain");

// Ignore split-plane interpolation vertices when checking the original lattice.
// The upper hemisphere is complete and is unaffected by the basal portal.
const vertices = new Map();
for (const mesh of outer) {
  const p = mesh.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const point = vector().fromBufferAttribute(p, i);
    assert(point.toArray().every(Number.isFinite));
    assert(
      mesh.userData.cap ? point.z >= 0.3 - 1e-6 : point.z <= 0.3 + 1e-6,
      "cutaway remains on the original z=0.3 plane",
    );
    const radius = Math.hypot(point.x, point.y / 1.38, point.z);
    if (point.y >= -1e-6 && Math.abs(radius - 0.9) < 1e-6)
      vertices.set(
        point
          .toArray()
          .map((v) => v.toFixed(6))
          .join(),
        point,
      );
  }
}
const originals = [...vertices.values()];
assert(originals.length >= 20, "retain the original level-one subdivision");
const angle = (2 * Math.PI) / 5,
  axis = vector(0, 1, 0);
const vertexError = Math.max(
  ...originals.map((point) => {
    const rotated = point.clone().applyAxisAngle(axis, angle);
    return Math.min(...originals.map((other) => rotated.distanceTo(other)));
  }),
);
const ray = new THREE.Raycaster();
function radialDistance(meshes, theta, phi) {
  ray.set(
    vector(),
    vector(
      Math.sin(theta) * Math.cos(phi),
      Math.cos(theta),
      Math.sin(theta) * Math.sin(phi),
    ),
  );
  const hits = ray.intersectObjects(meshes, false);
  assert(hits.length, "intact shell outside the basal portal");
  return hits[0].distance;
}
let radialError = 0,
  thicknessRatioError = 0,
  raySamples = 0;
// Avoid only the small, deliberate basal hole, not the cutaway front surface.
for (let i = 1; i <= 35; i++)
  for (let j = 0; j < 72; j++) {
    const theta = ((i + 0.173) * Math.PI) / 40,
      phi = ((j + 0.317) * 2 * Math.PI) / 72,
      distance = radialDistance(outer, theta, phi);
    radialError = Math.max(
      radialError,
      Math.abs(distance - radialDistance(outer, theta, phi + angle)),
    );
    thicknessRatioError = Math.max(
      thicknessRatioError,
      Math.abs(radialDistance(inner, theta, phi) / distance - 0.95),
    );
    raySamples++;
  }

// All actual DNA surface vertices, including transformed base-pair struts,
// must remain inside the convex inner shell despite the explanatory window.
const planes = [];
for (const mesh of inner) {
  const p = mesh.geometry.attributes.position,
    indices = mesh.geometry.index;
  for (let i = 0; i < indices.count; i += 3) {
    const a = vector().fromBufferAttribute(p, indices.getX(i)),
      b = vector().fromBufferAttribute(p, indices.getX(i + 1)),
      c = vector().fromBufferAttribute(p, indices.getX(i + 2)),
      normal = b.clone().sub(a).cross(c.clone().sub(a));
    if (normal.lengthSq() < 1e-16) continue;
    normal.normalize();
    if (normal.dot(a) < 0) normal.negate();
    planes.push(new THREE.Plane(normal, -normal.dot(a)));
  }
}
const genome = phageDetail("phageGenome");
genome.updateMatrixWorld(true);
let dnaVertices = 0,
  closestDNAPlane = -Infinity;
genome.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const p = mesh.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const point = vector()
      .fromBufferAttribute(p, i)
      .applyMatrix4(mesh.matrixWorld)
      .multiplyScalar(0.95);
    closestDNAPlane = Math.max(
      closestDNAPlane,
      ...planes.map((plane) => plane.distanceToPoint(point)),
    );
    dnaVertices++;
  }
});
assert.equal(dnaVertices, 48036, "retain all genome surface detail");

const whole = phageDetail("phage");
whole.rotation.set(0, 0, 0); // Remove only the existing display pose.
whole.updateMatrixWorld(true);
const proteins = [];
whole.traverse((mesh) => {
  if (mesh.isMesh && mesh.userData.hitId !== "phageGenome") proteins.push(mesh);
});
let channelIntersections = 0;
for (const offset of [
  vector(),
  ...Array.from({ length: 12 }, (_, i) =>
    vector(
      0.04 * Math.cos((i * Math.PI) / 6),
      0,
      0.04 * Math.sin((i * Math.PI) / 6),
    ),
  ),
]) {
  ray.set(offset.clone().add(vector(0, 0.6, 0)), vector(0, -1, 0));
  ray.near = 0;
  ray.far = 2.6;
  channelIntersections += ray.intersectObjects(proteins, false).length;
}
const measurements = {
  vertexError,
  radialError,
  raySamples,
  thicknessRatioError,
  dnaVertices,
  closestDNAPlane,
  channelIntersections,
};
if (process.env.BIOSCAPE_CAPSID_REVIEW_MEASUREMENTS)
  await writeFile(
    process.env.BIOSCAPE_CAPSID_REVIEW_MEASUREMENTS,
    JSON.stringify(measurements, null, 2) + "\n",
  );
console.log(JSON.stringify(measurements));
assert(vertexError < 1e-6, "capsid vertices have fivefold head-tail symmetry");
assert(radialError < 1e-6, "actual capsid surfaces have fivefold symmetry");
assert(
  thicknessRatioError < 1e-6,
  "original inner/outer shell thickness retained",
);
assert(
  closestDNAPlane < -0.08,
  "DNA remains comfortably within the inner shell",
);
assert.equal(
  channelIntersections,
  0,
  "portal-to-tail route retains an open bore",
);
console.log(
  "PASS SPH-01: fivefold capsid axis, fixed cutaway, shell thickness, DNA confinement and open bore",
);
