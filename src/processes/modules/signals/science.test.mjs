import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import signal from "./signalTransductionProcess.js";
import apoptosis from "./apoptosisProcess.js";
import differentiation from "./differentiationProcess.js";
import immune from "./immuneResponseProcess.js";

const world = (o) => o.getWorldPosition(new THREE.Vector3());
function visibleMeshTriangles(mesh) {
  const p = mesh.geometry.attributes.position,
    n = mesh.geometry.drawRange.count;
  const triangles = [];
  for (let i = 0; i < n; i += 3)
    triangles.push(
      [0, 1, 2].map((j) =>
        new THREE.Vector3()
          .fromBufferAttribute(p, i + j)
          .applyMatrix4(mesh.matrixWorld),
      ),
    );
  return triangles;
}
function enclosed(point, triangles) {
  const ray = new THREE.Ray(
      point,
      new THREE.Vector3(1, 0.071, 0.039).normalize(),
    ),
    hit = new THREE.Vector3(),
    dist = [];
  for (const t of triangles)
    if (ray.intersectTriangle(...t, false, hit))
      dist.push(hit.distanceTo(point));
  dist.sort((a, b) => a - b);
  return (
    dist.filter((d, i) => i === 0 || d - dist[i - 1] > 1e-5).length % 2 === 1
  );
}
function closedComponents(mesh) {
  const p = mesh.geometry.attributes.position,
    count = mesh.geometry.drawRange.count;
  const edges = new Map(),
    neighbors = new Map();
  const key = (i) =>
    [p.getX(i), p.getY(i), p.getZ(i)].map((x) => Math.round(x * 1e5)).join(",");
  for (let i = 0; i < count; i += 3)
    for (const [a, b] of [
      [i, i + 1],
      [i + 1, i + 2],
      [i + 2, i],
    ]) {
      const ka = key(a),
        kb = key(b);
      if (ka === kb) continue;
      const e = [ka, kb].sort().join("|");
      edges.set(e, (edges.get(e) || 0) + 1);
      if (!neighbors.has(ka)) neighbors.set(ka, new Set());
      if (!neighbors.has(kb)) neighbors.set(kb, new Set());
      neighbors.get(ka).add(kb);
      neighbors.get(kb).add(ka);
    }
  for (const n of edges.values())
    assert.equal(n, 2, "each membrane edge has two incident faces");
  let components = 0;
  const visited = new Set();
  for (const v of neighbors.keys())
    if (!visited.has(v)) {
      components++;
      const stack = [v];
      visited.add(v);
      while (stack.length)
        for (const q of neighbors.get(stack.pop()))
          if (!visited.has(q)) {
            visited.add(q);
            stack.push(q);
          }
    }
  return components;
}

const s = signal.create();
for (const condition of ["ligand", "noLigand", "kinaseInactive"]) {
  for (const p of [0.415, 0.42, 0.43, 0.6, 1]) {
    s.update(p, { condition });
    s.group.updateMatrixWorld(true);
    const { ras, sosContact, nucleotide } = s.science;
    if (nucleotide.visible) {
      // Find a point on the actual SOS catalytic sphere lying inside Ras ellipsoid.
      const center = world(sosContact),
        target = world(ras),
        touch = center
          .clone()
          .add(target.clone().sub(center).normalize().multiplyScalar(0.075));
      const local = ras.worldToLocal(touch);
      assert(
        local.length() < 1.02,
        "nucleotide exchange requires physical SOS/Ras contact",
      );
    } else if (condition !== "ligand")
      assert(s.group.getObjectByName("Ras-GDP").visible);
    if (condition !== "ligand") assert(!nucleotide.visible);
  }
}
assert.equal(
  s.science.ras.children.length,
  0,
  "Ras has no transplanted kinase fold",
);
console.log(
  "signals-01/02: contact during exchange, GTPase identity and inactive controls PASS",
);

const a = apoptosis.create(),
  d = differentiation.create(),
  im = immune.create();
for (const model of [s, a, d, im]) {
  model.update(0);
  model.group.updateMatrixWorld(true);
  const fibers = [];
  model.group.traverse((o) => {
    if (o.name === "nucleosome-fiber") fibers.push(o);
  });
  assert(fibers.length);
  for (const fiber of fibers) {
    const cores = fiber.children.filter((o) => o.name === "histone-core"),
      dna = fiber.children.filter((o) => o.name === "nucleosomal-dna");
    assert(cores.length > 0 && dna.length === 2);
    for (const core of cores)
      for (const strand of dna) {
        const matrix = new THREE.Matrix4()
            .copy(core.matrixWorld)
            .invert()
            .multiply(strand.matrixWorld),
          p = strand.geometry.attributes.position;
        const v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(matrix);
          assert(
            !(Math.hypot(v.x, v.z) < 0.0365 && Math.abs(v.y) < 0.0255),
            "DNA tube penetrates histone solid",
          );
        }
      }
  }
}
console.log(
  "signals-03: actual DNA tube vertices excluded from every histone core, all four models PASS",
);

