import assert from "node:assert/strict";
import "./seek.test.mjs";
import * as THREE from "three";
import division from "./plantDivisionProcess.js";
import fertilization from "./doubleFertilizationProcess.js";
import hyphae from "./fungalHyphaeProcess.js";

const objects = (g, name) => {
  const a = [];
  g.traverse((n) => {
    if (n.name === name) a.push(n);
  });
  return a;
};
const visible = (n) => n.visible && (!n.parent || visible(n.parent));
const world = (n) => n.getWorldPosition(new THREE.Vector3());
const update = (v, p, params) => {
  v.update(p, params);
  v.group.updateMatrixWorld(true);
};
const resources = (g) => {
  const a = [];
  g.traverse((n) => a.push([n.uuid, n.geometry?.uuid, n.material?.uuid]));
  return a;
};
const snapshot = (g) => {
  const a = [];
  g.traverse((n) => {
    a.push(
      n.visible,
      ...n.position.toArray(),
      ...n.quaternion.toArray(),
      ...n.scale.toArray(),
    );
    if (n.geometry) {
      const { geometry: geo } = n;
      const count = Math.min(
        geo.drawRange.count,
        geo.attributes.position.count,
      );
      let sum = 0,
        weighted = 0;
      for (let i = 0; i < count * 3; i++) {
        const x = geo.attributes.position.array[i];
        assert(Number.isFinite(x));
        sum += x;
        weighted += x * (i % 997);
      }
      a.push(count, sum, weighted);
    }
  });
  return a;
};
// Weld actual rendered triangles, then inspect connectivity and boundary edges.
// This sees open slabs, disconnected caps and missing parent junctions directly.
function components(mesh) {
  const attr = mesh.geometry.attributes.position;
  const n = mesh.geometry.drawRange.count;
  const ids = new Map(),
    vertices = [],
    parent = [],
    edges = new Map(),
    faces = [];
  function vertex(i) {
    const p = [attr.getX(i), attr.getY(i), attr.getZ(i)];
    const key = p.map((x) => Math.round(x * 1e5)).join(",");
    if (!ids.has(key)) {
      ids.set(key, vertices.length);
      parent.push(vertices.length);
      vertices.push(p);
    }
    return ids.get(key);
  }
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < n; i += 3) {
    const v = [vertex(i), vertex(i + 1), vertex(i + 2)];
    if (new Set(v).size < 3) continue;
    faces.push(v);
    parent[find(v[1])] = find(v[0]);
    parent[find(v[2])] = find(v[0]);
    for (let j = 0; j < 3; j++) {
      const edge = [v[j], v[(j + 1) % 3]].sort((a, b) => a - b).join(":");
      edges.set(edge, (edges.get(edge) || 0) + 1);
    }
  }
  const groups = new Map();
  vertices.forEach((p, i) => {
    const root = find(i);
    if (!groups.has(root))
      groups.set(root, {
        points: [],
        boundary: [],
        edgeCount: 0,
        faceCount: 0,
      });
    groups.get(root).points.push(p);
  });
  for (const [key, count] of edges) {
    const [a, b] = key.split(":").map(Number);
    groups.get(find(a)).edgeCount++;
    assert(count <= 2, "membrane has no non-manifold seams");
    if (count === 1)
      groups.get(find(a)).boundary.push([vertices[a], vertices[b]]);
  }
  for (const f of faces) groups.get(find(f[0])).faceCount++;
  return [...groups.values()].map((c) => ({
    ...c,
    euler: c.points.length - c.edgeCount + c.faceCount,
  }));
}
const d = division.create();
const inventory = resources(d.group);
const membrane = objects(
  d.group,
  "Continuous cell-plate lumen membrane and parental junction",
)[0];
assert(membrane, "a real continuous membrane mesh is required");
for (const p of [0.13, 0.2, 0.27, 0.32, 0.35]) {
  update(d, p);
  const fibers = objects(d.group, "Kinetochore microtubule");
  const chromatids = objects(d.group, "Condensed looped chromatin chromatid");
  assert.equal(fibers.length, 8);
  fibers.forEach((f, i) => {
    const target = world(
      objects(chromatids[i], "Kinetochore attachment domain")[0],
    );
    const end = new THREE.Vector3(0, 0.5, 0).applyMatrix4(f.matrixWorld);
    assert(
      end.distanceTo(target) < 1e-6,
      "spindle tip follows actual moving kinetochore",
    );
  });
}
for (const p of [0.44, 0.53, 0.65]) {
  update(d, p);
  const c = components(membrane);
  const plate = c.find((c) =>
    c.points.some(
      ([x, y, z]) =>
        Math.abs(x) < 0.05 && Math.abs(z) < 0.05 && Math.abs(y) > 0.07,
    ),
  );
  assert(plate, "cell-plate lumen exists");
  assert(
    plate.points.some((p) => p[1] > 0.07) &&
      plate.points.some((p) => p[1] < -0.07),
    "both membrane faces connected through their rim",
  );
  assert.equal(
    plate.boundary.length,
    0,
    "growing plate encloses a lumen before parent fusion",
  );
  if (p === 0.44)
    assert(plate.euler < 2, "early membrane network has actual through-pores");
  if (p === 0.65)
    assert.equal(plate.euler, 2, "fenestrations close to produce a sheet");
}
// A late incoming vesicle has joined the rim: a ray through their shared
// lumen must not hit an obsolete plate-side cap before its outer membrane.
update(d, 0.484);
const incoming = objects(d.group, "Closed incoming cell-plate vesicle")[0];
assert(!incoming.visible);
const ray = new THREE.Raycaster(
  new THREE.Vector3(0, 0.02, 0),
  new THREE.Vector3(1, 0, 0),
);
const hits = ray.intersectObject(membrane, false);
assert(hits.length > 0);
assert(
  hits[0].point.x > incoming.position.x + 0.035,
  "vesicle fusion removes the internal membrane cap and opens a shared lumen",
);
update(d, 0.65);
// Delivery sits on the actual triangulated margin, not an ellipse inside a rectangle.
const tri = new THREE.Triangle(),
  point = new THREE.Vector3(),
  nearest = new THREE.Vector3();
