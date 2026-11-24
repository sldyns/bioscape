import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { MeshBVH } from "three-mesh-bvh";
import { plantCytosol } from "../src/scene/plantCytosol.js";
import { packDetail, unpackDetail } from "../src/scene/detailTransfer.js";
import { createPresentationAppearance } from "../src/scene/presentationAppearance.js";

const source = plantCytosol();
source.updateMatrixWorld(true);
const choose = (g, filter) =>
  g.children.filter((o) => filter(o.material.name, o));
const tonoplast = (g) =>
  choose(g, (n) => n.startsWith("tonoplast ·") && !n.includes("cut edge"));
const exterior = (g) =>
  choose(
    g,
    (n) => n.startsWith("cortical cytoplasm ·") && !n.includes("exposed"),
  );
const tag = "plantCytoplasm";
const p = new THREE.Vector3(),
  q = new THREE.Vector3(),
  r = new THREE.Vector3();
function worldGeometry(meshes) {
  const geometries = meshes.map((m) => {
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    for (const n of Object.keys(g.attributes))
      if (n !== "position") g.deleteAttribute(n);
    return g;
  });
  const whole = mergeGeometries(geometries);
  for (const g of geometries) g.dispose();
  return whole;
}

// A closed orientable two-manifold must have two opposite uses of every edge.
// Its connected components and Euler characteristic distinguish a vacuole
// traversed by two tunnels from capped, intersecting or detached cylinders.
function topology(geometry, label) {
  const pos = geometry.attributes.position;
  const ids = [],
    vmap = new Map(),
    edges = new Map(),
    parents = [];
  const key = (a, b) => (a < b ? a + "," + b : b + "," + a);
  function find(i) {
    while (parents[i] !== i) {
      parents[i] = parents[parents[i]];
      i = parents[i];
    }
    return i;
  }
  for (let i = 0; i < pos.count; i++) {
    const k = [pos.getX(i), pos.getY(i), pos.getZ(i)]
      .map((v) => Math.round(v * 1e6))
      .join(",");
    if (!vmap.has(k)) {
      vmap.set(k, parents.length);
      parents.push(parents.length);
    }
    ids[i] = vmap.get(k);
  }
  let faces = 0,
    volume = 0;
  const index = geometry.index;
  for (let i = 0; i < index.count; i += 3) {
    const ia = index.getX(i),
      ib = index.getX(i + 1),
      ic = index.getX(i + 2);
    const a = ids[ia],
      b = ids[ib],
      c = ids[ic];
    assert(a !== b && b !== c && c !== a, `${label}: collapsed triangle`);
    p.fromBufferAttribute(pos, ia);
    q.fromBufferAttribute(pos, ib);
    r.fromBufferAttribute(pos, ic);
    volume += p.dot(q.cross(r)) / 6;
    faces++;
    for (const [v, w] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      parents[find(v)] = find(w);
      const e = key(v, w);
      const pair = edges.get(e) ?? [0, 0];
      pair[0]++;
      pair[1] += v < w ? 1 : -1;
      edges.set(e, pair);
    }
  }
  for (const [edge, [count, balance]] of edges) {
    assert(
      count === 2 && balance === 0,
      `${label}: open, duplicated or incorrectly oriented seam ${edge} (${count}/${balance})`,
    );
  }
  const components = new Set(parents.map((_, i) => find(i))).size;
  return {
    components,
    euler: parents.length - edges.size + faces,
    volume,
    faces,
  };
}
function bvh(geometry) {
  geometry.boundsTree = new MeshBVH(geometry, { indirect: true });
  return geometry.boundsTree;
}
const rayDirection = new THREE.Vector3(0.739, 0.287, 0.613).normalize();
function contains(surface, point) {
  const hits = surface
    .raycast(new THREE.Ray(point, rayDirection), THREE.DoubleSide)
    .map((h) => h.distance)
    .sort((a, b) => a - b);
  const distinct = hits.filter((h, i) => i === 0 || h - hits[i - 1] > 1e-6);
  return distinct.length % 2 === 1;
}
function checkCompartments(model) {
  model.updateMatrixWorld(true);
  const membrane = worldGeometry(tonoplast(model)),
    skin = worldGeometry(exterior(model));
  const mt = topology(membrane, "tonoplast"),
    ot = topology(skin, "outer cell surface");
  assert.deepEqual([mt.components, mt.euler], [1, -2]);
  assert.deepEqual([ot.components, ot.euler], [1, 2]);
  assert(mt.volume > 0 && ot.volume > mt.volume);
  const mem = bvh(membrane),
    out = bvh(skin);
  assert(
    !mem.intersectsGeometry(skin, new THREE.Matrix4()),
    "The tonoplast intersects the cell exterior",
  );
  return { mt, ot, mem, out };
}
const { mt, ot, mem, out } = checkCompartments(source);
// Require complete envelope and lamellar triangles to lie in the cortex.
const identity = new THREE.Matrix4();
const plastids = (g) =>
  choose(g, (n) => n.startsWith("cortical chloroplast ·"));
