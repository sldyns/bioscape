import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";

const temporary = await mkdtemp(
  join(tmpdir(), "bioscape-plant-stroma-review-"),
);
try {
  const outfile = join(temporary, "chloroplast.mjs");
  await build({
    stdin: {
      contents:
        'export { chloroplastAssembly, thylakoidField, thylakoidSamples } from "./src/scene/chloroplastDetails.js";',
      resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const { chloroplastAssembly, thylakoidField, thylakoidSamples } =
    await import(pathToFileURL(outfile));

  const interiorScale = 0.87;
  const innerEnvelope = [1.273, 0.543, 0.583];
  const requiredClearance = 0.008;
  const samples = thylakoidSamples();
  const field = (p) =>
    thylakoidField(
      samples,
      p.map((x) => x / interiorScale),
    );
  const envelopeField = (p) =>
    p.reduce((q, x, i) => q + (x / innerEnvelope[i]) ** 2, 0);
  const scene = chloroplastAssembly();
  scene.rotation.set(0, 0, 0);
  scene.updateMatrixWorld(true);
  const markers = [],
    thylakoidTrees = [],
    envelopeTrees = [],
    thylakoidHash = createHash("sha256"),
    envelopeHash = createHash("sha256");
  scene.traverse((mesh) => {
    if (!mesh.isMesh) return;
    const id = mesh.userData.hitId;
    if (id === "stroma") {
      markers.push(mesh);
      return;
    }
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    const position = geometry.attributes.position;
    const hash = id === "thylakoids" ? thylakoidHash : envelopeHash;
    for (const attr of Object.values(geometry.attributes))
      hash.update(
        new Uint8Array(
          attr.array.buffer,
          attr.array.byteOffset,
          attr.array.byteLength,
        ),
      );
    hash.update(new Uint8Array(geometry.index.array.buffer));
    if (id === "thylakoids") {
      thylakoidTrees.push(new MeshBVH(geometry));
    } else {
      // Identify the true inner face of the inner envelope, including its cap.
      // Other shell faces and illustrative cut rims do not satisfy this equation.
      let onInnerFace = !mesh.userData.cutOnly;
      for (let i = 0; onInnerFace && i < position.count; i++) {
        const p = [position.getX(i), position.getY(i), position.getZ(i)];
        onInnerFace = Math.abs(envelopeField(p) - 1) < 2e-6;
      }
      if (onInnerFace) envelopeTrees.push(new MeshBVH(geometry));
      else geometry.dispose();
    }
  });
  assert.equal(markers.length, 24, "retain every stromal marker");
  assert.equal(
    envelopeTrees.length,
    2,
    "inspect both inner-envelope surface pieces",
  );
  const metrics = {
    markerCount: markers.length,
    markerVertices: 0,
    centersInsideThylakoids: 0,
    verticesInsideThylakoids: 0,
    verticesOutsideEnvelope: 0,
    minThylakoidClearance: Infinity,
    minEnvelopeClearance: Infinity,
    thylakoidGeometrySHA256: thylakoidHash.digest("hex"),
    envelopeGeometrySHA256: envelopeHash.digest("hex"),
  };
  const point = new THREE.Vector3();
  const centers = [];
  for (const marker of markers) {
    const center = marker.getWorldPosition(new THREE.Vector3());
    centers.push(center.toArray());
    const scale = marker.getWorldScale(new THREE.Vector3());
    assert.deepEqual(marker.scale.toArray(), [0.037, 0.035, 0.038]);
    assert.equal(marker.geometry.parameters.widthSegments, 32);
    assert.equal(marker.geometry.parameters.heightSegments, 24);
    // This enclosing sphere covers the full marker volume, not just its vertices.
    // Distance to actual triangles independently checks the rendered membranes.
    const radius = Math.max(scale.x, scale.y, scale.z);
    for (const [trees, key] of [
      [thylakoidTrees, "minThylakoidClearance"],
      [envelopeTrees, "minEnvelopeClearance"],
    ]) {
      const gap =
        Math.min(
          ...trees.map((tree) => tree.closestPointToPoint(center).distance),
        ) - radius;
      metrics[key] = Math.min(metrics[key], gap);
    }
    metrics.centersInsideThylakoids += field(center.toArray()) >= 0;
    assert(
      envelopeField(center.toArray()) < 1,
      "stromal center must be inside the envelope",
    );
    const vertices = marker.geometry.attributes.position;
    metrics.markerVertices += vertices.count;
    for (let i = 0; i < vertices.count; i++) {
      point.fromBufferAttribute(vertices, i).applyMatrix4(marker.matrixWorld);
      assert(point.toArray().every(Number.isFinite));
      metrics.verticesInsideThylakoids += field(point.toArray()) >= 0;
      metrics.verticesOutsideEnvelope += envelopeField(point.toArray()) >= 1;
    }
  }
  console.log(JSON.stringify(metrics));
  assert.equal(
    metrics.centersInsideThylakoids,
    0,
    "stromal centers must be outside thylakoids",
  );
  assert.equal(
    metrics.verticesInsideThylakoids,
    0,
    "entire stromal markers must stay outside thylakoids",
  );
  assert.equal(
    metrics.verticesOutsideEnvelope,
    0,
    "stromal markers must stay within the inner envelope",
  );
  assert(
    metrics.minThylakoidClearance > requiredClearance,
    "full marker volume must clear the actual thylakoid mesh",
  );
  assert(
    metrics.minEnvelopeClearance > requiredClearance,
    "full marker volume must clear the actual inner envelope mesh",
  );
  const repeat = chloroplastAssembly();
  repeat.rotation.set(0, 0, 0);
  repeat.updateMatrixWorld(true);
  const repeatedCenters = [];
  repeat.traverse((mesh) => {
    if (mesh.isMesh && mesh.userData.hitId === "stroma")
      repeatedCenters.push(
        mesh.getWorldPosition(new THREE.Vector3()).toArray(),
      );
  });
  assert.deepEqual(
    repeatedCenters,
    centers,
    "marker placement must be deterministic",
  );
  for (const tree of [...thylakoidTrees, ...envelopeTrees])
    tree.geometry.dispose();
  for (const root of [scene, repeat])
    root.traverse((mesh) => {
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    });
  console.log(
    "Plant stromal markers preserve count, precision, determinism and compartment clearance.",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
