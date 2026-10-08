import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { MeshBVH, acceleratedRaycast } from "three-mesh-bvh";
import {
  ribosomeAssembly,
  ribosomeBody,
  ribosomeDetail,
} from "../src/scene/ribosomeDetails.js";

const displayedView = new THREE.Vector3(
  0.05084271097105143,
  0.06609552426236684,
  0.9965171350326081,
).normalize();
const view = displayedView
  .clone()
  .applyQuaternion(
    new THREE.Quaternion()
      .setFromEuler(new THREE.Euler(0.18, -0.2, -0.06))
      .invert(),
  );
const hash = (value) => createHash("sha256").update(value).digest("hex");
function geometryBins(group, id) {
  group.updateMatrixWorld(true);
  const bins = new Map();
  group.traverse((mesh) => {
    if (!mesh.isMesh || mesh.userData.hitId !== id) return;
    const attributes = Object.entries(mesh.geometry.attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, attr]) => [
        name,
        attr.itemSize,
        attr.normalized,
        attr.array.constructor.name,
        hash(
          Buffer.from(
            attr.array.buffer,
            attr.array.byteOffset,
            attr.array.byteLength,
          ),
        ),
      ]);
    const key = JSON.stringify([
      attributes,
      mesh.matrixWorld.elements,
      mesh.material.color.getHexString(),
    ]);
    if (!bins.has(key)) bins.set(key, []);
    const indices = mesh.geometry.index.array;
    for (let i = 0; i < indices.length; i += 3)
      bins.get(key).push(`${indices[i]},${indices[i + 1]},${indices[i + 2]}`);
  });
  return [...bins]
    .map(([key, triangles]) => [key, triangles.sort()])
    .sort(([a], [b]) => a.localeCompare(b));
}
function prepare(bound) {
  const group = ribosomeAssembly({ bound });
  group.updateMatrixWorld(true);
  const meshes = [];
  group.traverse((mesh) => {
    if (!mesh.isMesh) return;
    mesh.geometry.boundsTree = new MeshBVH(mesh.geometry, { indirect: true });
    mesh.raycast = acceleratedRaycast;
    meshes.push(mesh);
  });
  const units = group.children.filter((obj) => obj.isGroup);
  assert.equal(units.length, 2, "P and E tRNA sites remain occupied");
  const samples = {};
  units.forEach((unit, index) => {
    const tag = index === 0 ? "P" : "E";
    unit.traverse((mesh) => {
      if (mesh.isMesh) mesh.userData.auditPart = tag;
    });
    const main = unit.children.find((mesh) => mesh.geometry?.parameters?.path);
    samples[tag] = Array.from({ length: 61 }, (_, i) =>
      main.geometry.parameters.path
        .getPoint(i / 60)
        .applyMatrix4(main.matrixWorld),
    );
  });
  const messenger = meshes.find((mesh) => mesh.userData.hitId === "mrna");
  samples.mrna = Array.from({ length: 41 }, (_, i) =>
    messenger.geometry.parameters.path
      .getPoint(i / 40)
      .applyMatrix4(messenger.matrixWorld),
  );
  const eye = new THREE.Box3()
    .setFromObject(group)
    .getCenter(new THREE.Vector3())
    .addScaledVector(view, 8);
  const ray = new THREE.Raycaster();
  ray.firstHitOnly = true;
  const hit = (point, section) => {
    ray.set(eye, point.clone().sub(eye).normalize());
    return ray.intersectObjects(
      meshes.filter((mesh) => !section || !mesh.userData.cap),
      false,
    )[0];
  };
  const coverage = (section) =>
    Object.fromEntries(
      Object.entries(samples).map(([tag, points]) => [
        tag,
        points.filter((point) => {
          const first = hit(point, section)?.object;
          return (first?.userData.auditPart || first?.userData.hitId) === tag;
        }).length / points.length,
      ]),
    );
  return { group, meshes, hit, coverage };
}
function dispose(group) {
  group.traverse((obj) => {
    obj.geometry?.dispose();
    obj.material?.dispose();
  });
}
const original = ribosomeBody();
const results = [];
for (const bound of [false, true]) {
  const model = prepare(bound);
  const caps = model.meshes.filter((mesh) => mesh.userData.cap);
  assert.ok(caps.length > 0, "assembly provides a switchable teaching cutaway");
  assert.ok(caps.every((mesh) => mesh.userData.hitId === "smallSubunit"));
  assert.ok(caps.every((mesh) => mesh.geometry.index.count > 0));
  assert.deepEqual(
    geometryBins(model.group, "smallSubunit"),
    geometryBins(original, "smallSubunit"),
    "Whole must preserve every original triangle, vertex attribute, material color and transform",
  );
  const section = model.coverage(true),
    whole = model.coverage(false);
  assert.ok(
    section.P > 0.75 && section.E > 0.75,
    "both occupied tRNA backbones must be visible through the opening",
  );
  assert.ok(section.mrna > 0.95, "the messenger path must remain readable");
  assert.ok(whole.P < 0.1, "Whole restores the enclosing schematic shell");
  for (const [part, position] of Object.entries(
    model.group.userData.partAnchors,
  )) {
    const point = new THREE.Vector3(...position),
      first = model.hit(point, true);
    assert.equal(
      first?.object.userData.hitId,
      part,
      `${part} anchor must first meet the intended visible part`,
    );
    assert.ok(
      first.point.distanceTo(point) < 1e-5,
      `${part} anchor must lie on the visible surface`,
    );
  }
  const landmark = model.group.userData.landmarks.find(
    (label) => label.zh === "教学示意剖口",
  );
  assert.equal(landmark.en, "Illustrative cutaway");
  assert.deepEqual(landmark.visibleModes, ["section"]);
  assert.equal(
    model.hit(new THREE.Vector3(...landmark.position), true).object.userData
      .hitId,
    "smallSubunit",
  );
  results.push({ bound, section, whole });
  dispose(model.group);
}
for (const id of ["largeSubunit", "smallSubunit"]) {
  const single = ribosomeDetail(id);
  assert.equal(
    single.children.filter((mesh) => mesh.userData.cap).length,
    0,
    "standalone subunit stays complete",
  );
  dispose(single);
}
dispose(original);
console.log(
  "Ribosome cutaway: original Whole triangles preserved; P/E tRNA and mRNA visible in Section; all anchors on intended surfaces.",
  JSON.stringify(results),
);
