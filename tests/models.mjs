import assert from "node:assert/strict";
import "./processes.mjs";
import "./model-refinements.mjs";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { createDetailLoader } from "../src/scene/detailLoader";
import { createCellLoader } from "../src/scene/cellLoader";
import { detailModel } from "../src/scene/detailModels";
import { loadDetailModel } from "../src/scene/loadDetailModel";
import { makePresentation } from "../src/scene/presentation";
import { explodedFitDistance } from "../src/scene/viewFraming";
import { supportsExplosion } from "../src/scene/viewCapabilities";
import { packDetail, unpackDetail } from "../src/scene/detailTransfer";
import { packCell, unpackCell, disposeCell } from "../src/scene/cellTransfer";
import { children, getNode } from "../src/hierarchy";
import { parsePath, pathHash } from "../src/navigation";
import { perforatedWall } from "../src/scene/plantWallDetails";
import { envelopePatch } from "../src/scene/bacterialEnvelopeDetails";
import { ribosomeBody } from "../src/scene/ribosomeDetails";
import { describeView } from "../src/viewContext";
import { parameciumDetail } from "../src/scene/parameciumDetails";
import { rootIds } from "../src/catalog/cellTypes";
import { centriolePair, tripletAssembly } from "../src/scene/centrosomeDetails";
import large from "../src/scene/data/ribosome-4ug0-largeSubunit.json";
import small from "../src/scene/data/ribosome-4ug0-smallSubunit.json";
import enzyme from "../src/scene/data/cytosolic-enzyme-1hti.json";
import wheatLarge from "../src/scene/data/ribosome-8jiv-largeSubunit.json";
import wheatSmall from "../src/scene/data/ribosome-8jiw-smallSubunit.json";
import ecoliLarge from "../src/scene/data/ribosome-7k00-largeSubunit.json";
import ecoliSmall from "../src/scene/data/ribosome-7k00-smallSubunit.json";
// Nine outer doublets plus two central microtubules, all with actual lumina.
const axoneme = parameciumDetail("paraAxoneme");
const microtubules = axoneme.children.filter(
  (m) => m.geometry?.type === "ExtrudeGeometry",
);
assert.equal(microtubules.length, 20);
assert.ok(
  microtubules.every((m) => m.geometry.parameters.shapes.holes.length === 1),
);
axoneme.traverse((m) => {
  m.geometry?.dispose();
  m.material?.dispose();
});
for (const id of ["cytosol", "stroma", "matrix", "oxidativeEnzymes"])
  assert.equal(supportsExplosion(id, 2), false);
assert.equal(supportsExplosion("bacterialEnvelope", 4), true);
assert.equal(supportsExplosion("dna", 1), false);
for (const [data, pdb, chainCount, residueCount, subunit] of [
  [wheatLarge, "8JIV", 44, 9203, "largeSubunit"],
  [wheatSmall, "8JIW", 33, 5937, "smallSubunit"],
  [ecoliLarge, "7K00", 31, 6022, "largeSubunit"],
  [ecoliSmall, "7K00", 21, 3916, "smallSubunit"],
]) {
  assert.equal(data.pdb, pdb);
  assert.equal(data.chains.length, chainCount);
  assert.equal(
    data.chains.reduce((n, c) => n + c.residues.length, 0),
    residueCount,
  );
  assert.ok(data.chains.every((c) => c.subunit === subunit));
  for (const chain of data.chains) {
    assert.equal(
      new Set(chain.residues.map((r) => r[0])).size,
      chain.residues.length,
    );
    assert.ok(
      chain.residues.every((r) => r.length === 4 && r.every(Number.isFinite)),
    );
  }
}
const hash = (a) =>
  a
    ? createHash("sha256")
        .update(new Uint8Array(a.buffer, a.byteOffset, a.byteLength))
        .digest("hex")
    : null;
const attrs = (g) =>
  Object.fromEntries(
    Object.entries(g.attributes).map(([k, a]) => [
      k,
      { hash: hash(a.array), size: a.itemSize, normalized: a.normalized },
    ]),
  );
const material = (m) =>
  Object.fromEntries(
    Object.entries(m)
      .filter(
        ([k, v]) =>
          !["id", "uuid", "version"].includes(k) &&
          (v?.isColor ||
            typeof v === "number" ||
            typeof v === "string" ||
            typeof v === "boolean" ||
            v === null),
      )
      .map(([k, v]) => [k, v?.isColor ? v.toArray() : v]),
  );