const cargoObjects = a.science.chromatin.map((x) => x.cargo);
for (const p of [0, 0.76, 0.81, 0.87, 0.92, 0.97, 1]) {
  a.update(p);
  a.group.updateMatrixWorld(true);
  const triangles = visibleMeshTriangles(a.science.plasma.mesh);
  for (const c of cargoObjects) {
    assert(
      enclosed(world(c), triangles),
      "existing DNA cargo must remain membrane enclosed",
    );
    assert.equal(
      a.group.getObjectByName(c.name),
      c,
      "same cargo object throughout",
    );
  }
  const components = closedComponents(a.science.plasma.mesh);
  if (p === 0) assert.equal(components, 1);
  if (p === 1)
    assert.equal(components, 6, "parent remnant plus five separate bodies");
}
a.update(1, { condition: "noStress" });
a.group.updateMatrixWorld(true);
assert.equal(closedComponents(a.science.plasma.mesh), 1);
// One closed indented contour, not independent floating crista strips.
const path = a.science.innerPath;
assert(
  new THREE.Vector3(...path[0]).distanceTo(new THREE.Vector3(...path.at(-1))) <
    1e-6,
);
for (const p of path) assert((p[0] / 0.83) ** 2 + (p[1] / 0.43) ** 2 < 1.00001);
assert.equal(
  a.science.mito.children.filter(
    (o) => o.name === "connected-crista-inner-membrane",
  ).length,
  1,
);
let seven = 0,
  eight = 0;
a.group.traverse((o) => {
  if (o.name === "Apaf-propeller-7-blade") seven++;
  if (o.name === "Apaf-propeller-8-blade") eight++;
});
assert.equal(seven, 49);
assert.equal(eight, 56);
console.log(
  "signals-04/05/06: closed membrane components, existing cargo, connected crista contour, seven/eight blades PASS",
);

for (const p of [0, 0.74, 0.78, 0.81, 0.835, 0.86, 0.89, 0.92, 0.95, 1]) {
  d.update(p);
  d.group.updateMatrixWorld(true);
  const triangles = visibleMeshTriangles(d.science.plasma.mesh),
    n = d.science.nuclearSurface,
    positions = n.geometry.attributes.position;
  for (let i = 0; i < positions.count; i += 3) {
    const v = new THREE.Vector3()
      .fromBufferAttribute(positions, i)
      .multiplyScalar(0.999)
      .applyMatrix4(n.matrixWorld);
    assert(
      enclosed(v, triangles),
      `nucleus must fit actual membrane through enucleation p=${p}`,
    );
  }
  const components = closedComponents(d.science.plasma.mesh);
  if (p === 0) assert.equal(components, 1);
  if (p === 1) assert.equal(components, 2);
}
d.update(1, { program: "impaired" });
d.group.updateMatrixWorld(true);
assert.equal(closedComponents(d.science.plasma.mesh), 1);
console.log(
  "signals-07: nucleus envelope inside actual membrane triangles through extrusion; two closed products PASS",
);

// peer-signals-01: the nuclear envelope and its contents must deform together.
// Check ALL DNA surface vertices against actual NE triangles, then supplement
// vertex containment with direct triangle/triangle intersection tests.
const nuclearDna = [];
d.science.nuclear.traverse((o) => {
  if (o.name === "nucleosomal-dna") nuclearDna.push(o);
});
assert.equal(nuclearDna.length, 6);
const neGeometry = d.science.nuclearSurface.geometry.clone();
const neBvh = new MeshBVH(neGeometry);
const dnaCopies = nuclearDna.map((o) => {
  const geometry = o.geometry.clone();
  geometry.boundsTree = new MeshBVH(geometry);
  return { mesh: o, geometry };
});
let dnaContainmentCount = 0,
  dnaSurfacePairs = 0;
