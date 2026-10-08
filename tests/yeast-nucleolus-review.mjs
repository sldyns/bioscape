import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import * as T from "three";
import { MeshBVH } from "three-mesh-bvh";

const project = fileURLToPath(new URL("../", import.meta.url));
const dir = await mkdtemp(join(tmpdir(), "bioscape-yeast-nucleolus-"));
const baseline = process.env.BIOSCAPE_YEAST_REVIEW_BASELINE;
function fingerprint(g, rootLandmarks) {
  const hash = createHash("sha256");
  g.traverse((o) => {
    hash.update(
      JSON.stringify([
        o.type,
        o.position.toArray(),
        o.quaternion.toArray(),
        o.scale.toArray(),
        o === g && rootLandmarks !== undefined
          ? { ...o.userData, landmarks: rootLandmarks }
          : o.userData,
      ]),
    );
    if (o.geometry) {
      for (const [key, attribute] of Object.entries(o.geometry.attributes)) {
        hash.update(key);
        hash.update(
          Buffer.from(
            attribute.array.buffer,
            attribute.array.byteOffset,
            attribute.array.byteLength,
          ),
        );
      }
      if (o.geometry.index) {
        const array = o.geometry.index.array;
        hash.update(
          Buffer.from(array.buffer, array.byteOffset, array.byteLength),
        );
      }
    }
    if (o.material)
      hash.update(
        JSON.stringify([
          o.material.color.toArray(),
          o.material.opacity,
          o.material.transparent,
          o.material.side,
          o.material.roughness,
          o.material.clearcoat,
          o.material.depthWrite,
        ]),
      );
  });
  return hash.digest("hex");
}
function dispose(g) {
  const geometries = new Set(),
    materials = new Set();
  g.traverse((o) => {
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) materials.add(o.material);
  });
  geometries.forEach((v) => v.dispose());
  materials.forEach((v) => v.dispose());
}
try {
  const outfile = join(dir, "models.mjs");
  await build({
    stdin: {
      contents: `export { nucleus } from './src/scene/microbeGeometry.js'; export { yeastDetail } from './src/scene/yeastDetails.js'; export { detailModel } from './src/scene/detailModels.js'; export { makePresentation } from './src/scene/presentation.js'; export { getNode } from './src/hierarchy.js'; export { parameciumDetail } from './src/scene/parameciumDetails.js';`,
      resolveDir: project,
    },
    bundle: true,
    platform: "node",
    format: "esm",
    outfile,
    logLevel: "silent",
    plugins: baseline
      ? [
          {
            name: "retained-yeast-baseline",
            setup(builder) {
              builder.onLoad(
                { filter: /src\/scene\/(microbeGeometry|yeastDetails)\.js$/ },
                async ({ path }) => ({
                  contents: await readFile(
                    join(baseline, basename(path)),
                    "utf8",
                  ),
                  loader: "js",
                  resolveDir: join(project, "src/scene"),
                }),
              );
            },
          },
        ]
      : [],
  });
  const {
    nucleus,
    yeastDetail,
    detailModel,
    makePresentation,
    getNode,
    parameciumDetail,
  } = await import(pathToFileURL(outfile));
  for (const [id, expectedIds] of [
    [
      "paraMacro",
      [
        "paraMacroChromatin",
        "paraMacroEnvelope",
        "paraMacroNucleoli",
        "paraMacroPores",
      ],
    ],
    [
      "paraMicro",
      ["paraMicroChromatin", "paraMicroEnvelope", "paraMicroPores"],
    ],
  ]) {
    const scene = makePresentation(
      null,
      id,
      detailModel(id, parameciumDetail(id)),
    );
    const parts = scene.parts.filter((part) => part.userData.hitId !== id);
    assert.deepEqual(
      parts.map((part) => part.userData.hitId).sort(),
      expectedIds,
      `${id} drilldown identities must all remain`,
    );
    const names = Object.fromEntries(
      ["zh", "en"].map((lang) => [
        lang,
        [
          ...parts.map((part) => getNode(part.userData.hitId, lang).name),
          ...scene.landmarks.map((mark) => mark[lang]),
        ],
      ]),
    );
    console.log(
      JSON.stringify({ check: "shared nuclear label identities", id, names }),
    );
    for (const [lang, labels] of Object.entries(names)) {
      assert.equal(
        labels.length,
        new Set(labels).size,
        `${id}: duplicate ${lang} landmark identity must not survive the actual presentation`,
      );
      assert.equal(
        labels.length,
        expectedIds.length,
        `${id}: unique ${lang} drilldown labels must not be lost`,
      );
    }
    for (const part of parts) {
      assert(
        part.children.length > 0,
        "A retained label requires actual geometry",
      );
      assert(
        part.userData.labelAnchor.toArray().every(Number.isFinite),
        "A retained label requires a finite anchor",
      );
    }
    dispose(scene.root);
  }
  // Keep the original full fingerprints: reconstruct only the two intentionally
  // removed root landmarks for that comparison. New full fingerprints below were
  // computed from pre-repair geometry with only those metadata entries removed.
  for (const [options, expected, labelsOnlyExpected = expected] of [
    [{}, "6e7449b7328aa4602e8236cff0619249ec6cf1b99e339275e5525422b19637de"],
    [
      {
        elongated: true,
        nucleoli: 4,
        parts: { envelope: "E", pores: "P", chromatin: "C", nucleoli: "N" },
      },
      "c761cea67b9cbfec87edc5d17af94991ade9d58f9d56e7fccd742ea1d42aa46e",
      "dbea3e948885a53c9bb7da48f3fdee963e0524f69e028c2172632e1c5cf0d596",
    ],
    [
      { nucleoli: 0, parts: { envelope: "E", pores: "P", chromatin: "C" } },
      "e2d18ca496937202ba5bca8754e8155ad9828ef0a05662f630773ddb57891239",
      "6ed996cca1456d3febf2507ee7670371821bc4e9756d1d259dad5c110aa7096c",
    ],
  ]) {
    const model = nucleus("reference", options);
    assert.equal(
      fingerprint(model),
      labelsOnlyExpected,
      "Shared nuclear geometry and metadata may change only by the exact intended landmark deletion",
    );
    assert.equal(
      fingerprint(model, [
        {
          zh: "核被膜",
          en: "Nuclear envelope",
          position: [options.elongated ? 1.15 : 0.9, 0, 0],
        },
        { zh: "染色质", en: "Chromatin", position: [0.25, 0.24, 0.2] },
      ]),
      expected,
      "Original geometry, materials, transforms, identities and part anchors must retain their pre-repair fingerprint",
    );
    dispose(model);
  }
  const model = yeastDetail("yeastNucleus");
  model.updateMatrixWorld(true);
  const bodies = model.children.filter(
    (o) => o.userData.hitId === "yeastNucleolus",
  );
  assert.equal(
    bodies.length,
    1,
    "The yeast nucleolus is one condensate, without a surrounding membrane layer",
  );
  const body = bodies[0];
  const bodyGeometry = body.geometry.clone().applyMatrix4(body.matrixWorld);
  const positions = bodyGeometry.attributes.position;
  const envelope = new T.Vector3(0.9 * 0.94, 0.94 * 0.94, 0.75 * 0.94);
  let minRadius = Infinity,
    maxRadius = 0,
    nearEnvelope = 0,
    middleInnerX = Infinity,
    endInnerX = Infinity;
  for (let i = 0; i < positions.count; i++) {
    const point = new T.Vector3()
      .fromBufferAttribute(positions, i)
      .divide(envelope);
    assert(point.toArray().every(Number.isFinite));
    const radius = point.length();
    minRadius = Math.min(minRadius, radius);
    maxRadius = Math.max(maxRadius, radius);
    nearEnvelope += Number(radius > 0.93);
    assert(
      radius <= 1 + 1e-6,
      "Nucleolar condensate must not penetrate the inner nuclear membrane",
    );
    if (Math.abs(point.z) < 0.015) {
      if (Math.abs(point.y) < 0.04)
        middleInnerX = Math.min(middleInnerX, point.x);
      if (Math.abs(point.y) > 0.55) endInnerX = Math.min(endInnerX, point.x);
    }
  }
  assert(
    maxRadius > 0.97,
    `Yeast nucleolus must be apposed to the nuclear envelope; maximum normalized radius is ${maxRadius}`,
  );
  assert(
    nearEnvelope / positions.count > 0.025,
    "Apposition must involve a region, not a stray vertex",
  );
  assert(minRadius > 0.35, "The crescent remains a peripheral structure");
  assert(
    endInnerX < middleInnerX - 0.1,
    "The inward contour must be concave, not an offset spherical body",
  );
  const tree = new MeshBVH(bodyGeometry);
  const rayDirection = new T.Vector3(0.871, 0.377, 0.311).normalize();
  const insideBody = (point) => {
    const hits = tree
      .raycast(new T.Ray(point, rayDirection), T.DoubleSide)
      .sort((a, b) => a.distance - b.distance);
    const crossings = hits.filter(
      (hit, i) =>
        i === 0 || Math.abs(hit.distance - hits[i - 1].distance) > 1e-7,
    );
    return crossings.length % 2 === 1;
  };
  const anchor = new T.Vector3(...model.userData.partAnchors.yeastNucleolus);
  assert(
    insideBody(anchor),
    "Nucleolar label anchor must move with the actual crescent",
  );
  let chromatinVertices = 0;
  for (const chromatin of model.children.filter(
    (o) => o.userData.hitId === "yeastChromatin",
  )) {
    assert(
      !tree.intersectsGeometry(chromatin.geometry, chromatin.matrixWorld),
      "Chromatin triangles must not intersect the nucleolar body",
    );
    const attribute = chromatin.geometry.attributes.position;
    for (let i = 0; i < attribute.count; i++) {
      const point = new T.Vector3()
        .fromBufferAttribute(attribute, i)
        .applyMatrix4(chromatin.matrixWorld);
      assert(
        !insideBody(point),
        "Chromatin must not lie inside the nucleolar body",
      );
      assert(
        point.clone().divide(envelope).length() < 1,
        "Deflecting chromatin must not push it across the inner membrane",
      );
      chromatinVertices++;
    }
  }
  assert(chromatinVertices > 1000);
  const overview = yeastDetail("yeast");
  overview.updateMatrixWorld(true);
  const overviewNucleus = overview.children.find(
    (o) =>
      o.isGroup &&
      o.children.some((child) => child.userData.hitId === "yeastNucleus"),
  );
  const overviewBody = overviewNucleus.children.find(
    (o) => o.isMesh && o.material.color.getHexString() === "9c7da9",
  );
  assert(overviewBody, "The overview must retain its nucleolus");
  assert.deepEqual(
    overviewBody.geometry.attributes.position.array,
    body.geometry.attributes.position.array,
    "Overview and nucleus drilldown must share the same crescent shape",
  );
  assert.deepEqual(overviewBody.position.toArray(), body.position.toArray());
  assert.deepEqual(
    overviewBody.quaternion.toArray(),
    body.quaternion.toArray(),
  );
  assert.deepEqual(overviewBody.scale.toArray(), body.scale.toArray());
  const presented = makePresentation(
    null,
    "yeastNucleus",
    detailModel("yeastNucleus", yeastDetail("yeastNucleus")),
  );
  const labelParts = presented.parts.filter(
    (part) => part.userData.hitId !== "yeastNucleus",
  );
  const partIds = labelParts.map((part) => part.userData.hitId).sort();
  assert.deepEqual(
    partIds,
    [
      "yeastChromatin",
      "yeastNuclearEnvelope",
      "yeastNuclearPores",
      "yeastNucleolus",
    ],
    "All four drilldown identities must remain available",
  );
  const labelsByLanguage = Object.fromEntries(
    ["zh", "en"].map((lang) => [
      lang,
      [
        ...labelParts.map((part) => getNode(part.userData.hitId, lang).name),
        ...presented.landmarks.map((mark) => mark[lang]),
      ],
    ]),
  );
  const labelAnchors = Object.fromEntries(
    labelParts.map((part) => {
      assert(
        part.children.length > 0,
        "A retained drilldown label needs real geometry",
      );
      assert(
        part.userData.labelAnchor.toArray().every(Number.isFinite),
        "Retained labels need finite anchors",
      );
      return [part.userData.hitId, part.userData.labelAnchor.toArray()];
    }),
  );
  console.log(
    JSON.stringify({
      check: "yeast nuclear label identities",
      labelsByLanguage,
      labelAnchors,
    }),
  );
  for (const [lang, labels] of Object.entries(labelsByLanguage))
    assert.equal(
      labels.length,
      new Set(labels).size,
      `Duplicate ${lang} nuclear label identity must not survive the presentation pipeline`,
    );
  dispose(presented.root);
  const partial = nucleus("reference", {
    nucleolusShape: "peripheral-crescent",
    parts: { envelope: "E" },
  });
  assert.deepEqual(
    partial.userData.landmarks.map((mark) => mark.en),
    ["Chromatin"],
    "A unique landmark must remain when no equivalent drilldown label exists",
  );
  dispose(partial);
  for (const parts of [
    { envelope: "E" },
    { envelope: "reference", chromatin: "reference" },
  ]) {
    const sharedPartial = nucleus("reference", { parts });
    assert.deepEqual(
      sharedPartial.userData.landmarks.map((mark) => mark.en),
      parts.envelope === "E"
        ? ["Chromatin"]
        : ["Nuclear envelope", "Chromatin"],
      "Unique landmarks remain unless a distinct drilldown part replaces their identity",
    );
    dispose(sharedPartial);
  }
  console.log(
    JSON.stringify({
      check: "yeast nucleolus review",
      sharedGeometryCasesUnchanged: 3,
      defaultFullMetadataUnchanged: 1,
      sharedLandmarkOnlyCases: 2,
      normalizedRadius: [minRadius, maxRadius],
      nearEnvelopeVertices: nearEnvelope,
      chromatinVertices,
      overviewMatchesDetail: true,
    }),
  );
  bodyGeometry.dispose();
  dispose(overview);
  dispose(model);
} finally {
  await rm(dir, { recursive: true, force: true });
}