const mesh = (o) => ({
  attributes: attrs(o.geometry),
  index: hash(o.geometry.index?.array),
  groups: o.geometry.groups,
  drawRange: o.geometry.drawRange,
  material: material(o.material),
  matrix: hash(o.instanceMatrix?.array),
  color: hash(o.instanceColor?.array),
  count: o.count,
  position: o.position.toArray(),
  quaternion: o.quaternion.toArray(),
  scale: o.scale.toArray(),
  castShadow: o.castShadow,
  receiveShadow: o.receiveShadow,
  hit: o.userData.hitId,
  cap: o.userData.cap,
  cut: o.userData.cutOnly,
  assembledOnly: o.userData.assembledOnly,
  nonInteractive: o.userData.nonInteractive,
});
const snapshot = (root) => {
  const result = [];
  root.traverse((o) => {
    if (o.isMesh) result.push(mesh(o));
  });
  return result;
};
const wallMesh = new THREE.Mesh(
  perforatedWall(),
  new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
);
wallMesh.updateMatrixWorld(true);
for (const [x, y] of [
  [-0.78, 0.27],
  [0.67, -0.26],
]) {
  const ray = new THREE.Raycaster(
    new THREE.Vector3(x, y, 2),
    new THREE.Vector3(0, 0, -1),
  );
  assert.equal(
    ray.intersectObject(wallMesh).length,
    0,
    "plasmodesma wall channel is blocked",
  );
}
assert.ok(
  new THREE.Raycaster(
    new THREE.Vector3(1.3, 0.7, 2),
    new THREE.Vector3(0, 0, -1),
  ).intersectObject(wallMesh).length > 0,
);
wallMesh.geometry.dispose();
wallMesh.material.dispose();
// Assembled ribosome subunits must meet rather than start in an exploded pose.
const assembledRibosome = ribosomeBody({ detail: false });
const subunitBounds = (id) => {
  const box = new THREE.Box3();
  assembledRibosome.children
    .filter((o) => o.userData.hitId === id)
    .forEach((o) => box.expandByObject(o));
  return box;
};
const interfaceGap =
  subunitBounds("smallSubunit").min.y - subunitBounds("largeSubunit").max.y;
assert.ok(
  interfaceGap < 0.06 && interfaceGap > -0.04,
  "assembled ribosome interface is separated or intersecting too far",
);
assembledRibosome.traverse((o) => {
  o.geometry?.dispose();
  o.material?.dispose();
});
// Aqueous context must not be merged with pickable layers or lost in a worker.
const assembledEnvelope = detailModel("bacterialEnvelope", envelopePatch());
assert.ok(
  assembledEnvelope.children.some(
    (o) => o.userData.assembledOnly && o.userData.nonInteractive,
  ),
  "periplasm context lost during batching",
);
assert.ok(
  assembledEnvelope.children.some(
    (o) => o.userData.assembledOnly && o.userData.hitId === "bacterialOuter",
  ),
  "outer-membrane attachments lost during batching",
);
assembledEnvelope.traverse((o) => {
  o.geometry?.dispose();
  o.material?.dispose();
});
const canceledLoader = createDetailLoader();
canceledLoader.dispose();
assert.equal(
  await canceledLoader.load("plant"),
  null,
  "disposed loader restarted model generation",
);
// A reply from the previous route must be discarded before reconstructing it.
{
  const originalWorker = Object.getOwnPropertyDescriptor(globalThis, "Worker");
  let worker,
    loader,
    current = true,
    payloadRead = false;
  globalThis.Worker = class {
    constructor() {
      worker = this;
    }
    postMessage(request) {
      this.request = request;
    }
    terminate() {}
  };
  try {
    loader = createDetailLoader();
    const pending = loader.load("dna", () => current);
    current = false;
    worker.onmessage({
      data: {
        request: worker.request.request,
        get payload() {
          payloadRead = true;
          throw new Error("obsolete payload must not be reconstructed");
        },
      },
    });
    assert.equal(await pending, null, "obsolete model reached the new route");
    assert.equal(payloadRead, false, "obsolete geometry was reconstructed");
  } finally {
    loader?.dispose();
    if (originalWorker)
      Object.defineProperty(globalThis, "Worker", originalWorker);
    else delete globalThis.Worker;
  }
}
// Batching must preserve physical material differences, not only vertex data.
const materialFixture = new THREE.Group();
for (const options of [
  { opacity: 0.2, transparent: true },
  { opacity: 0.7, transparent: true },
  { ior: 1.3 },
  { ior: 1.8 },
]) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhysicalMaterial({ color: "#aabbcc", ...options }),
  );
  m.userData.hitId = "fixture";
  materialFixture.add(m);
}
const materialBatched = detailModel("fixture", materialFixture);
assert.equal(
  materialBatched.children.length,
  4,
  "batching collapsed distinct materials",
);
for (const m of materialBatched.children) {
  m.geometry.dispose();
  m.material.dispose();
}
const fallbackLoader = createCellLoader(),
  base = await fallbackLoader.promise;
