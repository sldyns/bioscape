import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { acceleratedRaycast, MeshBVH } from "three-mesh-bvh";
import { loadSceneReferences } from "./helpers/load-scene-references.mjs";
const {
  data,
  yeastPoreReference,
  loadDetailModel,
  packDetail,
  unpackDetail,
  createPresentationAppearance,
  specimenDirection,
} = await loadSceneReferences(`
  export { default as data } from "./src/scene/data/yeast-npc-8zzc.json";
  export { yeastPoreReference } from "./src/scene/yeastPoreReference.js";
  export { loadDetailModel } from "./src/scene/loadDetailModel.js";
  export { packDetail, unpackDetail } from "./src/scene/detailTransfer.js";
  export { createPresentationAppearance } from "./src/scene/presentationAppearance.js";
  export { specimenDirection } from "./src/scene/specimenViews.js";
`);
const id = "yeastNuclearPores";
assert.deepEqual(
  [data.entry, data.model, data.sourceBeads],
  ["8ZZC", 1, 234184],
);
assert.equal(data.chains.length, 68);
assert.equal(new Set(data.chains.flatMap((c) => c.copies)).size, 544);
assert.ok(
  data.chains.every(
    (c) => c.copies.length === 8 && c.vertices > 0 && c.triangles > 0,
  ),
);
assert.equal(
  8 * data.chains.reduce((n, c) => n + c.beads, 0),
  data.sourceBeads,
);
assert.ok(data.copyMaxDeviationAngstrom < 0.002);
assert.deepEqual(
  data.chains.find((c) => c.id === "Q").sample,
  [367, 367, 332.318, -27.751, 190.367, 2.78],
);
assert.deepEqual(
  data.chains.find((c) => c.id === "I").sample,
  [112, 112, 380.802, 44.283, -175.775, 3.259],
);

const native = yeastPoreReference();
const shared = native.children[0].geometry;
assert.equal(native.children.length, 8);
assert.equal(native.children.filter((m) => m.userData.cap).length, 2);
assert.ok(
  native.children.every(
    (m) => m.geometry === shared && m.userData.hitId === id,
  ),
);
const triangles = shared.index.count / 3;
assert.equal(
  triangles,
  data.chains.reduce((n, c) => n + c.triangles, 0),
);
assert.ok(8 * triangles < 160000, "Complete model exceeds its triangle budget");
let minRadius = Infinity,
  maxRadius = 0;
const pos = shared.attributes.position;
for (let i = 0; i < pos.count; i++) {
  const r = Math.hypot(pos.getX(i), pos.getZ(i));
  minRadius = Math.min(minRadius, r);
  maxRadius = Math.max(maxRadius, r);
}
assert.ok(minRadius > 0.41 && maxRadius > 1.22 && maxRadius < 1.26);
assert.ok(shared.attributes.normal.array.every(Number.isFinite));
shared.boundsTree = new MeshBVH(shared, { indirect: true });
for (const spoke of native.children) spoke.raycast = acceleratedRaycast;
native.updateMatrixWorld(true);
const ray = new THREE.Raycaster();
ray.firstHitOnly = true;
// Confirm a permeable scaffold core throughout the displayed axial thickness.
const axis = new THREE.Vector3(0, 1, 0).applyQuaternion(native.quaternion);
for (const radius of [0, 0.2, 0.35]) {
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const eye = new THREE.Vector3(
      radius * Math.cos(angle),
      3,
      radius * Math.sin(angle),
    ).applyQuaternion(native.quaternion);
    ray.set(eye, axis.clone().negate());
    assert.equal(ray.intersectObjects(native.children, false).length, 0);
  }
}
const view = new THREE.Vector3(...specimenDirection(id)).normalize();
const firstFaces = new Map();
let firstFace = 0;
for (const chain of data.chains) {
  firstFaces.set(chain.id, firstFace);
  firstFace += chain.triangles;
}
assert.deepEqual(
  native.userData.landmarks.map((a) => a.asymId),
  ["GT", "EZ", "AY", "AP"],
);
for (const landmark of native.userData.landmarks) {
  const point = new THREE.Vector3(...landmark.position).applyMatrix4(
    native.matrixWorld,
  );
  const chain = data.chains.find((c) => c.copies.includes(landmark.asymId));
  const spoke = native.children[chain.copies.indexOf(landmark.asymId)];
  const first = firstFaces.get(chain.id);
  for (const mode of landmark.visibleModes || ["whole", "section"]) {
    const meshes = native.children.filter(
      (m) => mode === "whole" || !m.userData.cap,
    );
    for (const eye of [
      point.clone().addScaledVector(view, 5),
      view.clone().multiplyScalar(5),
    ]) {
      ray.set(eye, point.clone().sub(eye).normalize());
      const hit = ray.intersectObjects(meshes, false)[0];
      assert.equal(hit?.object, spoke, landmark.en);
      assert.ok(
        hit.faceIndex >= first && hit.faceIndex < first + chain.triangles,
        landmark.en,
      );
      assert.ok(hit.point.distanceTo(point) < 1e-5, landmark.en);
    }
  }
}
shared.dispose();
native.children[0].material.dispose();

// Use the production loader and the same ownership transfer as the detail Worker.
const production = await loadDetailModel(id);
assert.equal(production.children.length, 2);
assert.ok(
  production.children.every(
    (m) => m.userData.hitId === id && m.material.vertexColors,
  ),
);
const snapshots = (group) =>
  group.children.map((m) => {
    const hash = createHash("sha256");
    for (const a of [m.geometry.index, ...Object.values(m.geometry.attributes)])
      hash.update(
        new Uint8Array(a.array.buffer, a.array.byteOffset, a.array.byteLength),
      );
    return hash.digest("hex");
  });
const original = snapshots(production);
const packed = packDetail(production, {
  prepareBounds: true,
  prepareSpheres: false,
});
const rebuilt = unpackDetail(
  structuredClone(packed.payload, { transfer: packed.buffers }),
);
assert.ok(packed.buffers.every((b) => b.byteLength === 0));
assert.deepEqual(snapshots(rebuilt), original);
assert.deepEqual(rebuilt.userData.landmarks, production.userData.landmarks);
assert.equal(rebuilt.userData.landmarks.length, 4);
const apply = createPresentationAppearance(rebuilt);
for (const [mode, expected] of [
  ["whole", 8],
  ["section", 6],
  ["whole", 8],
]) {
  apply(mode, null, 1);
  const active = rebuilt.children.filter((m) => m.visible);
  assert.equal(
    active.reduce((count, m) => count + m.geometry.index.count / 3, 0),
    expected * triangles,
  );
  assert.ok(active.length <= 2);
}
for (const group of [rebuilt, production])
  for (const mesh of group.children) {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
console.log(
  "Yeast NPC: 8 verified scaffold spokes, named surface landmarks, open channel, native section and lossless worker transfer",
);