const attr = membrane.geometry.attributes.position;
for (const m of objects(
  d.group,
  "Phragmoplast microtubule protofilament cylinder",
)) {
  point.set(m.position.x, 0, m.position.z);
  let distance = Infinity;
  for (let i = 0; i < membrane.geometry.drawRange.count; i += 3) {
    tri.a.fromBufferAttribute(attr, i);
    tri.b.fromBufferAttribute(attr, i + 1);
    tri.c.fromBufferAttribute(attr, i + 2);
    tri.closestPointToPoint(point, nearest);
    distance = Math.min(distance, point.distanceTo(nearest));
  }
  assert(
    distance < 0.12,
    "delivery route reaches membrane margin, allowing the 0.095 fusion bulge and mesh sampling",
  );
}
update(d, 1);
const joined = components(membrane).filter((c) =>
  c.points.some(([x, y, z]) => Math.abs(x) < 0.05 && Math.abs(z) < 0.05),
);
assert(joined.length > 0);
for (const c of joined) {
  assert(
    c.points.some(([x]) => x > 2.35) && c.points.some(([x]) => x < -2.35),
    "daughter plate membrane is continuous with both parent side membranes",
  );
  for (const edge of c.boundary)
    for (const p of edge)
      assert(
        Math.abs(Math.abs(p[1]) - 0.5) < 1e-5 ||
          Math.abs(Math.abs(p[2]) - 0.88) < 1e-5,
        "open edges occur only at stated display cuts/continuations",
      );
}
update(d, 0.53);
const seek = snapshot(d.group);
update(d, 0.2);
update(d, 0.53);
assert.deepEqual(snapshot(d.group), seek);
assert.deepEqual(resources(d.group), inventory);
console.log(
  "plantGrowth-01/02: actual membrane closure, margin, parent junction, moving kinetochore attachment passed",
);