fallbackLoader.dispose();
const before = snapshot(base.cell),
  textureHash = hash(base.resources[0].image.data);
const groupCounts = Object.fromEntries(
  Object.entries(base.groups).map(([id, g]) => [id, snapshot(g).length]),
);
const packed = packCell(base),
  model = unpackCell(
    structuredClone(packed.payload, { transfer: packed.buffers }),
  );
assert.deepEqual(
  snapshot(model.cell),
  before,
  "whole-cell transfer changed rendering data",
);
assert.equal(
  hash(model.resources[0].image.data),
  textureHash,
  "texture bytes changed",
);
assert.deepEqual(
  Object.fromEntries(
    Object.entries(model.groups).map(([id, g]) => [id, snapshot(g).length]),
  ),
  groupCounts,
);
for (const cap of model.full) assert.equal(cap.userData.cap, true);
assert.equal(
  model.groups.membrane.children[0].material.bumpMap,
  model.resources[0],
);
console.log(
  "Whole-cell worker: every geometry attribute, index, instance, material, transform and texture preserved.",
);
let routeCount = 0;
const reachableNodes = new Set();
function routes(path) {
  const id = path.at(-1);
  reachableNodes.add(id);
  assert.equal(new Set(path).size, path.length, "hierarchy cycle");
  assert.deepEqual(parsePath(pathHash(path)), path);
  assert.deepEqual(parsePath(pathHash([...path, "unknown"])), path);
  if (path.length > 1) {
    assert.ok(describeView(path, "zh"));
    assert.ok(describeView(path, "en"));
  }
  routeCount++;
  for (const next of children[id]) routes([...path, next]);
}
for (const root of rootIds) routes([root]);
assert.deepEqual(
  [...reachableNodes].sort(),
  Object.keys(children).sort(),
  "catalog contains structures unreachable from every model root",
);
assert.deepEqual(parsePath("#/unknown/cell"), ["cell"]);
assert.deepEqual(parsePath(""), ["cell"]);
let detailCount = 0,
  meshes = 0;
