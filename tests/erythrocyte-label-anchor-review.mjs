import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as T from "three";
import { buildErythrocyte } from "../src/compare/models/erythrocyte.js";
import { packDetail, unpackDetail } from "../src/scene/detailTransfer.js";
import { createPresentationAppearance } from "../src/scene/presentationAppearance.js";

const temporary = await mkdtemp(join(tmpdir(), "bioscape-erythrocyte-anchor-"));
try {
  const outfile = join(temporary, "presentation.mjs");
  await build({
    stdin: {
      contents:
        'export { detailModel } from "./src/scene/detailModels.js"; export { makePresentation } from "./src/scene/presentation.js"; export { explodedFitDistance } from "./src/scene/viewFraming.js";',
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const { detailModel, makePresentation, explodedFitDistance } = await import(
    pathToFileURL(outfile)
  );
  const normalized = detailModel("erythrocyte", buildErythrocyte());
  const transferred = unpackDetail(
    structuredClone(packDetail(normalized).payload),
  );
  const presentation = makePresentation(null, "erythrocyte", transferred);
  const { root, parts } = presentation;
  const appearance = createPresentationAppearance(root);
  const membrane = parts.find(
    (p) => p.userData.hitId === "erythrocyteMembrane",
  );
  assert.ok(membrane, "membrane part must survive normalization and transfer");
  const records = [];
  for (const mode of ["whole", "section", "explode"]) {
    const amount = mode === "explode" ? 0.65 : 0;
    for (const part of parts)
      part.position
        .copy(part.userData.home)
        .addScaledVector(part.userData.offset, amount);
    appearance(mode, null, 1);
    root.updateMatrixWorld(true);
    const direction = new T.Vector3(
      ...(mode === "explode"
        ? [0.039221453908837085, 0.05098789008148812, 0.9979288113980451]
        : [0.05084271097105143, 0.06609552426236684, 0.9965171350326081]),
    ).normalize();
    const camera = new T.PerspectiveCamera(36, 1.5, 0.01, 100);
    camera.position.copy(direction).multiplyScalar(12);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const axes = [0, 1, 2].map((column) =>
      new T.Vector3().setFromMatrixColumn(camera.matrixWorld, column),
    );
    const distance = explodedFitDistance(parts, amount, 1.5, 36, axes);
    camera.position.copy(direction).multiplyScalar(distance * 1.0035);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const anchor = membrane.localToWorld(membrane.userData.labelAnchor.clone());
    const visible = [];
    root.traverseVisible((o) => {
      if (o.isMesh) visible.push(o);
    });
    const ray = new T.Raycaster(
      camera.position,
      anchor.clone().sub(camera.position).normalize(),
    );
    const hit = ray.intersectObjects(visible, false)[0];
    const error = hit ? hit.point.distanceTo(anchor) : null;
    const point = anchor.clone().project(camera);
    records.push({
      mode,
      visibleFirstHit: hit?.object.userData.hitId ?? null,
      anchorDistanceFromFirstSurface: error,
      anchorNdc: point.toArray(),
    });
    console.log(JSON.stringify(records.at(-1)));
  }
  for (const {
    mode,
    visibleFirstHit,
    anchorDistanceFromFirstSurface: error,
    anchorNdc,
  } of records) {
    assert.equal(
      visibleFirstHit,
      "erythrocyteMembrane",
      `${mode}: label ray must first hit the visible membrane, not a removed cap or background`,
    );
    assert.ok(
      error < 0.002,
      `${mode}: label anchor must lie on the first visible membrane surface (distance ${error})`,
    );
    assert.ok(
      Math.abs(anchorNdc[0]) < 0.9 && Math.abs(anchorNdc[1]) < 0.9,
      `${mode}: label endpoint must remain in the fitted viewport`,
    );
  }
  console.log(
    "Erythrocyte membrane anchor hits the first visible surface in whole, section and explode after normalization/transfer.",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
