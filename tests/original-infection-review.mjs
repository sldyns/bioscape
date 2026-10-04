import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { build } from "esbuild";
import * as THREE from "three";

// Original process helpers use extensionless scene imports. Bundle that module
// in memory while sharing the installed Three runtime; no test output is written
// into the production tree. An explicit source override supports baseline checks.
const entry =
  process.env.BIOSCAPE_INFECTION_REVIEW_SOURCE ??
  new URL("../src/processes/phageProcess.js", import.meta.url).pathname;
const compiled = await build({
  entryPoints: [entry],
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
const definition = (
  await import(
    `data:text/javascript,${encodeURIComponent(compiled.outputFiles[0].text)}`
  )
).default;
const model = definition.create();

function dnaGroups() {
  const result = [];
  model.group.traverse((o) => {
    if (o.children.some((c) => c.name === "DNA-base-pair-rungs"))
      result.push(o);
  });
  return result;
}
function shown(o) {
  for (let node = o; node; node = node.parent) if (!node.visible) return false;
  return true;
}
function activeDNA() {
  const visible = dnaGroups().filter(shown);
  assert.equal(visible.length, 1, "one displayed genome");
  return visible[0];
}
function path(mesh) {
  const geometry = mesh.geometry,
    detail = geometry.parameters ?? geometry.userData,
    radial = detail.radialSegments,
    total = detail.tubularSegments,
    p = geometry.attributes.position;
  assert(radial >= 6 && total >= 720, "retain backbone surface detail");
  const first = geometry.drawRange.start / (radial * 6),
    last = Number.isFinite(geometry.drawRange.count)
      ? first + geometry.drawRange.count / (radial * 6)
      : total;
  const points = [];
  for (let ring = first; ring <= last; ring++) {
    const center = new THREE.Vector3();
    for (let j = 0; j < radial; j++)
      center.add(
        new THREE.Vector3().fromBufferAttribute(p, ring * (radial + 1) + j),
      );
    points.push(
      center.multiplyScalar(1 / radial).applyMatrix4(mesh.matrixWorld),
    );
  }
  return points;
}
const contourLength = (points) =>
  points
    .slice(1)
    .reduce((sum, point, i) => sum + point.distanceTo(points[i]), 0);
function geometryState(progress) {
  model.update(progress);
  const group = activeDNA(),
    strands = group.children.filter((o) => o.isMesh && !o.isInstancedMesh),
    paths = strands.map(path);
  assert.equal(paths.length, 2);
  assert.equal(paths[0].length, paths[1].length);
  const midpoints = paths[0].map((point, i) =>
    point.clone().lerp(paths[1][i], 0.5),
  );
  return {
    strands,
    paths,
    midpoints,
    lengths: paths.map(contourLength),
    contour: contourLength(midpoints),
    leadingEnd: midpoints.at(-1),
    bases: group.children.find((o) => o.name === "DNA-base-pair-rungs"),
  };
}
function fingerprint() {
  model.group.updateMatrixWorld(true);
  const hash = createHash("sha256"),
    identities = [];
  model.group.traverse((o) => {
    identities.push(o.uuid, o.geometry?.uuid, o.material?.uuid);
    assert(o.matrixWorld.elements.every(Number.isFinite));
    hash.update(
      JSON.stringify([
        o.visible,
        o.matrixWorld.elements,
        o.geometry?.drawRange,
        o.count,
      ]),
    );
    for (const array of [
      o.geometry?.attributes.position?.array,
      o.geometry?.attributes.normal?.array,
      o.instanceMatrix?.array,
    ]) {
      if (!array) continue;
      assert(array.every(Number.isFinite));
      hash.update(
        Buffer.from(array.buffer, array.byteOffset, array.byteLength),
      );
    }
  });
  return { hash: hash.digest("hex"), identities };
}

const before = geometryState(0.599999),
  beforeEnds = before.paths.map((p) => p.at(-1).clone()),
  beforeLengths = [...before.lengths],
  boundary = geometryState(0.6);
for (let strand = 0; strand < 2; strand++) {
  assert(
    beforeEnds[strand].distanceTo(boundary.paths[strand].at(-1)) < 1e-7,
    "DNA leading endpoint must not jump when transfer is still zero",
  );
  assert(
    Math.abs(beforeLengths[strand] - boundary.lengths[strand]) < 1e-7,
    "same rendered backbone extent on both sides of the handoff",
  );
}
const boundaryState = fingerprint();
assert.equal(
  dnaGroups().length,
  1,
  "one material-coordinate representation throughout",
);
const inventory = [...boundaryState.identities];
let maxContourDrift = 0,
  maxBackboneDrift = 0;
for (const p of [
  0, 0.32, 0.4819, 0.56, 0.599999, 0.6, 0.600001, 0.6137, 0.7013, 0.8179,
  0.9241, 1,
]) {
  const current = geometryState(p);
  const contourDrift = Math.abs(current.contour / boundary.contour - 1);
  maxContourDrift = Math.max(maxContourDrift, contourDrift);
  assert(
    contourDrift < 0.001,
    "genome contour extent conserved within dense mesh sampling tolerance",
  );
  for (let strand = 0; strand < 2; strand++) {
    const drift = Math.abs(
      current.lengths[strand] / boundary.lengths[strand] - 1,
    );
    maxBackboneDrift = Math.max(maxBackboneDrift, drift);
    assert(
      drift < 0.008,
      "no visible backbone shortening as the same duplex enters",
    );
  }
  assert.equal(
    current.bases.count,
    91,
    "material markers travel with the whole genome",
  );
  for (let i = 0; i < current.paths[0].length; i++) {
    assert(
      Math.abs(current.paths[0][i].distanceTo(current.paths[1][i]) - 0.036) <
        1e-6,
    );
    if (i)
      for (const points of current.paths)
        assert(
          points[i].distanceTo(points[i - 1]) < 0.035,
          "connected, finely sampled backbone",
        );
  }
  const expected = fingerprint();
  assert.deepEqual(
    expected.identities,
    inventory,
    "no resource allocation during update",
  );
  model.update(0.9371);
  model.update(0.0427);
  model.update(p);
  assert.deepEqual(
    fingerprint(),
    expected,
    `irregular seek restores full mesh state at ${p}`,
  );
}

// A real open host outlet and fixed-length tail remain when DNA starts moving.
const tail = model.group.getObjectByName("rigid-T4-tail-tube");
assert(tail);
let tailLength;
for (const p of [0, 0.4, 0.52, 0.6, 1]) {
  model.update(p);
  const bounds = new THREE.Box3().setFromObject(tail),
    length = bounds.max.y - bounds.min.y;
  tailLength ??= length;
  assert(Math.abs(length - tailLength) < 1e-7);
}
const inTail = geometryState(0.6137),
  tailBounds = new THREE.Box3().setFromObject(tail);
let tubeSamples = 0;
for (const points of inTail.paths)
  for (const p of points) {
    if (p.y <= tailBounds.min.y + 0.02 || p.y >= tailBounds.max.y - 0.02)
      continue;
    assert(
      Math.hypot(p.x, p.z) + 0.013 < 0.067,
      "both backbone surfaces stay inside the actual tail lumen",
    );
    tubeSamples++;
  }
assert(tubeSamples > 20);
const host = model.group.children[0],
  hostSurfaces = host.children.filter((o) => o.isMesh && shown(o)),
  ray = new THREE.Raycaster(
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(0, -1, 0),
    0,
    2.4,
  );
assert.equal(
  ray.intersectObjects(hostSurfaces, false).length,
  0,
  "actual host outlet has no central membrane cap during entry",
);
const bulge = host.children.find((o) => o.geometry?.type === "PlaneGeometry");
ray.set(new THREE.Vector3(0, -1.1, -0.1), new THREE.Vector3(0, -1, 0));
assert(
  ray.intersectObject(bulge, false).length > 0,
  "an actual membrane annulus surrounds the outlet",
);

// Surface winding must agree with the explicit normals after buffer updates.
for (const mesh of inTail.strands) {
  const p = mesh.geometry.attributes.position,
    n = mesh.geometry.attributes.normal,
    idx = mesh.geometry.index;
  for (const offset of [0, 2340, 8640]) {
    const a = new THREE.Vector3().fromBufferAttribute(p, idx.getX(offset)),
      b = new THREE.Vector3().fromBufferAttribute(p, idx.getX(offset + 1)),
      c = new THREE.Vector3().fromBufferAttribute(p, idx.getX(offset + 2)),
      normal = new THREE.Vector3().fromBufferAttribute(n, idx.getX(offset));
    assert(b.sub(a).cross(c.sub(a)).dot(normal) > 0);
  }
}
console.log(
  `Infection DNA continuity PASS: identical .6 boundary geometry; max contour drift ${(maxContourDrift * 100).toFixed(4)}%, backbone drift ${(maxBackboneDrift * 100).toFixed(4)}%; fixed tail, open membrane outlet, fine continuous strands and deterministic resource-stable seeks.`,
);

// Check the actual world-space leaders, including the moving capsid and the
// root's offset. A constant local coordinate can look plausible but miss it.
function surfaceDistance(point, root) {
  let minimum = Infinity;
  const triangle = new THREE.Triangle(),
    closest = new THREE.Vector3();
  root.traverse((mesh) => {
    if (!mesh.isMesh || mesh.isInstancedMesh) return;
    const geometry = mesh.geometry,
      p = geometry.attributes.position,
      end = Math.min(
        geometry.index?.count ?? p.count,
        geometry.drawRange.start + geometry.drawRange.count,
      );
    for (let i = geometry.drawRange.start; i < end; i += 3) {
      for (let j = 0; j < 3; j++)
        [triangle.a, triangle.b, triangle.c][j]
          .fromBufferAttribute(
            p,
            geometry.index ? geometry.index.getX(i + j) : i + j,
          )
          .applyMatrix4(mesh.matrixWorld);
      triangle.closestPointToPoint(point, closest);
      minimum = Math.min(minimum, point.distanceTo(closest));
    }
  });
  return minimum;
}
const labelTargets = [
  "T4-capsid-shell",
  "host-outer-membrane-slab",
  "host-cytoplasmic-membrane-slab",
  "host-cytoplasmic-background",
].map((name) => model.group.getObjectByName(name));
let labelChecks = 0;
for (const transformed of [false, true]) {
  model.group.position.set(
    transformed ? 0.43 : 0,
    transformed ? -0.57 : -0.24,
    0.09,
  );
  model.group.rotation.set(
    0.05,
    transformed ? 0.31 : 0,
    transformed ? -0.12 : 0,
  );
  for (const p of [
    0, 0.117, 0.28, 0.32, 0.419, 0.52, 0.599999, 0.6, 0.713, 0.869, 1,
  ]) {
    model.update(p);
    const expected = model.labels.map((label) => [...label.position]);
    model.labels.forEach((label, i) => {
      assert(
        surfaceDistance(new THREE.Vector3(...label.position), labelTargets[i]) <
          1e-6,
        `infection label ${i} touches its actual world-space surface at ${p}`,
      );
      labelChecks++;
    });
    model.update(0.971);
    model.update(0.029);
    model.update(p);
    assert.deepEqual(
      model.labels.map((label) => label.position),
      expected,
    );
  }
}
console.log(
  `Infection world-space label anchors PASS: ${labelChecks} surface checks across attachment, contraction, transfer and transformed roots.`,
);