for (const id of Object.keys(children)) {
  let detail = await loadDetailModel(id);
  if (detail) {
    const original = snapshot(detail),
      user = structuredClone(detail.userData),
      p = packDetail(detail);
    detail = unpackDetail(structuredClone(p.payload, { transfer: p.buffers }));
    assert.deepEqual(snapshot(detail), original, id + " transfer changed");
    assert.deepEqual(detail.userData, user);
    detailCount++;
  }
  const view = makePresentation(
      rootIds.includes(id) && id !== "cell" ? null : model,
      id,
      detail,
    ),
    box = new THREE.Box3().setFromObject(view.root),
    hits = new Set();
  assert.ok(
    !box.isEmpty() && [...box.min, ...box.max].every(Number.isFinite),
    id + " invalid bounds",
  );
  view.root.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    hits.add(o.userData.hitId);
    assert.ok(
      o.userData.hitId === id || children[id].includes(o.userData.hitId),
      id + " invalid hit",
    );
    for (const a of Object.values(o.geometry.attributes))
      assert.ok(a.array.every(Number.isFinite), id + " non-finite geometry");
  });
  for (const child of children[id])
    assert.ok(hits.has(child), id + " missing clickable child " + child);
  for (const part of view.parts) {
    assert.ok(part.userData.labelAnchor.toArray().every(Number.isFinite));
    assert.ok(part.userData.offset.toArray().every(Number.isFinite));
  }
  if (view.parts.length > 1) {
    for (const aspect of [0.45, 1.2])
      for (const amount of [0, 0.6, 1])
        for (const direction of [
          new THREE.Vector3(0, 0, 1),
          new THREE.Vector3(1, 0.4, 0.6).normalize(),
        ]) {
          const camera = new THREE.PerspectiveCamera(35, aspect, 0.01, 200);
          camera.position.copy(direction);
          camera.lookAt(0, 0, 0);
          camera.updateMatrixWorld();
          const axes = [0, 1, 2].map((axis) =>
            new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, axis),
          );
          const distance = explodedFitDistance(
            view.parts,
            amount,
            aspect,
            camera.fov,
            axes,
          );
          camera.position.copy(direction).multiplyScalar(distance);
          camera.updateMatrixWorld();
          for (const part of view.parts) {
            // Compare actual transformed part bounds with the perspective frustum.
            part.position
              .copy(part.userData.home)
              .addScaledVector(part.userData.offset, amount);
            part.updateWorldMatrix(true, true);
            const bounds = new THREE.Box3().setFromObject(part);
            for (const x of [bounds.min.x, bounds.max.x])
              for (const y of [bounds.min.y, bounds.max.y])
                for (const z of [bounds.min.z, bounds.max.z]) {
                  const screen = new THREE.Vector3(x, y, z).project(camera);
                  assert.ok(
                    Math.abs(screen.x) < 1 &&
                      Math.abs(screen.y) < 1 &&
                      screen.z < 1,
                    `${id} clips at separation ${amount}, aspect ${aspect}`,
                  );
                }
          }
        }
  }
  for (const lang of ["zh", "en"]) {
    const node = getNode(id, lang);
    assert.ok(node.name && node.desc);
    assert.deepEqual(node.children, children[id]);
  }
  view.root.traverse((o) => {
    if (o.isMesh) {
      o.material.dispose();
      if (!o.userData.sharedGeometry) o.geometry.dispose();
    }
  });
}
model.cell.updateMatrixWorld(true);
const boxes = Object.entries(model.groups)
  .filter(([id]) => !["membrane", "cytoplasm", "cytoskeleton"].includes(id))
  .flatMap(([id, g]) => (id === "mitochondria" ? g.children : [g]))
  .map((g) => new THREE.Box3().setFromObject(g).expandByScalar(0.025));
const points = model.groups.cytoplasm.children[0],
  matrix = new THREE.Matrix4(),
  point = new THREE.Vector3();
for (let i = 0; i < points.count; i++) {
  points.getMatrixAt(i, matrix);
  point.setFromMatrixPosition(matrix);
  assert.ok(!boxes.some((b) => b.containsPoint(point)));
  assert.ok(
    (point.x / 2.8) ** 2 + (point.y / 2.9) ** 2 + (point.z / 2.2) ** 2 <=
      1.000001,
  );
}
const pair = centriolePair(),
  axes = pair.children.map((g) =>
    new THREE.Vector3(0, 1, 0).applyQuaternion(g.quaternion),
  );
assert.ok(Math.abs(axes[0].dot(axes[1])) < 1e-10);
for (const centriole of pair.children)
  assert.equal(centriole.children.filter((c) => c.userData.triplet).length, 9);
const triplet = tripletAssembly(),
  laneCounts = new Map();
for (const m of triplet.children)
  if (m.geometry.type === "CylinderGeometry") {
    const c = m.material.color.getHexString();
    laneCounts.set(c, (laneCounts.get(c) || 0) + 1);
  }
assert.deepEqual([...laneCounts.values()], [13, 10, 10]);
triplet.updateMatrixWorld(true);
const ray = new THREE.Raycaster();
for (let k = 0; k < 3; k++) {
  ray.set(new THREE.Vector3(k * 0.14 * 1.6, 2, 0), new THREE.Vector3(0, -1, 0));
  assert.equal(ray.intersectObject(triplet, true).length, 0);
}
assert.equal(large.chains.length + small.chains.length, 79);
assert.equal(
  [...large.chains, ...small.chains].reduce((n, c) => n + c.residues.length, 0),
  17156,
);
assert.equal(large.sha256, small.sha256);
assert.deepEqual(
  Object.values(enzyme.chains).map((c) => c.length),
  [248, 248],
);
disposeCell(model);
console.log(
  JSON.stringify({
    nodes: Object.keys(children).length,
    routes: routeCount,
    detailTransfers: detailCount,
    meshes,
    cytosolMarkers: points.count,
    errors: 0,
  }),
);
