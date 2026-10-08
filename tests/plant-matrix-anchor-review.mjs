import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as T from "three";
import { MeshBVH } from "three-mesh-bvh";

const dnaColors = new Set(["8c9daa", "aaa0bc", "bfbbc7"]);
const dnaName = "DNA segment · Not a full genome";
const oldAnchor = [0.15, 0.1, 0.42];
const temporary = await mkdtemp(
  join(tmpdir(), "bioscape-plant-matrix-anchor-"),
);

function geometrySummary(root) {
  root.updateMatrixWorld(true);
  const hash = createHash("sha256");
  let meshes = 0;
  let vertices = 0;
  root.traverse((mesh) => {
    if (!mesh.isMesh) return;
    meshes++;
    vertices += mesh.geometry.attributes.position.count;
    hash.update(
      JSON.stringify([
        mesh.userData,
        mesh.matrixWorld.elements,
        mesh.material.color.toArray(),
      ]),
    );
    for (const [name, attr] of Object.entries(mesh.geometry.attributes)) {
      hash.update(JSON.stringify([name, attr.itemSize, attr.normalized]));
      hash.update(
        new Uint8Array(
          attr.array.buffer,
          attr.array.byteOffset,
          attr.array.byteLength,
        ),
      );
    }
    const index = mesh.geometry.index;
    if (index)
      hash.update(
        new Uint8Array(
          index.array.buffer,
          index.array.byteOffset,
          index.array.byteLength,
        ),
      );
  });
  return { meshes, vertices, sha256: hash.digest("hex") };
}

function assertRawSurface(record) {
  assert.ok(
    record.rawDNADistance < 0.001,
    "DNA landmark must be within 0.001 of an actual DNA triangle",
  );
}

function assertVisibleSurface(record) {
  assert.ok(
    record.views.every(
      (view) =>
        view.firstHitIsDNA &&
        view.firstSurfaceDistance !== null &&
        view.firstSurfaceDistance < 0.002,
    ),
    "DNA landmark must reach the first visible DNA surface within 0.002 in whole and section",
  );
}

