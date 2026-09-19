import assert from "node:assert/strict";
import * as THREE from "three";
import mitosis from "./mitosisProcess.js";
import meiosis from "./meiosisProcess.js";

function named(root, name) {
  const objects = [];
  root.traverse((o) => {
    if (o.name === name) objects.push(o);
  });
  return objects;
}
function end(mesh, first = false) {
  const matrix = new THREE.Matrix4();
  mesh.getMatrixAt(first ? 0 : 11, matrix);
  return new THREE.Vector3(0, first ? -0.5 : 0.5, 0)
    .applyMatrix4(matrix)
    .applyMatrix4(mesh.matrixWorld);
}
function surfaceDistance(point, mesh) {
  const g = mesh.geometry,
    p = g.attributes.position;
  let result = Infinity;
  const tri = new THREE.Triangle(),
    closest = new THREE.Vector3();
  const indices = g.index;
  const count = Math.min(indices?.count ?? p.count, g.drawRange.count);
  for (let i = g.drawRange.start; i < count; i += 3) {
    for (let j = 0; j < 3; j++)
      [tri.a, tri.b, tri.c][j]
        .fromBufferAttribute(p, indices ? indices.getX(i + j) : i + j)
        .applyMatrix4(mesh.matrixWorld);
    tri.closestPointToPoint(point, closest);
    result = Math.min(result, point.distanceTo(closest));
  }
  return result;
}
function contacts(model, expected = 8) {
  model.group.updateMatrixWorld(true);
  const fibres = named(model.group, "kinetochore-microtubule-bundle");
  const plates = named(model.group, "outer-kinetochore-plate");
  assert.equal(fibres.length, 8);
  let contact = 0;
  fibres.forEach((f, i) => {
    if (surfaceDistance(end(f), plates[i]) < 1e-5) contact++;
  });
  assert.equal(
    contact,
    expected,
    "actual fibre endpoints must touch triangle surfaces, not a nearby vertex/metadata anchor",
  );
}
function counts(model) {
  const c = named(model.group, "condensed-chromatin-chromatid");
  assert.equal(c.length, 8);
  return c;
}
const m = mitosis.create();
for (const p of [0.37, 0.43, 0.55, 0.72, 0.8]) {
  m.update(p);
  contacts(m);
}
m.update(1, { attachment: "unattached" });
contacts(m, 7);
const arrested = counts(m).map((c) => c.position.toArray());
for (let i = 0; i < 4; i++)
  assert(Math.abs(arrested[i * 2][0] - arrested[i * 2 + 1][0]) < 0.25);
assert.equal(named(m.group, "actomyosin-contractile-belt")[0].visible, false);
assert.equal(
  named(m.group, "paired-cell-membrane-open-front").filter((c) => c.visible)
    .length,
  1,
);
m.update(0.43, { attachment: "unattached" });
assert.deepEqual(
  counts(m).map((c) => c.position.toArray()),
  arrested,
);
m.update(1);
const mitoticProducts = counts(m);
assert.equal(mitoticProducts.filter((c) => c.position.x < 0).length, 4);
assert.equal(mitoticProducts.filter((c) => c.position.x > 0).length, 4);
let previousOverlap;
for (const p of [0.43, 0.64, 0.73]) {
  m.update(p);
  m.group.updateMatrixWorld(true);
  const bundles = named(m.group, "antiparallel-interpolar-half-bundle");
  assert.equal(bundles.length, 16);
  for (const bundle of bundles) {
    const a = end(bundle, true),
      b = end(bundle);
    assert(Math.abs(a.x) > 2 && Math.abs(b.x) < 0.75);
    assert(
      a.x * b.x < 0,
      "antiparallel populations must interdigitate across the midzone",
    );
    assert(Math.abs(a.x - b.x) < 3.3, "no individual strand spans both poles");
  }
  const overlap = Math.abs(end(bundles[0]).x - end(bundles[1]).x);
  if (previousOverlap !== undefined) assert(overlap < previousOverlap);
  previousOverlap = overlap;
}