const anterior = bvh(
  worldGeometry(exterior(source).filter((o) => o.userData.cap)),
);
const posterior = bvh(
  worldGeometry(exterior(source).filter((o) => !o.userData.cap)),
);
const cutFace = bvh(
  worldGeometry(
    choose(source, (n) => n === "cortical cytoplasm · exposed section"),
  ),
);
function cortexClearance(geometry, mem, out) {
  bvh(geometry);
  // A sample of the actual surface also works on worker-merged plastids.
  const vertex = new THREE.Vector3().fromBufferAttribute(
    geometry.attributes.position,
    0,
  );
  assert(
    contains(out, vertex) && !contains(mem, vertex),
    "Plastid leaves the cortical volume",
  );
  assert(
    !out.intersectsGeometry(geometry, identity),
    "Plastid intersects the external cell surface",
  );
  assert(
    !mem.intersectsGeometry(geometry, identity),
    "Plastid intersects the vacuolar membrane",
  );
  const dm = mem.closestPointToGeometry(geometry, identity).distance;
  const dx = out.closestPointToGeometry(geometry, identity).distance;
  assert(
    Math.min(dm, dx) > 0.003,
    "Insufficient separation from the tonoplast or the cell exterior",
  );
  return [dm, dx];
}
const plastidGaps = [];
let anteriorBodies = 0,
  posteriorBodies = 0;
for (const organelle of plastids(source)) {
  const geometry = worldGeometry([organelle]);
  const gap = cortexClearance(geometry, mem, out);
  assert(
    !cutFace.intersectsGeometry(geometry, identity),
    "A section-plane organelle requires a real cut surface",
  );
  const center = organelle.getWorldPosition(new THREE.Vector3());
  const belongsToCap =
    anterior.closestPointToPoint(center).distance <
    posterior.closestPointToPoint(center).distance;
  assert.equal(
    Boolean(organelle.userData.cap),
    belongsToCap,
    "Plastid visibility must follow the sliced cortical patch",
  );
  if (organelle.material.name.endsWith("envelope")) {
    if (belongsToCap) anteriorBodies++;
    else posteriorBodies++;
  }
  plastidGaps.push(gap);
}
assert.deepEqual([anteriorBodies, posteriorBodies], [1, 2]);
assert.equal(plastidGaps.length, 12);
const minDM = Math.min(...plastidGaps.map(([a]) => a));
const minDX = Math.min(...plastidGaps.map(([, b]) => b));
// Inverse controls ensure an opened sleeve and an organelle in sap fail.
assert.throws(
  () =>
    topology(
      worldGeometry(
        tonoplast(source).filter(
          (o) => o.material.name !== "tonoplast · strand window",
        ),
      ),
      "opened sleeve",
    ),
  /open, duplicated/,
);
const displaced = new THREE.SphereGeometry(0.03, 12, 8).translate(
  ...source.userData.landmarks.find((l) => l.annotationKind === "context")
    .position,
);
assert.throws(
  () => cortexClearance(displaced, mem, out),
  /leaves the cortical volume/,
);
const cables = choose(
  source,
  (n) => n === "cytoplasmic strands · actin bundles",
);
assert.equal(cables.length, 4);
let closest = Infinity;
for (const cable of cables) {
  const path = cable.geometry.parameters.path;
  const radius = cable.geometry.parameters.radius;
  const left = path.getPointAt(0),
    right = path.getPointAt(1);
  assert(
    left.x < -1.7 && right.x > 1.7,
    "A strand does not reach both cortical flanks",
  );
  for (let i = 0; i <= 120; i++) {
    const center = path.getPointAt(i / 120);
    assert(
      contains(out, center),
      "Cortical/strand cable leaves the cell boundary",
    );
    assert(
      !contains(mem, center),
      "A cable segment passes through cell sap or a capped tunnel",
    );
    const gap = mem.closestPointToPoint(center).distance - radius;
    closest = Math.min(closest, gap);
    assert(gap > 0.009, `A cable intersects the tonoplast: ${gap}`);
  }
  // Starting in a real mid-strand, every transverse ray must enter the
  // continuous vacuole by crossing its sleeve.
  const center = path.getPointAt(0.52);
  for (const dir of [
    [0, 1, 0],
    [0, -1, 0],
    [0, 0, 1],
    [0, 0, -1],
  ]) {
    const d = new THREE.Vector3(...dir);
    const hit = mem.raycastFirst(new THREE.Ray(center, d), THREE.DoubleSide);
    assert(hit && hit.distance < 0.32 && hit.distance > 0.02);
    assert(contains(mem, hit.point.clone().addScaledVector(d, 0.015)));
  }
}
assert.equal(source.userData.landmarks.length, 4);
for (const landmark of source.userData.landmarks) {
  assert(
    landmark.en && landmark.zh && landmark.position.every(Number.isFinite),
  );
  const point = new THREE.Vector3(...landmark.position);
  if (landmark.en.startsWith("Cortical")) {
    assert(contains(out, point) && !contains(mem, point));
  } else if (landmark.en.startsWith("Transvacuolar")) {
    assert(contains(out, point) && !contains(mem, point));
  } else if (landmark.en.startsWith("Continuous")) {
    assert(mem.closestPointToPoint(point).distance < 1e-5);
  } else {
    assert(contains(mem, point));
    assert.equal(landmark.annotationKind, "context");
  }
}
for (const o of source.children) assert.equal(o.userData.hitId, tag);