try {
  const outfile = join(temporary, "models.mjs");
  await build({
    stdin: {
      contents:
        'export { plantOrganelleDetail } from "./src/scene/plantOrganelleDetails.js"; export { detailModel } from "./src/scene/detailModels.js"; export { packDetail, unpackDetail } from "./src/scene/detailTransfer.js"; export { makePresentation } from "./src/scene/presentation.js"; export { createPresentationAppearance } from "./src/scene/presentationAppearance.js"; export { explodedFitDistance } from "./src/scene/viewFraming.js";',
      resolveDir: fileURLToPath(new URL("..", import.meta.url)),
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const {
    plantOrganelleDetail,
    detailModel,
    packDetail,
    unpackDetail,
    makePresentation,
    createPresentationAppearance,
    explodedFitDistance,
  } = await import(pathToFileURL(outfile));

  function inspect(anchorOverride) {
    const raw = plantOrganelleDetail("plantMatrix");
    const landmarks = raw.userData.landmarks;
    const dna = landmarks.find((l) => l.en === dnaName);
    assert.ok(dna, "retain the DNA segment landmark");
    if (anchorOverride) dna.position = [...anchorOverride];
    assert.equal(landmarks.length, 3);
    for (const lang of ["zh", "en"])
      assert.equal(new Set(landmarks.map((l) => l[lang])).size, 3);
    assert.deepEqual(
      landmarks.filter((l) => l.en !== dnaName),
      [
        {
          zh: "代谢酶轮廓",
          en: "Metabolic enzyme silhouettes",
          position: [0.49, 0, 0],
        },
        {
          zh: "水和小分子标记",
          en: "Water and small-solute markers",
          position: [0.8, 0, 0],
        },
      ],
    );
    assert.equal(dna.zh, "DNA片段 · 非完整基因组");
    assert.ok(dna.position.every(Number.isFinite));
    const geometry = geometrySummary(raw);
    const foundColors = new Set();
    let rawDNADistance = Infinity;
    raw.traverse((mesh) => {
      if (!mesh.isMesh) return;
      const color = mesh.material.color.getHexString();
      if (!dnaColors.has(color)) return;
      foundColors.add(color);
      const copy = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
      const tree = new MeshBVH(copy);
      rawDNADistance = Math.min(
        rawDNADistance,
        tree.closestPointToPoint(new T.Vector3(...dna.position)).distance,
      );
      copy.dispose();
    });
    assert.deepEqual([...foundColors].sort(), [...dnaColors].sort());
    const transferred = unpackDetail(
      structuredClone(packDetail(detailModel("plantMatrix", raw)).payload),
    );
    const presentation = makePresentation(null, "plantMatrix", transferred);
    const appearance = createPresentationAppearance(presentation.root);
    const anchor = presentation.landmarks.find(
      (l) => l.en === dnaName,
    ).position;
    assert.ok(anchor.toArray().every(Number.isFinite));
    const camera = new T.PerspectiveCamera(36, 1.5, 0.01, 100);
    const direction = new T.Vector3(
      0.05084271097105143,
      0.06609552426236684,
      0.9965171350326081,
    );
    camera.position.copy(direction).multiplyScalar(12);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const axes = [0, 1, 2].map((i) =>
      new T.Vector3().setFromMatrixColumn(camera.matrixWorld, i),
    );
    const distance = explodedFitDistance(presentation.parts, 0, 1.5, 36, axes);
    camera.position
      .copy(direction)
      .multiplyScalar(distance * 1.0034950377117984);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    const views = [];
    for (const mode of ["whole", "section"]) {
      appearance(mode, null, 1);
      presentation.root.updateMatrixWorld(true);
      const visible = [];
      presentation.root.traverseVisible((o) => {
        if (o.isMesh) visible.push(o);
      });
      const ray = new T.Raycaster(
        camera.position,
        anchor.clone().sub(camera.position).normalize(),
      );
      const first = ray.intersectObjects(visible, false)[0];
      const firstHitColor = first?.object.material.color.getHexString() ?? null;
      views.push({
        mode,
        firstHitColor,
        firstHitIsDNA: dnaColors.has(firstHitColor),
        firstSurfaceDistance: first ? first.point.distanceTo(anchor) : null,
      });
    }
    for (const root of [raw, transferred, presentation.root])
      root.traverse((mesh) => {
        mesh.geometry?.dispose();
        mesh.material?.dispose();
      });
    return { anchor: dna.position, geometry, rawDNADistance, views };
  }

  const negativeControl = inspect(oldAnchor);
  assert.throws(() => assertRawSurface(negativeControl), /actual DNA triangle/);
  assert.throws(
    () => assertVisibleSurface(negativeControl),
    /first visible DNA surface/,
  );
  console.log(JSON.stringify({ negativeControl, expectedFailedChecks: 2 }));

  const current = inspect();
  assert.deepEqual(
    current.geometry,
    negativeControl.geometry,
    "anchor-only negative control must preserve all geometry and transforms",
  );
  const failedChecks = [];
  for (const [name, check] of [
    ["actual-DNA-triangle-distance", assertRawSurface],
    ["visible-DNA-surface-after-transfer", assertVisibleSurface],
  ]) {
    try {
      check(current);
    } catch (error) {
      if (!(error instanceof assert.AssertionError)) throw error;
      failedChecks.push(name);
    }
  }
  console.log(JSON.stringify({ current, failedChecks }));
  assert.deepEqual(
    failedChecks,
    [],
    "current source DNA anchor checks must pass",
  );
  console.log(
    "Plant matrix DNA label reaches its visible DNA surface after transfer; both old-anchor controls fail, with geometry and other labels preserved.",
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
