import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { build } from "esbuild";
import * as THREE from "three";

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
const group = phageDetail("phageHead");
group.updateMatrixWorld(true);
const anchor = new THREE.Vector3(...group.userData.partAnchors.phageCapsomers),
  triangle = new THREE.Triangle(),
  closestPoint = new THREE.Vector3();
let distance = Infinity,
  protein = null;
for (const mesh of group.children) {
  if (mesh.geometry?.type !== "SphereGeometry" || mesh.userData.cap) continue;
  const p = mesh.geometry.attributes.position,
    indices = mesh.geometry.index;
  for (let i = 0; i < indices.count; i += 3) {
    triangle.a
      .fromBufferAttribute(p, indices.getX(i))
      .applyMatrix4(mesh.matrixWorld);
    triangle.b
      .fromBufferAttribute(p, indices.getX(i + 1))
      .applyMatrix4(mesh.matrixWorld);
    triangle.c
      .fromBufferAttribute(p, indices.getX(i + 2))
      .applyMatrix4(mesh.matrixWorld);
    triangle.closestPointToPoint(anchor, closestPoint);
    const d = closestPoint.distanceTo(anchor);
    if (d < distance) {
      distance = d;
      protein = mesh;
    }
  }
}
// Reproduce the structure viewer's 5.4-unit fit and saved default camera.
const bounds = new THREE.Box3().setFromObject(group),
  center = bounds.getCenter(new THREE.Vector3()),
  size = bounds.getSize(new THREE.Vector3()),
  factor = 5.4 / Math.max(size.x, size.y, size.z),
  checks = [];
for (const mode of ["whole", "section"])
  for (const fitDistance of [9.8, 11.4, 15]) {
    const camera = new THREE.Vector3(0.5, 0.65, fitDistance)
        .divideScalar(factor)
        .add(center),
      ray = new THREE.Raycaster(camera, anchor.clone().sub(camera).normalize()),
      meshes = group.children.filter(
        (mesh) =>
          mesh.isMesh &&
          (mode === "section" ? !mesh.userData.cap : !mesh.userData.cutOnly),
      ),
      hit = ray.intersectObjects(meshes, false)[0];
    checks.push({
      mode,
      fitDistance,
      firstHitIsAnchoredProtein: hit?.object === protein,
      anchorToFirstSurface: hit ? hit.point.distanceTo(anchor) : null,
    });
  }
const result = {
  anchor: anchor.toArray(),
  proteinSurfaceDistance: distance,
  checks,
};
if (process.env.BIOSCAPE_CAPSID_REVIEW_MEASUREMENTS)
  await writeFile(
    process.env.BIOSCAPE_CAPSID_REVIEW_MEASUREMENTS,
    JSON.stringify(result, null, 2) + "\n",
  );
console.log(JSON.stringify(result));
assert(
  distance < 1e-7,
  "capsid lattice anchor lies on an actual retained protein surface",
);
assert.equal(protein.userData.hitId, "phageCapsomers");
for (const check of checks) {
  assert(
    check.firstHitIsAnchoredProtein,
    `unoccluded capsomer in ${check.mode}`,
  );
  assert(
    check.anchorToFirstSurface < 1e-6,
    `leader reaches its first surface in ${check.mode}`,
  );
}
console.log(
  "PASS SPH-02: capsid lattice label belongs to a visible protein surface in whole and section views",
);