const mei = meiosis.create();
for (const p of [0.28, 0.32, 0.48, 0.62, 0.68, 0.76, 0.88]) {
  mei.update(p);
  contacts(mei);
  const fibres = named(mei.group, "kinetochore-microtubule-bundle");
  for (let pair = 0; pair < 4; pair++) {
    const a = end(fibres[pair * 2], true),
      b = end(fibres[pair * 2 + 1], true);
    if (p < 0.55)
      assert.equal(
        Math.sign(a.x),
        Math.sign(b.x),
        "I: sister fibres share a pole",
      );
    else
      assert.equal(
        Math.sign(a.y),
        -Math.sign(b.y),
        "II: sister fibres face opposite poles",
      );
  }
}
mei.update(0);
const chromatids = counts(mei);
for (const c of chromatids) {
  const arms = named(c, "continuous-chromatid-arm");
  let min = Infinity,
    max = -Infinity;
  for (const arm of arms) {
    const p = arm.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      min = Math.min(min, p.getY(i));
      max = Math.max(max, p.getY(i));
    }
  }
  assert(
    -min / (max - min) < 0.03,
    "mouse centromere must lie near the terminal end, not at 43% of arm length",
  );
  assert.equal(arms[0].material, arms[2].material);
}
function capPoint(mesh, top) {
  const p = mesh.geometry.attributes.position;
  return new THREE.Vector3()
    .fromBufferAttribute(p, p.count - (top ? 1 : 2))
    .applyMatrix4(mesh.matrixWorld);
}
for (const p of [0.23, 0.28, 0.34]) {
  mei.update(p);
  mei.group.updateMatrixWorld(true);
  const markers = named(mei.group, "chiasma-at-reciprocal-exchange");
  for (let pair = 0; pair < 2; pair++) {
    const nonsisters = [chromatids[pair * 4 + 1], chromatids[pair * 4 + 2]];
    const points = nonsisters.map((c) => {
      const arms = named(c, "continuous-chromatid-arm");
      // Traversal visits the distal group first; locate the proximal/distal
      // seam by each arm's local y extent instead of trusting construction order.
      const ordered = arms.sort(
        (a, b) => a.geometry.boundingBox.min.y - b.geometry.boundingBox.min.y,
      );
      const proximal = ordered[1],
        distal = ordered[2];
      const a = capPoint(proximal, true),
        b = capPoint(distal, false);
      assert(
        a.distanceTo(b) < 1e-6,
        "each exchanged chromatid is continuous at the ancestry boundary",
      );
      assert.notEqual(
        proximal.material,
        distal.material,
        "reciprocal ancestry changes at this junction",
      );
      return a;
    });
    assert(
      points[0].distanceTo(points[1]) < 1e-6,
      "both nonsisters exchange at the same homologous coordinate",
    );
    assert(
      points[0].distanceTo(
        markers[pair].getWorldPosition(new THREE.Vector3()),
      ) < 1e-6,
    );
  }
}
for (const p of [0, 0.14, 0.22, 0.35, 0.51, 0.58, 0.7, 0.86, 0.94, 1]) {
  mei.update(p);
  const c = counts(mei);
  if (p >= 0.51 && p <= 0.58) {
    assert.equal(c.filter((x) => x.position.x < 0).length, 4);
    assert.equal(c.filter((x) => x.position.x > 0).length, 4);
  }
  if (p >= 0.86)
    for (const x of [-1, 1])
      for (const y of [-1, 1]) {
        assert.equal(
          c.filter(
            (c) =>
              Math.sign(c.position.x) === x && Math.sign(c.position.y) === y,
          ).length,
          2,
        );
      }
}

const membranes = [
  ...named(mei.group, "germ-cell-outer-leaflet"),
  ...named(mei.group, "germ-cell-inner-leaflet"),
];
assert.equal(
  membranes.length,
  2,
  "continuous bilayer replaces capped ellipsoids and solid bridge cylinders",
);
const ray = new THREE.Raycaster();
function intersections(a, b, meshes = membranes) {
  const direction = b.clone().sub(a),
    length = direction.length();
  ray.set(a, direction.normalize());
  ray.near = 1e-5;
  ray.far = length - 1e-5;
  return ray.intersectObjects(meshes, false);
}
const ease = (x, a, b) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
for (const p of [0.5, 0.54, 0.56, 0.6, 0.82, 0.88, 0.93, 0.96, 1]) {
  mei.update(p);
  mei.group.updateMatrixWorld(true);
  const cx = 2.05 * ease(p, 0.43, 0.56),
    cy = 1.32 * ease(p, 0.8, 0.93);
  assert.equal(
    intersections(
      new THREE.Vector3(-cx, cy, -0.07),
      new THREE.Vector3(cx, cy, -0.07),
    ).length,
    0,
    "I bridge lumen must have no membrane caps",
  );
  if (p >= 0.82)
    for (const sx of [-1, 1]) {
      assert.equal(
        intersections(
          new THREE.Vector3(sx * cx, -cy, -0.07),
          new THREE.Vector3(sx * cx, cy, -0.07),
        ).length,
        0,
        "II bridge lumens must connect both cell interiors",
      );
    }
}
// An empty scene could pass the no-cap test; require real enclosing bridge walls.
for (const [a, b] of [
  [
    [0, 1.32, -0.07],
    [0, 1.9, -0.07],
  ],
  [
    [0, 1.32, -0.07],
    [0, 1.32, -0.6],
  ],
  [
    [-2.05, 0, -0.07],
    [-1.5, 0, -0.07],
  ],
  [
    [2.05, 0, -0.07],
    [2.6, 0, -0.07],
  ],
])
  assert(
    intersections(new THREE.Vector3(...a), new THREE.Vector3(...b)).length >= 2,
    "both leaflets must bound the open channel",
  );
// Surface topology: all mesh boundary edges belong to the deliberate front cut.
for (const mesh of membranes) {
  const edges = new Map(),
    p = mesh.geometry.attributes.position;
  const key = (v) => v.map((x) => Math.round(x * 1e5)).join(",");
  for (let i = 0; i < mesh.geometry.drawRange.count; i += 3) {
    const vertices = [0, 1, 2].map((j) => [
      p.getX(i + j),
      p.getY(i + j),
      p.getZ(i + j),
    ]);
    if (
      new THREE.Triangle(
        ...vertices.map((v) => new THREE.Vector3(...v)),
      ).getArea() < 1e-10
    )
      continue;
    for (let j = 0; j < 3; j++) {
      const a = vertices[j],
        b = vertices[(j + 1) % 3],
        code = [key(a), key(b)].sort().join("|");
      const edge = edges.get(code) ?? { count: 0, a, b };
      edge.count++;
      edges.set(code, edge);
    }
  }
  for (const e of edges.values()) {
    if (e.count === 1)
      assert(
        Math.abs(e.a[2]) < 1e-5 && Math.abs(e.b[2]) < 1e-5,
        "no unintended open cracks at bridge mouths",
      );
    else
      assert.equal(
        e.count,
        2,
        "membrane triangles must form a manifold surface",
      );
  }
}
console.log(
  "Division scientific geometry: triangle-surface contacts, arrest, antiparallel overlap, telocentric arms, matched reciprocal junctions, chromosome allocation and open continuous bilayer channels passed.",
);