const f = fertilization.create();
const fi = resources(f.group);
for (const assignment of ["frontEgg", "frontCentral"]) {
  for (const p of [
    0.1, 0.5, 0.7, 0.7199, 0.72, 0.725, 0.7299, 0.73, 0.75, 0.85,
  ]) {
    update(f, p, { assignment });
    const nuclei = [
      ...objects(f.group, "Paternal nucleus carried by sperm"),
      ...objects(f.group, "Paternal nuclear contribution after fusion"),
    ].filter(visible);
    assert.equal(
      nuclei.length,
      2,
      "exactly two visible paternal identities across fusion handoff",
    );
  }
  update(f, 0.91, { assignment });
  const basal = objects(f.group, "Basal embryo cell")[0],
    apical = objects(f.group, "Apical embryo cell")[0];
  assert(visible(basal) && visible(apical));
  assert(
    basal.scale.x * basal.scale.y * basal.scale.z >
      2 * apical.scale.x * apical.scale.y * apical.scale.z,
  );
  assert(
    basal.position.y + basal.scale.y < apical.position.y - apical.scale.y,
    "nonoverlapping unequal cells, larger daughter toward micropyle",
  );
  for (const name of [
    "Basal embryo cell nucleus 2n",
    "Apical embryo cell nucleus 2n",
  ])
    assert.equal(objects(f.group, name).filter(visible).length, 1);
  update(f, 0.725, { assignment });
  const s = snapshot(f.group);
  update(f, 1, { assignment });
  update(f, 0.725, { assignment });
  assert.deepEqual(snapshot(f.group), s);
}
assert.deepEqual(resources(f.group), fi);
console.log(
  "plantGrowth-03/04: asymmetric geometry and exclusive paternal nuclear identities passed for both assignments",
);

const h = hyphae.create();
const hi = resources(h.group);
const cables = objects(h.group, "Compartment-local transport cable");
assert.equal(cables.length, 6);
for (const delivery of ["normal", "reduced"]) {
  for (let j = 0; j <= 40; j++) {
    update(h, j / 40, { delivery });
    for (const cable of cables) {
      const box = new THREE.Box3().setFromObject(cable);
      for (const x of [-2.8, -1.4])
        assert(
          box.max.x < x - 0.04 || box.min.x > x + 0.04,
          "transport cable cannot pass through septal solid slab",
        );
    }
    const vesicles = objects(
      h.group,
      "Cutaway vesicle with lumen and paired membrane rims",
    ).filter((m) => m.parent === h.group && visible(m));
    for (const v of vesicles)
      v.traverse((n) => {
        if (!n.geometry) return;
        const a = n.geometry.attributes.position;
        for (let i = 0; i < a.count; i++) {
          point.fromBufferAttribute(a, i).applyMatrix4(n.matrixWorld);
          if ([-2.8, -1.4].some((x) => Math.abs(point.x - x) < 0.04))
            assert(
              Math.hypot(point.y, point.z) < 0.149,
              "entire vesicle geometry clears the septal pore rim",
            );
        }
      });
  }
  update(h, 0.55, { delivery });
  const bundles = objects(h.group, "Extracellular wall polymer bundle").filter(
    visible,
  );
  const positions = bundles.map(world);
  const tip = world(objects(h.group, "Advancing hyphal apical wall")[0]).x;
  update(h, 0.95, { delivery });
  assert(world(objects(h.group, "Advancing hyphal apical wall")[0]).x > tip);
  bundles.forEach((m, i) => {
    assert(
      world(m).distanceTo(positions[i]) < 1e-8,
      "deposited wall material stays behind advancing apex",
    );
    assert(
      Math.hypot(m.position.y, m.position.z) > 0.77,
      "retained bundles lie outside the wall cylinder, not in cytoplasm",
    );
  });
  const s = snapshot(h.group);
  update(h, 0.1, { delivery });
  update(h, 0.95, { delivery });
  assert.deepEqual(snapshot(h.group), s);
}
assert.deepEqual(resources(h.group), hi);
console.log(
  "plantGrowth-05/06: real cable/vesicle pore clearance and retained wall cohorts passed for both delivery controls",
);
