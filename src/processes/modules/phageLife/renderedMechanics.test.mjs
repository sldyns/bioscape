import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import * as THREE from "three";

const models = process.env.PHAGE_RENDER_MODELS
  ? await import(pathToFileURL(process.env.PHAGE_RENDER_MODELS).href)
  : {
      assembly: (await import("./phageAssemblyProcess.js")).default,
      packaging: (await import("./phagePackagingProcess.js")).default,
    };
const only = process.env.PHAGE_RENDER_ONLY;
const measurements = [];
process.on("exit", () => {
  if (process.env.PHAGE_RENDER_MEASUREMENTS)
    writeFileSync(
      process.env.PHAGE_RENDER_MEASUREMENTS,
      JSON.stringify(measurements, null, 2) + "\n",
    );
});
function effective(object) {
  for (let o = object; o; o = o.parent) if (!o.visible) return false;
  return true;
}
function actualMeshes(root) {
  const meshes = [];
  root.traverse((o) => {
    if (!o.isMesh || !effective(o)) return;
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        const local = new THREE.Matrix4();
        o.getMatrixAt(i, local);
        meshes.push([o.geometry, o.matrixWorld.clone().multiply(local)]);
      }
    } else meshes.push([o.geometry, o.matrixWorld]);
  });
  return meshes;
}
function surface(root) {
  const bounds = new THREE.Box3(),
    triangles = [];
  for (const [geometry, matrix] of actualMeshes(root)) {
    const position = geometry.attributes.position;
    const vertices = Array.from({ length: position.count }, (_, i) =>
      new THREE.Vector3().fromBufferAttribute(position, i).applyMatrix4(matrix),
    );
    for (const vertex of vertices) bounds.expandByPoint(vertex);
    const index = geometry.index;
    const count = index ? index.count : position.count;
    for (let i = 0; i < count; i += 3)
      triangles.push(
        new THREE.Triangle(
          ...[0, 1, 2].map((j) => vertices[index ? index.getX(i + j) : i + j]),
        ),
      );
  }
  return { bounds, triangles };
}
if (!only || only === "assembly") {
  const scene = models.assembly.create();
  const fragments = scene.group.children.filter(
    (o) => o.isMesh && o.material?.color?.getHexString() === "b8b19d",
  );
  assert.equal(fragments.length, 9);
  for (const p of [0.330001, 0.345, 0.36, 0.39, 0.42, 0.46, 0.479999]) {
    scene.update(p, { protease: "active" });
    for (const mesh of fragments) {
      assert(mesh.visible);
      for (const [axis, maximum] of [
        ["x", 0.055],
        ["y", 0.09],
        ["z", 0.05],
      ])
        assert(
          mesh.scale[axis] <= maximum + 1e-12,
          `scaffold fragment ${axis} radius exceeds its initial peptide scale at ${p}`,
        );
      assert(Math.abs(mesh.scale.x / mesh.scale.y - 0.055 / 0.09) < 1e-10);
      assert(Math.abs(mesh.scale.z / mesh.scale.y - 0.05 / 0.09) < 1e-10);
    }
    measurements.push({
      model: "assembly",
      progress: p,
      fragmentScale: fragments[0].scale.toArray(),
    });
  }
  for (const edge of [0.33, 0.48]) {
    const extent = [];
    for (const p of [edge - 1e-6, edge, edge + 1e-6]) {
      scene.update(p, { protease: "active" });
      extent.push(fragments[0].visible ? fragments[0].scale.length() : 0);
    }
    assert(
      Math.max(...extent) < 1e-7,
      "fragment appearance/disappearance has zero-size limits",
    );
  }
  for (const p of [0, 0.33, 0.48, 0.7, 1]) {
    scene.update(p, { protease: "inactive" });
    assert(fragments.every((mesh) => !mesh.visible));
  }
  console.log(
    "PASS 20261004-phageLife-05: peptide-scale fragments preserve axis ratios, vanish continuously and stay absent without gp21",
  );
}
if (!only || only === "packaging") {
  const scene = models.packaging.create();
  const external = scene.group.getObjectByName("T4-packaging-external-DNA");
  const head = scene.group.getObjectByName(
    "packaged-dsDNA-with-basepairs",
  ).parent;
  const portal = head.children.find((o) => o.isGroup && o.position.y === -1.6);
  const neck = head.children.find((o) => o.isGroup && o.position.y === -1.78);
  assert(portal && neck);
  for (const p of [0.85, 0.88, 0.92, 0.935, 0.96, 1]) {
    scene.update(p, { atp: "present" });
    scene.group.updateMatrixWorld(true);
    const outer = surface(external),
      port = surface(portal),
      seal = surface(neck);
    const machinery = port.bounds.clone().union(seal.bounds);
    const axialGap = machinery.min.y - outer.bounds.max.y;
    const endpoints = ["bb975f", "d2b47d"].map((color) => {
      const points = external.children
        .filter(
          (o) => effective(o) && o.material?.color?.getHexString() === color,
        )
        .flatMap((o) =>
          [-0.5, 0.5].map((y) =>
            new THREE.Vector3(0, y, 0).applyMatrix4(o.matrixWorld),
          ),
        );
      return points.reduce((a, b) => (a.y > b.y ? a : b));
    });
    const triangles = [...port.triangles, ...seal.triangles],
      closest = new THREE.Vector3();
    const endpointSurfaceDistances = endpoints.map((endpoint) => {
      let minimum = Infinity;
      for (const triangle of triangles) {
        triangle.closestPointToPoint(endpoint, closest);
        minimum = Math.min(minimum, closest.distanceTo(endpoint));
      }
      return minimum;
    });
    measurements.push({
      model: "packaging",
      progress: p,
      externalTopY: outer.bounds.max.y,
      portalSealBottomY: machinery.min.y,
      axialGap,
      endpointSurfaceDistances,
    });
  }
  const cuts = measurements.filter((row) => row.model === "packaging");
  assert(
    cuts.every((row) => row.axialGap > 0.2),
    `cut product must clear actual portal/seal surfaces after completed cleavage; gaps=${cuts.map((row) => `${row.progress}:${row.axialGap}`).join(",")}`,
  );
  assert(
    cuts.every((row) =>
      row.endpointSurfaceDistances.every((distance) => distance > 0.2),
    ),
  );
  for (const edge of [0.79, 0.82, 0.85, 0.92]) {
    scene.update(edge - 1e-6, { atp: "present" });
    const before = external.position.clone();
    scene.update(edge + 1e-6, { atp: "present" });
    assert(
      before.distanceTo(external.position) < 1e-3,
      "cut-product translation stays continuous",
    );
  }
  for (const p of [0, 0.5, 0.85, 1]) {
    scene.update(p, { atp: "absent" });
    assert(Math.abs(external.position.y) < 1e-12);
    assert.equal(neck.visible, false);
    assert.equal(
      head.getObjectByName("packaged-dsDNA-with-basepairs").visible,
      false,
    );
  }
  console.log(
    "PASS 20261004-phageLife-06: actual downstream cut-product surfaces clear portal/neck by >0.2 units; ATP absence preserves stall",
  );
}
