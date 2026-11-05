import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as THREE from "three";

const tolerance = 1e-6;
const vector = (point) =>
  point.isVector3 ? point.clone() : new THREE.Vector3(...point);
function close(actual, expected, message) {
  const error = vector(actual).distanceTo(vector(expected));
  assert(error <= tolerance, `${message}: coordinate error ${error}`);
}
function dispose(root) {
  const geometries = new Set(),
    materials = new Set();
  root?.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) materials.add(object.material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

// Check an actual model feature independently of annotation metadata: the
// purple binding-end sphere, or the top of the motor's hollow axial rod.
function physicalFeature(raw, id) {
  let point = null;
  raw.traverse((object) => {
    if (!object.isMesh || point) return;
    if (id === "pili" && object.material.color.getHexString() === "b6a0bd")
      point = object.getWorldPosition(new THREE.Vector3());
    if (id === "flagellarMotor" && object.userData.hitId === "motorBushing") {
      object.geometry.computeBoundingBox();
      const bounds = object.geometry.boundingBox;
      if (bounds.max.y - bounds.min.y > 0.9)
        point = object.localToWorld(new THREE.Vector3(0, bounds.max.y, 0));
    }
  });
  assert(point, `${id}: the protected physical feature exists`);
  return point;
}

const temporary = await mkdtemp(join(tmpdir(), "bioscape-annotation-targets-"));
try {
  const outfile = join(temporary, "pipeline.mjs");
  await build({
    stdin: {
      contents: `
        export { bacterialAppendageDetail } from "./src/scene/bacterialAppendageDetails.js";
        export { detailModel } from "./src/scene/detailModels.js";
        export { packDetail, unpackDetail } from "./src/scene/detailTransfer.js";
        export { makePresentation } from "./src/scene/presentation.js";
      `,
      resolveDir: fileURLToPath(new URL("../", import.meta.url)),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
    plugins: [
      {
        name: "shared-three-runtime",
        setup(builder) {
          builder.onResolve({ filter: /^three(?:\/.*)?$/ }, ({ path }) => ({
            path: import.meta.resolve(path),
            external: true,
          }));
        },
      },
    ],
  });
  const {
    bacterialAppendageDetail,
    detailModel,
    packDetail,
    unpackDetail,
    makePresentation,
  } = await import(pathToFileURL(outfile).href);

  for (const [id, protectedPart, targetCount] of [
    ["pili", "pilusTip", 3],
    ["flagellarMotor", "motorBushing", 1],
    ["pilusTip", null, 0],
    ["flagellum", null, 0],
  ]) {
    const raw = bacterialAppendageDetail(id);
    assert(raw, `${id}: real appendage model exists`);
    raw.updateMatrixWorld(true);
    const sourceTargets = structuredClone(raw.annotationTargets || {}),
      sourceAnchors = structuredClone(raw.userData.partAnchors || {}),
      sourceLandmarks = structuredClone(raw.userData.landmarks || []),
      worldMatrix = raw.matrixWorld.clone(),
      normalizedTargets = Object.fromEntries(
        Object.entries(sourceTargets).map(([part, points]) => [
          part,
          points.map((point) => vector(point).applyMatrix4(worldMatrix)),
        ]),
      ),
      normalizedAnchors = Object.fromEntries(
        Object.entries(sourceAnchors).map(([part, point]) => [
          part,
          vector(point).applyMatrix4(worldMatrix),
        ]),
      );
    if (protectedPart) {
      assert.deepEqual(Object.keys(sourceTargets), [protectedPart]);
      assert.equal(sourceTargets[protectedPart].length, targetCount);
      const feature = physicalFeature(raw, id);
      assert(
        normalizedTargets[protectedPart].some(
          (point) => point.distanceTo(feature) <= tolerance,
        ),
        `${id}: extra targets include the real small feature`,
      );
    } else {
      assert.equal(raw.annotationTargets, undefined);
      assert.equal(raw.userData.partAnnotationTargets, undefined);
    }

    let normalized, transferred, presentation;
    try {
      normalized = detailModel(id, raw);
      transferred = unpackDetail(
        structuredClone(packDetail(normalized).payload),
      );
      for (const [stage, model] of [
        ["normalized", normalized],
        ["worker round trip", transferred],
      ]) {
        if (protectedPart) {
          const targets = model.userData.partAnnotationTargets;
          assert.deepEqual(Object.keys(targets), [protectedPart]);
          assert.equal(targets[protectedPart].length, targetCount);
          targets[protectedPart].forEach((point, index) =>
            close(
              point,
              normalizedTargets[protectedPart][index],
              `${id} ${stage}: protected point ${index}`,
            ),
          );
        } else
          assert.equal(
            model.userData.partAnnotationTargets,
            undefined,
            `${id} ${stage}: nested models must not leak protection metadata`,
          );
        for (const [part, anchor] of Object.entries(normalizedAnchors))
          close(
            model.userData.partAnchors[part],
            anchor,
            `${id} ${stage}: original ${part} label anchor`,
          );
        assert.equal(model.userData.landmarks.length, sourceLandmarks.length);
      }

      // Presentation recenters the complete merged geometry and scales its
      // longest dimension to 5.4. Expected points use that same physical frame,
      // independently of the part-local metadata being checked below.
      const bounds = new THREE.Box3().setFromObject(transferred),
        center = bounds.getCenter(new THREE.Vector3()),
        size = bounds.getSize(new THREE.Vector3()),
        scale = 5.4 / Math.max(size.x, size.y, size.z, 0.01),
        inPresentation = (point) =>
          vector(point).sub(center).multiplyScalar(scale);
      presentation = makePresentation(null, id, transferred);
      const { root, parts, landmarks } = presentation;
      root.updateMatrixWorld(true);
      assert.deepEqual(
        parts
          .map((part) => part.userData.hitId)
          .filter((part) => part !== id)
          .sort(),
        Object.keys(sourceAnchors).sort(),
        `${id}: extra targets do not create visible child-part labels`,
      );
      assert.equal(landmarks.length, sourceLandmarks.length);
      landmarks.forEach((landmark, index) => {
        const { position, ...text } = landmark;
        const { position: sourcePosition, ...sourceText } =
          sourceLandmarks[index];
        assert.deepEqual(text, sourceText, `${id}: landmark text is unchanged`);
        close(
          position,
          inPresentation(vector(sourcePosition).applyMatrix4(worldMatrix)),
          `${id}: original landmark ${index}`,
        );
      });

      for (const part of parts) {
        const key = part.userData.hitId;
        if (key === protectedPart)
          assert.equal(part.userData.annotationTargets.length, targetCount);
        else
          assert.equal(
            part.userData.annotationTargets,
            undefined,
            `${id}: protection must stay on its owning part`,
          );
      }
      for (const amount of [0, 0.65]) {
        for (const part of parts)
          part.position
            .copy(part.userData.home)
            .addScaledVector(part.userData.offset, amount);
        root.updateMatrixWorld(true);
        for (const part of parts) {
          const key = part.userData.hitId,
            displacement = part.userData.offset.clone().multiplyScalar(amount);
          if (normalizedAnchors[key])
            close(
              part.localToWorld(part.userData.labelAnchor.clone()),
              inPresentation(normalizedAnchors[key]).add(displacement),
              `${id} amount ${amount}: original ${key} leader stays attached`,
            );
          if (key === protectedPart)
            part.userData.annotationTargets.forEach((point, index) =>
              close(
                part.localToWorld(point.clone()),
                inPresentation(normalizedTargets[key][index]).add(displacement),
                `${id} amount ${amount}: protected point ${index} follows its part`,
              ),
            );
        }
      }
      assert.deepEqual(raw.annotationTargets || {}, sourceTargets);
    } finally {
      dispose(normalized);
      dispose(presentation?.root || transferred);
    }
  }
  console.log(
    "Structure annotation targets: physical features, normalization, worker transfer, original leaders, explosion and model isolation PASS (4 models)",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