// Compile the same extensionless imports used by the application's detail
// loader. The model still uses the installation's Three.js classes.
const workspace = fileURLToPath(new URL("..", import.meta.url));
const packed = await build({
  stdin: {
    contents: 'export {detailModel} from "./src/scene/detailModels.js";',
    resolveDir: workspace,
  },
  bundle: true,
  platform: "node",
  format: "cjs",
  packages: "external",
  write: false,
  logLevel: "silent",
});
const require = createRequire(import.meta.url);
const Module = require("node:module");
const bundle = new Module(import.meta.filename);
bundle.paths = Module._nodeModulePaths(workspace);
bundle._compile(packed.outputFiles[0].text, import.meta.filename);
const merged = bundle.exports.detailModel(tag, source);
const { payload, buffers } = packDetail(merged, { prepareBounds: true });
const transferred = unpackDetail(
  structuredClone(payload, { transfer: buffers }),
);
assert.deepEqual(transferred.userData.landmarks, source.userData.landmarks);
const check = checkCompartments(transferred);
assert.deepEqual(check.mt, mt);
assert.deepEqual(check.ot, ot);
for (const piece of plastids(transferred))
  cortexClearance(worldGeometry([piece]), check.mem, check.out);
const appearance = createPresentationAppearance(transferred);
const count = (g) =>
  g.children
    .filter((o) => o.visible)
    .reduce(
      (n, o) =>
        n +
        (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3,
      0,
    );
appearance("whole", null);
assert(choose(transferred, (_, o) => o.userData.cap).every((o) => o.visible));
assert(
  choose(transferred, (_, o) => o.userData.cutOnly).every((o) => !o.visible),
);
const whole = count(transferred);
appearance("section", null);
assert(choose(transferred, (_, o) => o.userData.cap).every((o) => !o.visible));
assert(
  choose(transferred, (_, o) => o.userData.cutOnly).every((o) => o.visible),
);
const cut = count(transferred);
assert(cut < whole && whole < 50000 && transferred.children.length <= 18);
assert(transferred.children.every((o) => o.userData.hitId === tag));
console.log(
  `PASS: one closed tonoplast, Euler ${mt.euler}; two cortex-to-cortex cytoplasmic tunnels, one closed cortex, minimum measured cable clearance ${closest.toFixed(5)}. All 12 plastid envelope/lamellar meshes stay in the cortex (min distances to tonoplast/exterior ${minDM.toFixed(5)} / ${minDX.toFixed(5)}); the one removed anterior plastid toggles with its cortex. Open-sleeve and displaced-plastid inverse controls rejected. Worker payload preserves both topologies and four bilingual landmarks. ${transferred.children.length} merged meshes, ${whole} whole / ${cut} section triangles.`,
);
