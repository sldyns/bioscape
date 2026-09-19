import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { exactIndexGeometry } from "../src/scene/exactGeometry";
import {
  thylakoidField,
  thylakoidSamples,
} from "../src/scene/chloroplastDetails";
import { plantDetail } from "../src/scene/plantDetails";
import { bacteriaDetail } from "../src/scene/bacteriaDetails";
import { loadDetailModel } from "../src/scene/loadDetailModel";
import { makePresentation } from "../src/scene/presentation";
import { children } from "../src/hierarchy";

function dispose(root) {
  const geometries = new Set(),
    materials = new Set();
  root.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) materials.add(o.material);
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}
function triangleHash(geometry) {
  const hash = createHash("sha256");
  for (const attribute of Object.values(geometry.attributes)) {
    const bits = new Uint32Array(
      attribute.array.buffer,
      attribute.array.byteOffset,
      attribute.array.length,
    );
    const expanded = new Uint32Array(
      (geometry.index?.count ?? attribute.count) * attribute.itemSize,
    );
    for (let i = 0; i < expanded.length / attribute.itemSize; i++) {
      const index = geometry.index ? geometry.index.getX(i) : i;
      expanded.set(
        bits.subarray(
          index * attribute.itemSize,
          (index + 1) * attribute.itemSize,
        ),
        i * attribute.itemSize,
      );
    }
    hash.update(new Uint8Array(expanded.buffer));
  }
  return hash.digest("hex");
}
for (const indexed of [
  new THREE.SphereGeometry(1, 36, 24),
  new THREE.TorusGeometry(0.8, 0.2, 12, 32),
]) {
  const expanded = indexed.toNonIndexed(),
    before = triangleHash(expanded),
    count = expanded.attributes.position.count;
  exactIndexGeometry(expanded);
  assert.equal(
    triangleHash(expanded),
    before,
    "Indexing must retain every triangle attribute bit",
  );
  assert.equal(expanded.index.count, count);
  assert.ok(expanded.attributes.position.count < count);
  indexed.dispose();
  expanded.dispose();
}
const samples = thylakoidSamples();
for (let i = 0; i < 200; i++) {
  const p = [
    Math.sin(i * 2.4) * 1.3,
    Math.cos(i) * 0.6,
    Math.sin(i * 1.2) * 0.5,
  ];
  const reference = Math.max(
    ...samples.map(
      ({ p: c, r }) =>
        1 - p.reduce((s, v, j) => s + ((v - c[j]) / r[j]) ** 2, 0),
    ),
  );
  assert.equal(
    thylakoidField(samples, p),
    reference,
    "Field optimization must preserve exact values",
  );
}
const plant = plantDetail("plant");
plant.rotation.set(0, 0, 0);
plant.updateMatrixWorld(true);
const position = new THREE.Vector3();
let chloroplasts = 0;
for (const organelle of plant.children) {
  if (!organelle.isGroup) continue;
  let tested = false;
  organelle.traverse((mesh) => {
    if (!mesh.isMesh || mesh.userData.hitId !== "chloroplast") return;
    tested = true;
    const p = mesh.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      position.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld);
      const membrane = [position.x, position.y, position.z].reduce(
        (s, x, j) => s + (Math.abs(x) / [1.988, 2.438, 1.178][j]) ** (2 / 0.42),
        0,
      );
      assert.ok(
        membrane < 1,
        "Chloroplast protrudes beyond inner cell membrane",
      );
      let x = (position.x - 0.31) / 1.03,
        y = position.y / 1.03,
        z = (position.z + 0.06) / 1.03;
      const k = 0.31 * Math.exp(-(((y - 0.7) / 0.53) ** 2));
      if (x < 0) x = x > -0.6 + k ? x / (1 - k / 0.6) : x - k;
      assert.ok(
        (x / 1.4) ** 2 + (y / 1.85) ** 2 + (z / 1.04) ** 2 > 1,
        "Chloroplast intersects vacuole",
      );
    }
  });
  if (tested) chloroplasts++;
}
assert.equal(chloroplasts, 3);
dispose(plant);
const bacterium = bacteriaDetail("bacterium");
let retained = 0,
  removed = 0;
bacterium.traverse((mesh) => {
  if (mesh.isMesh && mesh.userData.hitId === "pili") {
    if (mesh.userData.cap) removed++;
    else retained++;
  }
});
assert.ok(
  removed > 0 && retained > 0,
  "Cutaway must hide front pili while retaining rear pili",
);
dispose(bacterium);
for (const id of ["paraMacro", "paraMicro", "yeastNucleus"]) {
  const group = await loadDetailModel(id),
    view = makePresentation(null, id, group);
  assert.equal(view.parts.length, children[id].length);
  for (const child of children[id]) {
    assert.ok(view.parts.some((p) => p.userData.hitId === child));
    assert.ok(
      view.parts
        .find((p) => p.userData.hitId === child)
        .userData.offset.length() > 0,
    );
    const leaf = await loadDetailModel(child);
    assert.ok(leaf?.children.length, `Missing independent model for ${child}`);
    dispose(leaf);
  }
  dispose(view.root);
}
assert.equal(
  children.paraMicro.some((id) => /nucleol/i.test(id)),
  false,
);
console.log(
  "Containment, cutaway pili, nuclear hierarchy and exact geometry regression checks passed.",
);