for (const program of ["competent", "impaired"]) {
  for (const p of [
    0, 0.7, 0.78, 0.81, 0.835, 0.85, 0.86624, 0.866254, 0.86627, 0.89, 0.92, 1,
  ]) {
    d.update(p, { program });
    d.group.updateMatrixWorld(true);
    const ne = d.science.nuclearSurface;
    neGeometry.attributes.position.array.set(
      ne.geometry.attributes.position.array,
    );
    neBvh.refit();
    const intoNe = ne.matrixWorld.clone().invert();
    for (const { mesh, geometry } of dnaCopies) {
      assert(mesh.visible && mesh.parent.visible, "chromatin remains visible");
      const matrix = intoNe.clone().multiply(mesh.matrixWorld),
        position = mesh.geometry.attributes.position;
      const ray = new THREE.Ray(
        new THREE.Vector3(),
        new THREE.Vector3(1, 0.173, 0.091).normalize(),
      );
      for (let i = 0; i < position.count; i++) {
        ray.origin.fromBufferAttribute(position, i).applyMatrix4(matrix);
        const distances = neBvh
          .raycast(ray, THREE.DoubleSide)
          .map((h) => h.distance)
          .sort((a, b) => a - b);
        const crossings = distances.filter(
          (v, j) => j === 0 || v - distances[j - 1] > 1e-7,
        ).length;
        assert.equal(
          crossings % 2,
          1,
          `DNA surface outside nuclear envelope p=${p} program=${program} vertex=${i}`,
        );
        dnaContainmentCount++;
      }
      geometry.attributes.position.array.set(position.array);
      geometry.boundsTree.refit();
      assert(
        !neBvh.intersectsGeometry(geometry, matrix),
        `DNA triangles cross NE p=${p} program=${program}`,
      );
      dnaSurfacePairs++;
    }
  }
}
neGeometry.dispose();
for (const { geometry } of dnaCopies) geometry.dispose();
console.log(
  `peer-signals-01: ${dnaContainmentCount} complete DNA surface vertex checks and ${dnaSurfacePairs} triangle-pair checks inside NE PASS`,
);

for (const epitope of ["matched", "unmatched"])
  for (const p of [0.46, 0.5, 0.53, 0.56, 0.6, 0.72, 0.78, 0.81, 0.94, 1]) {
    im.update(p, { epitope });
    im.group.updateMatrixWorld(true);
    const { mhc, residues } = im.science;
    residues.forEach((r, i) => {
      const v = mhc.worldToLocal(world(r));
      assert(
        Math.abs(v.x - (-0.1 + i * 0.055)) < 1e-6,
        "peptide long axis remains in MHC groove",
      );
      assert(
        v.y >= 0.39 && v.y <= 0.55 && Math.abs(v.z - 0.09) < 1e-6,
        "peptide remains above groove floor and between walls",
      );
    });
  }
console.log(
  "signals-08: whole peptide follows MHC local groove in both recognition branches PASS",
);

// Include mutable geometry bytes, not just Object3D transforms, in seek checks.
for (const [spec, model] of [
  [signal, s],
  [apoptosis, a],
  [differentiation, d],
  [immune, im],
]) {
  const nodes = [],
    geometries = new Map();
  model.group.traverse((o) => {
    nodes.push(o);
    if (o.geometry) geometries.set(o, o.geometry);
  });
  const materials = new Set(model.materials);
  const snapshot = () => {
    const h = createHash("sha256");
    model.group.traverse((o) => {
      h.update(
        JSON.stringify([
          o.visible,
          ...o.position.toArray(),
          ...o.scale.toArray(),
          ...o.quaternion.toArray(),
        ]),
      );
      if (o.geometry) {
        h.update(JSON.stringify(o.geometry.drawRange));
        for (const attr of Object.values(o.geometry.attributes))
          h.update(Buffer.from(attr.array.buffer));
      }
    });
    return h.digest("hex");
  };
  for (const option of spec.controls[0].options) {
    const parameters = { [spec.controls[0].id]: option.value };
    for (const p of [0, 0.43, 0.835, 1, NaN]) {
      model.update(p, parameters);
      const current = [];
      model.group.traverse((o) => {
        current.push(o);
        if (o.material)
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            assert(materials.has(m));
      });
      assert.deepEqual(current, nodes);
      for (const [o, g] of geometries) {
        assert.equal(o.geometry, g);
        for (const attr of Object.values(g.attributes))
          for (const v of attr.array) assert(Number.isFinite(v));
      }
    }
    model.update(0.835, parameters);
    const before = snapshot();
    model.update(0.1, parameters);
    model.update(0.835, parameters);
    assert.equal(snapshot(), before, "mutable geometry deterministic seek");
  }
}
console.log(
  "all signals: actual geometry bytes deterministic, finite, stable nodes/geometries/materials, all controls PASS",
);
